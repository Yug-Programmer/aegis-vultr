import http from 'node:http';
import {
  verifyRpcHmacHeaders,
  type BrowserActionRequest,
  type ExecCodeRequest,
} from '@aegis/shared';
import { SandboxManager } from './sandboxManager.js';

const PORT = Number(process.env.SANDBOX_WORKER_PORT || 4100);
const SHARED_SECRET =
  process.env.SANDBOX_SHARED_SECRET || 'aegis-vultr-dev-hmac-secret-change-in-prod';

const manager = new SandboxManager();

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > 10 * 1024 * 1024) {
      throw new Error('Request payload exceeds 10MB limit');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function start() {
  await manager.init();
  const health = manager.getHealth();
  console.log(
    `[AEGIS Sandbox Worker] Ready on port ${PORT} | tier=${health.isolationTier} | browser=${health.browserAvailable} | python=${health.pythonVersion}`
  );

  const server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = urlObj.pathname;
      const method = (req.method || 'GET').toUpperCase();

      // Public read-only health check (returns Ed25519 public key & isolation capabilities, zero secrets)
      if (method === 'GET' && pathname === '/v1/health') {
        sendJson(res, 200, manager.getHealth());
        return;
      }

      const rawBody = method === 'GET' || method === 'DELETE' ? '' : await readBody(req);

      // Verify HMAC-SHA256 Control Plane authentication for all sandbox mutations/reads
      const authCheck = verifyRpcHmacHeaders(
        SHARED_SECRET,
        method,
        pathname + urlObj.search,
        rawBody,
        req.headers['x-aegis-timestamp'] as string | undefined,
        req.headers['x-aegis-signature'] as string | undefined
      );

      if (!authCheck.ok) {
        sendJson(res, 401, { error: authCheck.reason || 'Unauthorized RPC request' });
        return;
      }

      if (method === 'POST' && pathname === '/v1/sandboxes') {
        const created = await manager.createSandbox();
        sendJson(res, 201, created);
        return;
      }

      const sbxMatch = pathname.match(/^\/v1\/sandboxes\/([a-zA-Z0-9_-]+)(?:\/(.*))?$/);
      if (sbxMatch) {
        const sandboxId = sbxMatch[1];
        const subRoute = sbxMatch[2] || '';

        if (method === 'DELETE' && subRoute === '') {
          await manager.destroySandbox(sandboxId);
          sendJson(res, 200, { deleted: true });
          return;
        }

        if (method === 'POST' && subRoute === 'exec') {
          const parsed = JSON.parse(rawBody) as ExecCodeRequest;
          const result = await manager.execCode(sandboxId, parsed);
          sendJson(res, 200, result);
          return;
        }

        if (method === 'POST' && subRoute === 'browser') {
          const parsed = JSON.parse(rawBody) as BrowserActionRequest;
          const result = await manager.execBrowser(sandboxId, parsed);
          sendJson(res, 200, result);
          return;
        }

        if (method === 'POST' && subRoute === 'files') {
          const parsed = JSON.parse(rawBody) as {
            relativePath: string;
            content: string;
            missionId: string;
            stepIndex: number;
            policyRuleId: string;
            prevReceiptHash: string;
          };
          const result = await manager.writeFile({ sandboxId, ...parsed });
          sendJson(res, 200, result);
          return;
        }

        if (method === 'GET' && subRoute === 'files') {
          const relPath = urlObj.searchParams.get('path');
          if (!relPath) {
            const artifacts = await manager.scanArtifacts(sandboxId);
            sendJson(res, 200, { artifacts });
            return;
          }
          const { buffer, mimeType } = await manager.readFileBuffer(sandboxId, relPath);
          res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': buffer.length,
          });
          res.end(buffer);
          return;
        }
      }

      sendJson(res, 404, { error: `Unknown sandbox worker route: ${method} ${pathname}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = msg.includes('CONTAINMENT_BLOCK') ? 403 : 500;
      sendJson(res, status, { error: msg });
    }
  });

  server.listen(PORT, '0.0.0.0');
}

void start();
