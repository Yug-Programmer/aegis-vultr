import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import {
  sha256Hex,
  type BrowserActionRequest,
  type BrowserInteractiveElement,
  type BrowserSnapshot,
  type NetworkPolicyMode,
} from '@aegis/shared';

function findLocalChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH && fs.existsSync(process.env.PLAYWRIGHT_EXECUTABLE_PATH)) {
    return process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  }

  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : [
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
        ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

export async function probeBrowserAvailability(): Promise<boolean> {
  if (findLocalChromiumExecutable()) return true;
  try {
    const execPath = chromium.executablePath();
    return Boolean(execPath && fs.existsSync(execPath));
  } catch {
    return false;
  }
}

export function isUrlBlockedByContainment(
  rawUrl: string,
  opts: {
    networkMode: NetworkPolicyMode;
    allowedDomains: string[];
    blockCloudMetadata: boolean;
    blockPrivateNetworks: boolean;
  }
): { blocked: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { blocked: true, reason: 'Malformed URL' };
  }

  // Allow safe internal browser blank/data URLs for rendering subresources
  if (parsed.protocol === 'about:' || parsed.protocol === 'data:' || parsed.protocol === 'blob:') {
    return { blocked: false };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      blocked: true,
      reason: `Disallowed protocol ${parsed.protocol} (file:// and internal schemes blocked)`,
    };
  }

  if (opts.networkMode === 'airgapped') {
    return {
      blocked: true,
      reason: 'Outbound browser traffic blocked under Airgapped containment policy',
    };
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (opts.blockCloudMetadata) {
    if (
      host === '169.254.169.254' ||
      host.startsWith('169.254.') ||
      host === 'metadata.vultr.com' ||
      host === 'metadata.google.internal'
    ) {
      return {
        blocked: true,
        reason: `Cloud Instance Metadata SSRF blocked (${host})`,
      };
    }
  }

  if (opts.blockPrivateNetworks) {
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.')
    ) {
      return {
        blocked: true,
        reason: `Private/Loopback RFC1918 network target blocked (${host})`,
      };
    }
    if (host.startsWith('172.')) {
      const second = Number(host.split('.')[1]);
      if (Number.isFinite(second) && second >= 16 && second <= 31) {
        return {
          blocked: true,
          reason: `Private RFC1918 subnet 172.16.0.0/12 target blocked (${host})`,
        };
      }
    }
  }

  if (opts.networkMode === 'strict_allowlist' && opts.allowedDomains.length > 0) {
    const allowed = opts.allowedDomains.some((dom) => {
      const d = dom.toLowerCase().trim();
      return host === d || host.endsWith(`.${d}`);
    });
    if (!allowed) {
      return {
        blocked: true,
        reason: `Domain ${host} not in strict egress allowlist`,
      };
    }
  }

  return { blocked: false };
}

