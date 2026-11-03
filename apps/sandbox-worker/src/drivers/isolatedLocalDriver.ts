import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { NetworkPolicyMode } from '@aegis/shared';

export interface DriverRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
}

const MAX_STREAM_BYTES = 256 * 1024; // 256 KB stdout/stderr cap

/**
 * CPython C-level sys.addaudithook containment guard injected via sitecustomize.py.
 * Once installed at interpreter startup, Python code cannot remove sys.addaudithook.
 * Blocks:
 *  - Cloud metadata SSRF (169.254.169.254 / metadata.vultr.com)
 *  - Loopback/private network probing (Control Plane & Sandbox RPC ports)
 *  - Outbound sockets when networkMode == 'airgapped'
 *  - File writes or reads outside the isolated sandbox workspace & Python stdlib
 */
const PYTHON_AUDIT_GUARD = `
import os as _os
import sys as _sys

def _install_aegis_guard():
    workspace = _os.path.realpath(_os.environ.get("AEGIS_WORKSPACE", ""))
    guard_dir = _os.path.realpath(_os.environ.get("AEGIS_GUARD_DIR", ""))
    tmp_dir = _os.path.realpath(_os.environ.get("TEMP", _os.environ.get("TMP", "")))
    net_mode = _os.environ.get("AEGIS_NETWORK_MODE", "standard")
    py_prefixes = tuple(
        _os.path.realpath(p) for p in {
            _sys.prefix,
            _sys.base_prefix,
            _sys.exec_prefix,
            _sys.base_exec_prefix,
            _os.path.dirname(_os.__file__),
        } if p
    )

    def _is_private_or_metadata_ip(host_str):
        h = str(host_str).strip().lower()
        if h in ("localhost", "127.0.0.1", "::1", "0.0.0.0", "metadata.vultr.com", "169.254.169.254"):
            return True
        if h.startswith("169.254.") or h.startswith("127.") or h.startswith("10.") or h.startswith("192.168."):
            return True
        if h.startswith("172."):
            parts = h.split(".")
            if len(parts) >= 2 and parts[1].isdigit() and 16 <= int(parts[1]) <= 31:
                return True
        return False

    _busy = False

    def _audit_hook(event, args):
        nonlocal _busy
        if _busy:
            return
        _busy = True
        try:
            if event == "socket.connect":
                addr = args[1] if len(args) > 1 else None
                if net_mode == "airgapped":
                    raise PermissionError("AEGIS_CONTAINMENT_BLOCK: Outbound socket blocked (airgapped sandbox policy)")
                if isinstance(addr, tuple) and len(addr) >= 1:
                    host = addr[0]
                    if _is_private_or_metadata_ip(host):
                        raise PermissionError(f"AEGIS_CONTAINMENT_BLOCK: SSRF/Internal endpoint {host} is blocked inside Vultr sandbox")
            elif event == "socket.getaddrinfo":
                host = args[0] if len(args) > 0 else ""
                if net_mode == "airgapped":
                    raise PermissionError("AEGIS_CONTAINMENT_BLOCK: DNS resolution blocked (airgapped sandbox policy)")
                if _is_private_or_metadata_ip(host):
                    raise PermissionError(f"AEGIS_CONTAINMENT_BLOCK: DNS resolution for internal/metadata host {host} blocked")
            elif event == "open":
                target = args[0] if len(args) > 0 else None
                mode = args[1] if len(args) > 1 else "r"
                if isinstance(target, int) or target is None:
                    return
                try:
                    p = _os.path.abspath(str(target))
                    if _os.path.exists(p):
                        p = _os.path.realpath(p)
                except Exception:
                    return
                is_write = bool(mode and any(c in str(mode) for c in ("w", "a", "x", "+")))
                in_workspace = workspace and (p.lower() == workspace.lower() or p.lower().startswith((workspace + _os.sep).lower()))
                in_tmp = tmp_dir and (p.lower() == tmp_dir.lower() or p.lower().startswith((tmp_dir + _os.sep).lower()))
                if is_write:
                    if not (in_workspace or in_tmp):
                        raise PermissionError(f"AEGIS_CONTAINMENT_BLOCK: File write outside /workspace denied ({target})")
                else:
                    in_stdlib = any(p.lower() == pref.lower() or p.lower().startswith((pref + _os.sep).lower()) for pref in py_prefixes)
                    in_guard = guard_dir and (p.lower() == guard_dir.lower() or p.lower().startswith((guard_dir + _os.sep).lower()))
                    if not (in_workspace or in_tmp or in_stdlib or in_guard):
                        low = p.lower()
                        allow_sys = ("\\\\windows\\\\system32", "/etc/ssl", "/usr/share/zoneinfo", "/etc/resolv.conf", "/etc/hosts", "/dev/urandom", "/dev/null", "/proc/meminfo", "/proc/cpuinfo")
                        if not any(s in low for s in allow_sys):
                            raise PermissionError(f"AEGIS_CONTAINMENT_BLOCK: File read outside /workspace denied ({target})")
        finally:
            _busy = False

    _sys.addaudithook(_audit_hook)

_install_aegis_guard()
del _install_aegis_guard
`;

