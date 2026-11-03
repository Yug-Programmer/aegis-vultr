import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  generateEd25519KeyPair,
  sha256Hex,
  signExecutionReceipt,
  type ArtifactMeta,
  type BrowserActionRequest,
  type BrowserActionResponse,
  type ExecCodeRequest,
  type ExecCodeResponse,
  type IsolationTier,
  type SandboxWorkerHealth,
} from '@aegis/shared';
import { probeDockerEnvironment, runInVultrDockerSandbox } from './drivers/dockerDriver.js';
import { runInIsolatedLocalSandbox } from './drivers/isolatedLocalDriver.js';
import { ContainedBrowserSession, probeBrowserAvailability } from './browser/browserSession.js';

const execFileAsync = promisify(execFile);

interface SandboxSession {
  id: string;
  rootDir: string;
  workspaceDir: string;
  guardDir: string;
  tmpDir: string;
  createdAt: number;
  lastUsedAt: number;
  browserSession: ContainedBrowserSession | null;
}

const MIME_BY_EXT: Record<string, string> = {
  '.py': 'text/x-python',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.ts': 'text/typescript',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

export class SandboxManager {
  private readonly sandboxes = new Map<string, SandboxSession>();
  private readonly keyPair = generateEd25519KeyPair();
  private readonly startedAt = Date.now();
  private dockerAvailable = false;
  private gvisorAvailable = false;
  private browserAvailable = false;
  private pythonVersion = 'unknown';
  private isolationTier: IsolationTier = 'isolated-ephemeral-sandbox';

  private readonly workerLabel = process.env.SANDBOX_METADATA_LABEL || 'aegis-vultr-sandbox-01';
  private readonly region = process.env.VULTR_INSTANCE_REGION || 'local-dev';
  private readonly preferredDriver = process.env.SANDBOX_DRIVER || 'auto';
  private readonly dockerImage = process.env.SANDBOX_DOCKER_IMAGE || 'python:3.12-slim';

  async init(): Promise<void> {
    const dockerProbe = await probeDockerEnvironment();
    this.dockerAvailable = dockerProbe.dockerAvailable;
    this.gvisorAvailable = dockerProbe.gvisorAvailable;
    this.browserAvailable = await probeBrowserAvailability();

    try {
      const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
      const { stdout, stderr } = await execFileAsync(pyCmd, ['--version'], {
        timeout: 3000,
        windowsHide: true,
      });
      this.pythonVersion = (stdout || stderr).trim();
    } catch {
      this.pythonVersion = 'unavailable';
    }

    if (
      (this.preferredDriver === 'docker' ||
        (this.preferredDriver === 'auto' && process.platform === 'linux')) &&
      this.dockerAvailable
    ) {
      this.isolationTier = this.gvisorAvailable
        ? 'vultr-docker-gvisor'
        : 'vultr-docker-hardened';
    } else {
      this.isolationTier = 'isolated-ephemeral-sandbox';
    }

    // Periodic TTL reaper (cleans idle sandboxes > 30 mins)
    setInterval(() => {
      void this.reapExpiredSandboxes(30 * 60 * 1000);
    }, 60_000).unref();
  }

  getHealth(): SandboxWorkerHealth {
    return {
      ok: true,
      workerLabel: this.workerLabel,
      region: this.region,
      platform: process.platform,
      arch: process.arch,
      isolationTier: this.isolationTier,
      dockerAvailable: this.dockerAvailable,
      gvisorAvailable: this.gvisorAvailable,
      browserAvailable: this.browserAvailable,
      pythonVersion: this.pythonVersion,
      nodeVersion: process.version,
      activeSandboxes: this.sandboxes.size,
      publicKeyPem: this.keyPair.publicKeyPem,
      uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  async createSandbox(): Promise<{ sandboxId: string; isolationTier: IsolationTier }> {
    const sandboxId = `sbx_${crypto.randomBytes(8).toString('hex')}`;
    const baseRoot = path.join(os.tmpdir(), 'aegis-vultr-sandboxes', sandboxId);
    const workspaceDir = path.join(baseRoot, 'workspace');
    const guardDir = path.join(baseRoot, '_guard');
    const tmpDir = path.join(baseRoot, 'tmp');

    await fs.mkdir(workspaceDir, { recursive: true });
    await fs.mkdir(guardDir, { recursive: true });
    await fs.mkdir(tmpDir, { recursive: true });

    this.sandboxes.set(sandboxId, {
      id: sandboxId,
      rootDir: baseRoot,
      workspaceDir,
      guardDir,
      tmpDir,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      browserSession: null,
    });

    return { sandboxId, isolationTier: this.isolationTier };
  }

  private getSession(sandboxId: string): SandboxSession {
    const s = this.sandboxes.get(sandboxId);
    if (!s) {
      throw new Error(`Sandbox ${sandboxId} not found or expired`);
    }
    s.lastUsedAt = Date.now();
    return s;
  }

  /**
   * Confines relative file paths strictly inside session.workspaceDir.
   * Rejects path traversal (../), absolute paths, drive letters, and null bytes.
   */
  resolveConfinedPath(sandboxId: string, relPath: string): string {
    const session = this.getSession(sandboxId);
    if (!relPath || relPath.includes('\0')) {
      throw new Error('AEGIS_PATH_CONTAINMENT_BLOCK: Invalid empty or null-byte path');
    }
    const cleaned = relPath.replace(/^[/\\]+/, '');
    if (path.isAbsolute(relPath) || /^[a-zA-Z]:/.test(relPath)) {
      throw new Error(`AEGIS_PATH_CONTAINMENT_BLOCK: Absolute paths prohibited (${relPath})`);
    }
    const resolved = path.resolve(session.workspaceDir, cleaned);
    const workspaceResolved = path.resolve(session.workspaceDir);
    if (
      resolved !== workspaceResolved &&
      !resolved.startsWith(workspaceResolved + path.sep)
    ) {
      throw new Error(`AEGIS_PATH_CONTAINMENT_BLOCK: Path traversal outside /workspace denied (${relPath})`);
    }
    return resolved;
  }

  async writeFile(opts: {
    sandboxId: string;
    relativePath: string;
    content: string;
    missionId: string;
    stepIndex: number;
    policyRuleId: string;
    prevReceiptHash: string;
  }) {
    const started = Date.now();
    const targetPath = this.resolveConfinedPath(opts.sandboxId, opts.relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    const buf = Buffer.from(opts.content, 'utf8');
    if (buf.length > 5 * 1024 * 1024) {
      throw new Error('File exceeds 5MB sandbox quota');
    }
    await fs.writeFile(targetPath, buf);

    const artifacts = await this.scanArtifacts(opts.sandboxId);
    const artifactHashes: Record<string, string> = {};
    for (const a of artifacts) artifactHashes[a.relativePath] = a.sha256;

    const receipt = signExecutionReceipt(
      {
        receiptId: `rcpt_${crypto.randomBytes(6).toString('hex')}`,
        missionId: opts.missionId,
        sandboxId: opts.sandboxId,
        stepIndex: opts.stepIndex,
        timestamp: new Date().toISOString(),
        action: `write_file:${opts.relativePath}`,
        isolationTier: this.isolationTier,
        workerNode: {
          label: this.workerLabel,
          region: this.region,
          arch: process.arch,
          platform: process.platform,
        },
        inputSha256: sha256Hex(buf),
        stdoutSha256: sha256Hex(`wrote ${buf.length} bytes to ${opts.relativePath}`),
        stderrSha256: sha256Hex(''),
        artifactHashes,
        exitCode: 0,
        durationMs: Date.now() - started,
        policyRuleId: opts.policyRuleId,
        prevReceiptHash: opts.prevReceiptHash,
      },
      this.keyPair.privateKeyPem,
      this.keyPair.publicKeyPem
    );

    return {
      relativePath: opts.relativePath.replace(/\\/g, '/'),
      sizeBytes: buf.length,
      sha256: sha256Hex(buf),
      artifacts,
      receipt,
    };
  }

  async readFileBuffer(sandboxId: string, relativePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const absPath = this.resolveConfinedPath(sandboxId, relativePath);
    const buffer = await fs.readFile(absPath);
    const ext = path.extname(absPath).toLowerCase();
    return {
      buffer,
      mimeType: MIME_BY_EXT[ext] || 'application/octet-stream',
    };
  }

  async scanArtifacts(sandboxId: string): Promise<ArtifactMeta[]> {
    const session = this.getSession(sandboxId);
    const results: ArtifactMeta[] = [];

    const walk = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '__pycache__' || entry.name === 'node_modules') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile()) {
          const stat = await fs.stat(full);
          if (stat.size <= 10 * 1024 * 1024) {
            const buf = await fs.readFile(full);
            const rel = path.relative(session.workspaceDir, full).replace(/\\/g, '/');
            const ext = path.extname(entry.name).toLowerCase();
            results.push({
              name: entry.name,
              relativePath: rel,
              sizeBytes: stat.size,
              sha256: sha256Hex(buf),
              mimeType: MIME_BY_EXT[ext] || 'text/plain',
              createdAt: stat.mtime.toISOString(),
            });
          }
        }
      }
    };

    await walk(session.workspaceDir);
    results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return results;
  }

  async execCode(sandboxId: string, req: ExecCodeRequest): Promise<ExecCodeResponse> {
    const session = this.getSession(sandboxId);
    const ext = req.language === 'python' ? '.py' : req.language === 'javascript' ? '.mjs' : '.sh';
    const scriptName = req.filename
      ? req.filename.replace(/^[/\\]+/, '')
      : `step_${req.stepIndex}_task${ext}`;
    const scriptAbs = this.resolveConfinedPath(sandboxId, scriptName);
    await fs.mkdir(path.dirname(scriptAbs), { recursive: true });
    await fs.writeFile(scriptAbs, req.code, 'utf8');

    const scriptRel = path.relative(session.workspaceDir, scriptAbs);
    const cappedTimeout = Math.min(Math.max(req.timeoutMs || 15000, 500), 30000);

    const runResult =
      this.isolationTier === 'vultr-docker-gvisor' || this.isolationTier === 'vultr-docker-hardened'
        ? await runInVultrDockerSandbox({
            sandboxId,
            workspaceDir: session.workspaceDir,
            language: req.language,
            scriptRelPath: scriptRel,
            args: req.args ?? [],
            timeoutMs: cappedTimeout,
            networkMode: req.networkMode,
            dockerImage: this.dockerImage,
            useGvisor: this.isolationTier === 'vultr-docker-gvisor',
          })
        : await runInIsolatedLocalSandbox({
            workspaceDir: session.workspaceDir,
            guardDir: session.guardDir,
            tmpDir: session.tmpDir,
            language: req.language,
            scriptRelPath: scriptRel,
            args: req.args ?? [],
            timeoutMs: cappedTimeout,
            networkMode: req.networkMode,
          });

    const artifacts = await this.scanArtifacts(sandboxId);
    const artifactHashes: Record<string, string> = {};
    for (const a of artifacts) artifactHashes[a.relativePath] = a.sha256;

    const receipt = signExecutionReceipt(
      {
        receiptId: `rcpt_${crypto.randomBytes(6).toString('hex')}`,
        missionId: req.missionId,
        sandboxId,
        stepIndex: req.stepIndex,
        timestamp: new Date().toISOString(),
        action: `exec_${req.language}:${scriptRel.replace(/\\/g, '/')}`,
        isolationTier: this.isolationTier,
        workerNode: {
          label: this.workerLabel,
          region: this.region,
          arch: process.arch,
          platform: process.platform,
        },
        inputSha256: sha256Hex(req.code),
        stdoutSha256: sha256Hex(runResult.stdout),
        stderrSha256: sha256Hex(runResult.stderr),
        artifactHashes,
        exitCode: runResult.exitCode,
        durationMs: runResult.durationMs,
        policyRuleId: req.policyRuleId,
        prevReceiptHash: req.prevReceiptHash,
      },
      this.keyPair.privateKeyPem,
      this.keyPair.publicKeyPem
    );

    return {
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      exitCode: runResult.exitCode,
      durationMs: runResult.durationMs,
      timedOut: runResult.timedOut,
      writtenFile: scriptRel.replace(/\\/g, '/'),
      artifacts,
      receipt,
    };
  }

  async execBrowser(sandboxId: string, req: BrowserActionRequest): Promise<BrowserActionResponse> {
    const session = this.getSession(sandboxId);
    if (!session.browserSession) {
      session.browserSession = new ContainedBrowserSession(session.workspaceDir);
    }

    const started = Date.now();
    const res = await session.browserSession.execute(req);
    const durationMs = Date.now() - started;

    const artifacts = await this.scanArtifacts(sandboxId);
    const artifactHashes: Record<string, string> = {};
    for (const a of artifacts) artifactHashes[a.relativePath] = a.sha256;

    const inputDescriptor = JSON.stringify({
      action: req.action,
      url: req.url,
      selector: req.selector,
      expression: req.expression,
    });

    const stdoutMaterial = res.snapshot
      ? `${res.snapshot.url}\n${res.snapshot.title}\n${res.snapshot.screenshotSha256}`
      : JSON.stringify(res.evalResult ?? '');

    const receipt = signExecutionReceipt(
      {
        receiptId: `rcpt_${crypto.randomBytes(6).toString('hex')}`,
        missionId: req.missionId,
        sandboxId,
        stepIndex: req.stepIndex,
        timestamp: new Date().toISOString(),
        action: `browser_${req.action}:${req.url || req.selector || 'page'}`,
        isolationTier: this.isolationTier,
        workerNode: {
          label: this.workerLabel,
          region: this.region,
          arch: process.arch,
          platform: process.platform,
        },
        inputSha256: sha256Hex(inputDescriptor),
        stdoutSha256: sha256Hex(stdoutMaterial),
        stderrSha256: sha256Hex(res.error || ''),
        artifactHashes,
        exitCode: res.exitCode,
        durationMs,
        policyRuleId: req.policyRuleId,
        prevReceiptHash: req.prevReceiptHash,
      },
      this.keyPair.privateKeyPem,
      this.keyPair.publicKeyPem
    );

    return {
      snapshot: res.snapshot,
      evalResult: res.evalResult,
      error: res.error,
      exitCode: res.exitCode,
      durationMs,
      artifacts,
      receipt,
    };
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    const session = this.sandboxes.get(sandboxId);
    if (!session) return;
    this.sandboxes.delete(sandboxId);
    if (session.browserSession) {
      await session.browserSession.close();
    }
    try {
      await fs.rm(session.rootDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup lock
    }
  }

  private async reapExpiredSandboxes(maxIdleMs: number): Promise<void> {
    const now = Date.now();
    for (const [id, session] of this.sandboxes.entries()) {
      if (now - session.lastUsedAt > maxIdleMs) {
        await this.destroySandbox(id);
      }
    }
  }
}
