import crypto from 'node:crypto';
import type { ContainmentPolicy, PolicyEvaluation } from '@aegis/shared';

export const DEFAULT_CONTAINMENT_POLICY: ContainmentPolicy = {
  networkMode: 'standard',
  allowedDomains: [
    'news.ycombinator.com',
    'example.com',
    'wikipedia.org',
    'en.wikipedia.org',
    'python.org',
    'www.python.org',
    'github.com',
    'api.github.com',
    'vultr.com',
    'docs.vultr.com',
    'httpbin.org',
  ],
  blockCloudMetadata: true,
  blockPrivateNetworks: true,
  maxTimeoutMs: 20000,
  maxMemoryMb: 512,
  maxSteps: 12,
  maxArtifactBytes: 5 * 1024 * 1024,
};

function makeEval(
  toolName: string,
  decision: PolicyEvaluation['decision'],
  ruleId: string,
  reason: string,
  inspectedTarget: string
): PolicyEvaluation {
  return {
    id: `pol_${crypto.randomBytes(5).toString('hex')}`,
    timestamp: new Date().toISOString(),
    toolName,
    decision,
    ruleId,
    reason,
    inspectedTarget: inspectedTarget.slice(0, 180),
  };
}

export class PolicyEngine {
  evaluateFilePath(
    toolName: string,
    relativePath: string
  ): PolicyEvaluation {
    const trimmed = (relativePath || '').trim();
    if (!trimmed || trimmed.includes('\0')) {
      return makeEval(
        toolName,
        'BLOCK',
        'POL-PATH-001',
        'Empty or null-byte file path rejected',
        trimmed
      );
    }

    if (
      trimmed.startsWith('/') ||
      trimmed.startsWith('\\') ||
      /^[a-zA-Z]:/.test(trimmed) ||
      trimmed.split(/[/\\]/).includes('..')
    ) {
      return makeEval(
        toolName,
        'BLOCK',
        'POL-PATH-001',
        'Filesystem escape attempt outside /workspace blocked',
        trimmed
      );
    }

    const base = trimmed.split(/[/\\]/).pop()?.toLowerCase() || '';
    if (base === '.env' || base === 'id_rsa' || base === 'authorized_keys') {
      return makeEval(
        toolName,
        'BLOCK',
        'POL-SECRET-002',
        'Protected credential filename blocked by containment policy',
        trimmed
      );
    }

    return makeEval(
      toolName,
      'ALLOW',
      'POL-PATH-001',
      'Confined strictly to ephemeral /workspace directory',
      trimmed
    );
  }

  evaluateBrowserTarget(
    url: string,
    policy: ContainmentPolicy
  ): PolicyEvaluation {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return makeEval(
        'browser_navigate',
        'BLOCK',
        'POL-URL-001',
        'Invalid or unparseable target URL',
        url
      );
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return makeEval(
        'browser_navigate',
        'BLOCK',
        'POL-SCHEME-002',
        `Disallowed URI scheme "${parsed.protocol}" (only http/https permitted)`,
        url
      );
    }

    if (policy.networkMode === 'airgapped') {
      return makeEval(
        'browser_navigate',
        'BLOCK',
        'POL-NET-AIRGAP',
        'Outbound browser navigation denied under Airgapped containment mode',
        url
      );
    }

    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (policy.blockCloudMetadata) {
      if (
        host === '169.254.169.254' ||
        host.startsWith('169.254.') ||
        host === 'metadata.vultr.com' ||
        host === 'metadata.google.internal'
      ) {
        return makeEval(
          'browser_navigate',
          'BLOCK',
          'POL-SSRF-METADATA',
          `Vultr/Cloud instance metadata endpoint (${host}) blocked against SSRF`,
          url
        );
      }
    }

    if (policy.blockPrivateNetworks) {
      if (
        host === 'localhost' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.startsWith('127.') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
      ) {
        return makeEval(
          'browser_navigate',
          'BLOCK',
          'POL-SSRF-RFC1918',
          `Loopback/Private network target (${host}) blocked against internal SSRF`,
          url
        );
      }
    }

    if (policy.networkMode === 'strict_allowlist') {
      const ok = policy.allowedDomains.some((d) => {
        const clean = d.toLowerCase().trim();
        return host === clean || host.endsWith(`.${clean}`);
      });
      if (!ok) {
        return makeEval(
          'browser_navigate',
          'BLOCK',
          'POL-NET-ALLOWLIST',
          `Domain "${host}" is not on the strict egress allowlist`,
          url
        );
      }
    }

    return makeEval(
      'browser_navigate',
      'ALLOW',
      'POL-NET-EGRESS',
      `Verified external target (${host}) with SSRF & metadata guards active`,
      url
    );
  }

  evaluateCodeExecution(
    language: string,
    code: string,
    filename: string | undefined,
    policy: ContainmentPolicy
  ): PolicyEvaluation {
    if (filename) {
      const pathCheck = this.evaluateFilePath('run_sandbox_code', filename);
      if (pathCheck.decision === 'BLOCK') return pathCheck;
    }

    if (code.length > 200_000) {
      return makeEval(
        'run_sandbox_code',
        'BLOCK',
        'POL-QUOTA-001',
        'Code payload exceeds 200KB maximum script size',
        `${language} (${code.length} chars)`
      );
    }

    const forkBombPatterns = [
      /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/,
      /while\s*\(\s*true\s*\)\s*\{\s*fork\s*\(/i,
      /os\.fork\s*\(\s*\)/,
    ];
    for (const pat of forkBombPatterns) {
      if (pat.test(code)) {
        return makeEval(
          'run_sandbox_code',
          'BLOCK',
          'POL-EXEC-FORKBOMB',
          'Process fork-bomb signature blocked prior to sandbox dispatch',
          `${language}:${filename || 'inline'}`
        );
      }
    }

    return makeEval(
      'run_sandbox_code',
      'ALLOW',
      'POL-SANDBOX-EXEC',
      `Approved for isolated ${language} execution (timeout<=${policy.maxTimeoutMs}ms, zero host secrets, network=${policy.networkMode})`,
      `${language}:${filename || 'inline'} (${code.split('\n').length} lines)`
    );
  }
}
