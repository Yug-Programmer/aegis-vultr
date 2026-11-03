import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['apps/sandbox-worker/dist/server.js'], { stdio: 'inherit' }),
  spawn(process.execPath, ['apps/control-plane/dist/server.js'], { stdio: 'inherit' }),
];

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
