import { spawn, execSync } from 'node:child_process';

console.log('[AEGIS // VULTR] Building @aegis/shared types & Ed25519 receipt library...');
execSync('npm --workspace=@aegis/shared run build', { stdio: 'inherit' });

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const services = [
  { name: 'SANDBOX-WORKER', color: '\x1b[32m', args: ['--workspace=@aegis/sandbox-worker', 'run', 'dev'] },
  { name: 'CONTROL-PLANE ', color: '\x1b[36m', args: ['--workspace=@aegis/control-plane', 'run', 'dev'] },
  { name: 'MISSION-WEB   ', color: '\x1b[35m', args: ['--workspace=@aegis/web', 'run', 'dev'] },
];

const children = services.map((svc) => {
  const child = isWin
    ? spawn('cmd.exe', ['/d', '/s', '/c', `npm ${svc.args.join(' ')}`], {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
    : spawn('npm', svc.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

  const prefix = `${svc.color}[${svc.name}]\x1b[0m `;
  child.stdout.on('data', (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line.trim()) process.stdout.write(prefix + line + '\n');
    }
  });
  child.stderr.on('data', (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line.trim()) process.stderr.write(prefix + line + '\n');
    }
  });

  return child;
});

function shutdown() {
  for (const c of children) {
    try {
      c.kill();
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