export class ContainedBrowserSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private blockedRequests: string[] = [];
  private latestSecurityHeaders: Record<string, string> = {};
  private latestHttpStatus = 200;
  private activePolicy = {
    networkMode: 'standard' as NetworkPolicyMode,
    allowedDomains: [] as string[],
    blockCloudMetadata: true,
    blockPrivateNetworks: true,
  };

  constructor(private readonly workspaceDir: string) {}

  private async ensurePage(): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    const executablePath = findLocalChromiumExecutable();
    this.browser = await chromium.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--no-first-run',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) AegisVultrSandbox/1.0 Chrome/131.0.0.0 Safari/537.36',
      acceptDownloads: false,
    });

    // Enforce browser-engine level containment route interceptor on EVERY request
    await this.context.route('**/*', async (route) => {
      const reqUrl = route.request().url();
      const check = isUrlBlockedByContainment(reqUrl, this.activePolicy);
      if (check.blocked) {
        this.blockedRequests.push(`${reqUrl} (${check.reason})`);
        await route.abort('accessdenied');
        return;
      }
      await route.continue();
    });

    this.page = await this.context.newPage();
    this.page.on('response', (resp) => {
      if (resp.request().isNavigationRequest() && resp.frame() === this.page?.mainFrame()) {
        this.latestHttpStatus = resp.status();
        const headers = resp.headers();
        const wanted = [
          'strict-transport-security',
          'content-security-policy',
          'x-frame-options',
          'x-content-type-options',
          'referrer-policy',
          'permissions-policy',
          'server',
        ];
        const picked: Record<string, string> = {};
        for (const key of wanted) {
          if (headers[key]) picked[key] = headers[key];
        }
        this.latestSecurityHeaders = picked;
      }
    });

    return this.page;
  }

  async execute(req: BrowserActionRequest): Promise<{
    snapshot?: BrowserSnapshot;
    evalResult?: unknown;
    error?: string;
    exitCode: number;
  }> {
    this.activePolicy = {
      networkMode: req.networkMode,
      allowedDomains: req.allowedDomains,
      blockCloudMetadata: req.blockCloudMetadata,
      blockPrivateNetworks: req.blockPrivateNetworks,
    };
    this.blockedRequests = [];

    if (req.action === 'navigate' && req.url) {
      const preCheck = isUrlBlockedByContainment(req.url, this.activePolicy);
      if (preCheck.blocked) {
        return {
          error: `AEGIS_BROWSER_CONTAINMENT_BLOCK: ${preCheck.reason}`,
          exitCode: 13,
        };
      }
    }

    try {
      const page = await this.ensurePage();
      const navStart = Date.now();
      let evalResult: unknown = undefined;

      if (req.action === 'navigate') {
        if (!req.url) throw new Error('Missing target URL for navigate action');
        const resp = await page.goto(req.url, {
          waitUntil: 'domcontentloaded',
          timeout: Math.min(req.timeoutMs, 20000),
        });
        if (resp) {
          this.latestHttpStatus = resp.status();
        }
        // Brief settle so dynamic content paints cleanly before screenshot
        await page.waitForTimeout(450);
      } else if (req.action === 'click') {
        if (!req.selector) throw new Error('Missing selector for click action');
        await page.click(req.selector, { timeout: Math.min(req.timeoutMs, 10000) });
        await page.waitForTimeout(400);
      } else if (req.action === 'fill') {
        if (!req.selector) throw new Error('Missing selector for fill action');
        await page.fill(req.selector, req.value ?? '', {
          timeout: Math.min(req.timeoutMs, 10000),
        });
      } else if (req.action === 'extract_js') {
        if (!req.expression) throw new Error('Missing expression for extract_js action');
        // Wrap in Function to allow both expressions and IIFEs cleanly
        evalResult = await page.evaluate(`(${req.expression})`);
      }

      const loadTimeMs = Date.now() - navStart;
      const frameId = `frame-${req.stepIndex}-${crypto.randomBytes(3).toString('hex')}`;
      const screenshotFile = `screenshots/${frameId}.png`;
      const screenshotAbsPath = path.join(this.workspaceDir, screenshotFile);
      await fsp.mkdir(path.dirname(screenshotAbsPath), { recursive: true });

      const pngBuffer = await page.screenshot({ type: 'png', fullPage: false });
      await fsp.writeFile(screenshotAbsPath, pngBuffer);

      // Extract readable text + interactive elements inside browser context
      const domSummary = (await page.evaluate(`(() => {
        const clean = (s) => (s || '').replace(/\\s+/g, ' ').trim();
        const bodyText = clean(document.body ? document.body.innerText : '').slice(0, 3500);
        const nodes = Array.from(document.querySelectorAll('a[href], button, input, h1, h2, h3'));
        const elements = [];
        let ref = 1;
        for (const el of nodes) {
          if (elements.length >= 25) break;
          const tag = el.tagName.toLowerCase();
          const text = clean(el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('value') || '').slice(0, 110);
          const href = tag === 'a' ? el.getAttribute('href') || undefined : undefined;
          if (!text && !href) continue;
          let selector = tag;
          if (el.id) selector = '#' + CSS.escape(el.id);
          else if (tag === 'a' && text) selector = 'a:has-text(' + JSON.stringify(text.slice(0, 40)) + ')';
          elements.push({ ref: ref++, tag, text, href, selector });
        }
        return {
          title: document.title || location.href,
          url: location.href,
          bodyText,
          elements
        };
      })()`)) as {
        title: string;
        url: string;
        bodyText: string;
        elements: BrowserInteractiveElement[];
      };

      const snapshot: BrowserSnapshot = {
        frameId,
        timestamp: new Date().toISOString(),
        url: domSummary.url || page.url(),
        title: domSummary.title,
        httpStatus: this.latestHttpStatus,
        loadTimeMs,
        screenshotArtifact: screenshotFile,
        screenshotSha256: sha256Hex(pngBuffer),
        textExcerpt: domSummary.bodyText,
        elements: domSummary.elements,
        securityHeaders: { ...this.latestSecurityHeaders },
        blockedRequests: [...this.blockedRequests],
      };

      return {
        snapshot,
        evalResult,
        exitCode: 0,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        error: msg,
        exitCode: 1,
      };
    }
  }

  async close(): Promise<void> {
    try {
      await this.context?.close();
    } catch {
      // ignore
    }
    try {
      await this.browser?.close();
    } catch {
      // ignore
    }
    this.page = null;
    this.context = null;
    this.browser = null;
  }
}