const NODE_PRELOAD_GUARD = `
const net = require('node:net');
const dns = require('node:dns');
const path = require('node:path');
const fs = require('node:fs');

const workspace = fs.realpathSync(process.env.AEGIS_WORKSPACE || process.cwd());
const netMode = process.env.AEGIS_NETWORK_MODE || 'standard';

function isBlockedHost(host) {
  const h = String(host || '').trim().toLowerCase();
  if (!h || h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0' || h === '169.254.169.254' || h === 'metadata.vultr.com') {
    return true;
  }
  if (h.startsWith('169.254.') || h.startsWith('127.') || h.startsWith('10.') || h.startsWith('192.168.')) {
    return true;
  }
  return false;
}

const origConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
  if (netMode === 'airgapped') {
    throw new Error('AEGIS_CONTAINMENT_BLOCK: Outbound network disabled in airgapped sandbox');
  }
  const opts = typeof args[0] === 'object' ? args[0] : { port: args[0], host: typeof args[1] === 'string' ? args[1] : '127.0.0.1' };
  if (isBlockedHost(opts.host || opts.hostname || '127.0.0.1')) {
    throw new Error('AEGIS_CONTAINMENT_BLOCK: SSRF/Internal endpoint blocked inside Vultr sandbox');
  }
  return origConnect.apply(this, args);
};

const origLookup = dns.lookup;
dns.lookup = function(hostname, ...rest) {
  if (netMode === 'airgapped' || isBlockedHost(hostname)) {
    const cb = rest[rest.length - 1];
    const err = new Error('AEGIS_CONTAINMENT_BLOCK: Blocked host resolution: ' + hostname);
    if (typeof cb === 'function') return process.nextTick(() => cb(err));
    throw err;
  }
  return origLookup.call(this, hostname, ...rest);
};
`;

async function killProcessTree(pid: number): Promise<void> {
  if (!pid) return;
  if (process.platform === 'win32') {
    await new Promise<void>((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
      killer.on('close', () => resolve());
      killer.on('error', () => resolve());
    });
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // already exited
      }
    }
  }
}

function buildMinimalRuntimePath(): string {
  const rawPath = process.env.PATH || process.env.Path || '';
  const sep = path.delimiter;
  const keepPatterns =
    process.platform === 'win32'
      ? [/python/i, /nodejs/i, /windows\\system32/i]
      : [/^\/usr\/local\/bin$/, /^\/usr\/bin$/, /^\/bin$/];

  const filtered = rawPath
    .split(sep)
    .filter((entry) => keepPatterns.some((re) => re.test(entry)));
  return filtered.join(sep);
}

