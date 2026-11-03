import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { NetworkPolicyMode } from '@aegis/shared';
import type { DriverRunResult } from './isolatedLocalDriver.js';

const execFileAsync = promisify(execFile);
const MAX_STREAM_BYTES = 256 * 1024;

export async function probeDockerEnvironment(): Promise<{
  dockerAvailable: boolean;
  gvisorAvailable: boolean;
}> {
  try {
    const { stdout } = await execFileAsync('docker', ['info', '--format', '{{json .Runtimes}}'], {
      timeout: 3000,
      windowsHide: true,
    });
    const gvisorAvailable = stdout.includes('runsc');
    return { dockerAvailable: true, gvisorAvailable };
  } catch {
    return { dockerAvailable: false, gvisorAvailable: false };
  }
}

export async function runInVultrDockerSandbox(opts: {
  sandboxId: string;
  workspaceDir: string;
  language: 'python' | 'javascript' | 'bash';
  scriptRelPath: string;
  args: string[];
  timeoutMs: number;
  networkMode: NetworkPolicyMode;
  dockerImage: string;
  useGvisor: boolean;
}): Promise<DriverRunResult> {
  const {
    sandboxId,
    workspaceDir,
    language,
    scriptRelPath,
    args,
    timeoutMs,
    networkMode,
    dockerImage,
    useGvisor,
  } = opts;

  const containerName = `aegis-exec-${sandboxId.slice(0, 8)}-${Date.now().toString(36)}`;
  const dockerArgs: string[] = [
    'run',
    '--rm',
    '--name',
    containerName,
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--pids-limit=128',
    '--memory=512m',
    '--memory-swap=512m',
    '--cpus=1.0',
    '--read-only',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,size=64m',
    '--add-host=metadata.vultr.com:127.0.0.1',
    '--user',
    '1000:1000',
    '-e',
    'HOME=/workspace',
    '-e',
    'PYTHONDONTWRITEBYTECODE=1',
    '-e',
    'PYTHONUTF8=1',
    '-e',
    'AEGIS_SANDBOX=1',
    '-v',
    `${workspaceDir}:/workspace:rw`,
    '-w',
    '/workspace',
  ];

  if (useGvisor) {
    dockerArgs.push('--runtime=runsc');
  }

  if (networkMode === 'airgapped') {
    dockerArgs.push('--network=none');
  }

  dockerArgs.push(dockerImage);

  const normalizedScript = scriptRelPath.replace(/\\/g, '/');
  if (language === 'python') {
    dockerArgs.push('python3', '-B', normalizedScript, ...args);
  } else if (language === 'javascript') {
    dockerArgs.push('node', normalizedScript, ...args);
  } else {
    dockerArgs.push('/bin/sh', normalizedScript, ...args);
  }

  const started = Date.now();
  return await new Promise<DriverRunResult>((resolve) => {
    const child = spawn('docker', dockerArgs, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdoutBuf = Buffer.alloc(0);
    let stderrBuf = Buffer.alloc(0);
    let timedOut = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      spawn('docker', ['rm', '-f', containerName], { stdio: 'ignore', windowsHide: true });
      try {
        child.kill('SIGKILL');
      } catch {
        // ignore
      }
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      if (stdoutBuf.length < MAX_STREAM_BYTES) {
        stdoutBuf = Buffer.concat([
          stdoutBuf,
          chunk.subarray(0, MAX_STREAM_BYTES - stdoutBuf.length),
        ]);
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      if (stderrBuf.length < MAX_STREAM_BYTES) {
        stderrBuf = Buffer.concat([
          stderrBuf,
          chunk.subarray(0, MAX_STREAM_BYTES - stderrBuf.length),
        ]);
      }
    });

    const finish = (exitCode: number, extraErr?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      let stderrStr = stderrBuf.toString('utf8');
      if (timedOut) {
        stderrStr += `\n[AEGIS_VULTR_CONTAINER_SUPERVISOR] Container ${containerName} forcibly killed after ${timeoutMs}ms.`;
      }
      if (extraErr) {
        stderrStr += `\n${extraErr}`;
      }
      resolve({
        stdout: stdoutBuf.toString('utf8'),
        stderr: stderrStr.trim(),
        exitCode: timedOut ? 124 : exitCode,
        durationMs: Date.now() - started,
        timedOut,
      });
    };

    child.on('error', (err) => finish(127, `Docker spawn error: ${err.message}`));
    child.on('close', (code) => finish(code ?? 1));
  });
}