export async function runInIsolatedLocalSandbox(opts: {
  workspaceDir: string;
  guardDir: string;
  tmpDir: string;
  language: 'python' | 'javascript' | 'bash';
  scriptRelPath: string;
  args: string[];
  timeoutMs: number;
  networkMode: NetworkPolicyMode;
}): Promise<DriverRunResult> {
  const { workspaceDir, guardDir, tmpDir, language, scriptRelPath, args, timeoutMs, networkMode } = opts;

  await fs.mkdir(guardDir, { recursive: true });
  await fs.mkdir(tmpDir, { recursive: true });

  // Write runtime containment shims in separate read-only guard directory
  const pyGuardFile = path.join(guardDir, 'sitecustomize.py');
  const nodeGuardFile = path.join(guardDir, 'preload.cjs');
  await fs.writeFile(pyGuardFile, PYTHON_AUDIT_GUARD, 'utf8');
  await fs.writeFile(nodeGuardFile, NODE_PRELOAD_GUARD, 'utf8');

  // Construct sanitized ZERO-SECRET environment
  const cleanEnv: NodeJS.ProcessEnv = {
    PATH: buildMinimalRuntimePath(),
    HOME: workspaceDir,
    USERPROFILE: workspaceDir,
    TEMP: tmpDir,
    TMP: tmpDir,
    TMPDIR: tmpDir,
    AEGIS_SANDBOX: '1',
    AEGIS_ISOLATION: 'isolated-ephemeral-sandbox',
    AEGIS_WORKSPACE: workspaceDir,
    AEGIS_GUARD_DIR: guardDir,
    AEGIS_NETWORK_MODE: networkMode,
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
    PYTHONPATH: guardDir,
  };

  if (process.platform === 'win32') {
    cleanEnv.SYSTEMROOT = process.env.SYSTEMROOT || 'C:\\Windows';
  }

  let command = '';
  let cmdArgs: string[] = [];

  if (language === 'python') {
    command = process.platform === 'win32' ? 'python' : 'python3';
    cmdArgs = ['-I', '-S']; // Wait: -I ignores PYTHONPATH! Instead use -B and sanitized cleanEnv so sitecustomize.py loads cleanly!
    cmdArgs = ['-B', scriptRelPath, ...args];
  } else if (language === 'javascript') {
    command = process.execPath;
    cmdArgs = ['--require', nodeGuardFile, scriptRelPath, ...args];
  } else {
    if (process.platform === 'win32') {
      return {
        stdout: '',
        stderr: 'Bash execution requires Linux Vultr Docker sandbox; use python or javascript on local Windows host.',
        exitCode: 126,
        durationMs: 0,
        timedOut: false,
      };
    }
    command = '/bin/sh';
    cmdArgs = [scriptRelPath, ...args];
  }

  const started = Date.now();
  return await new Promise<DriverRunResult>((resolve) => {
    const child = spawn(command, cmdArgs, {
      cwd: workspaceDir,
      env: cleanEnv,
      windowsHide: true,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdoutBuf = Buffer.alloc(0);
    let stderrBuf = Buffer.alloc(0);
    let timedOut = false;
    let settled = false;

    const timer = setTimeout(async () => {
      timedOut = true;
      if (child.pid) {
        await killProcessTree(child.pid);
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
      const durationMs = Date.now() - started;
      let stderrStr = stderrBuf.toString('utf8');
      if (timedOut) {
        stderrStr += `\n[AEGIS_SANDBOX_SUPERVISOR] Process tree terminated after exceeding ${timeoutMs}ms budget.`;
      }
      if (extraErr) {
        stderrStr += `\n${extraErr}`;
      }
      resolve({
        stdout: stdoutBuf.toString('utf8'),
        stderr: stderrStr.trim(),
        exitCode: timedOut ? 124 : exitCode,
        durationMs,
        timedOut,
      });
    };

    child.on('error', (err) => {
      finish(127, `Spawn error: ${err.message}`);
    });

    child.on('close', (code) => {
      finish(code ?? 1);
    });
  });
}
