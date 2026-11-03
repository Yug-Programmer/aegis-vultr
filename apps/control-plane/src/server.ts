import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ContainmentPolicy } from '@aegis/shared';
import { PolicyEngine, DEFAULT_CONTAINMENT_POLICY } from './policyEngine.js';
import { SandboxClient } from './sandboxClient.js';
import { LlmClient, type RuntimeLlmConfig } from './llmClient.js';
import { VultrCloudService } from './vultrCloudService.js';
import { AgentOrchestrator } from './agentOrchestrator.js';
import { MISSION_TEMPLATES } from './autonomousPlaybooks.js';
import { runLiveContainmentAudit } from './containmentAudit.js';
import { EnterpriseStore } from './enterpriseStore.js';
import { EnterpriseWorkflowService } from './enterpriseWorkflows.js';

// Load root .env if present (zero external dotenv dependency needed in Node 24)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(rootEnvPath)) {
  const lines = fs.readFileSync(rootEnvPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!process.env[k] && v) {
        process.env[k] = v;
      }
    }
  }
}

const PORT = Number(process.env.CONTROL_PLANE_PORT || 4000);
const SHARED_SECRET =
  process.env.SANDBOX_SHARED_SECRET || 'aegis-vultr-dev-hmac-secret-change-in-prod';

const policyEngine = new PolicyEngine();
const sandboxClient = new SandboxClient(undefined, SHARED_SECRET);
const llmClient = new LlmClient();
const vultrCloud = new VultrCloudService();
const orchestrator = new AgentOrchestrator(sandboxClient, policyEngine, llmClient);
const enterpriseStore = new EnterpriseStore();
const enterpriseWorkflows = new EnterpriseWorkflowService(
  enterpriseStore,
  orchestrator,
  llmClient
);

const STATIC_WEB_DIST = path.resolve(__dirname, '../../web/dist');

const STATIC_MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function setCors(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  setCors(res);
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) {
    chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;
    const method = (req.method || 'GET').toUpperCase();

    // --- System Status & Telemetry ---
    if (method === 'GET' && pathname === '/api/status') {
      let workerHealth = null;
      let workerError: string | undefined;
      try {
        workerHealth = await sandboxClient.getHealth();
      } catch (err) {
        workerError = err instanceof Error ? err.message : String(err);
      }

      sendJson(res, 200, {
        ok: true,
        controlPlaneVersion: '1.0.0',
        sandboxWorkerUrl: sandboxClient.getWorkerUrl(),
        workerHealth,
        workerError,
        llm: llmClient.getPublicStatus(),
        vultrCloud: vultrCloud.getDefaults(),
        defaultPolicy: DEFAULT_CONTAINMENT_POLICY,
        templates: MISSION_TEMPLATES,
      });
      return;
    }

    // --- Runtime Settings (Vultr Inference / Cloud API / Remote Sandbox Node) ---
    if (method === 'POST' && pathname === '/api/settings') {
      const body = JSON.parse((await readBody(req)) || '{}') as Partial<RuntimeLlmConfig> & {
        vultrApiKey?: string;
        sandboxWorkerUrl?: string;
        sandboxSharedSecret?: string;
      };

      llmClient.updateConfig(body);
      if (body.vultrApiKey !== undefined) {
        vultrCloud.setApiKey(body.vultrApiKey);
      }
      if (body.sandboxWorkerUrl) {
        sandboxClient.configure(body.sandboxWorkerUrl, body.sandboxSharedSecret);
      }

      sendJson(res, 200, {
        updated: true,
        llm: llmClient.getPublicStatus(),
        vultrCloud: vultrCloud.getDefaults(),
        sandboxWorkerUrl: sandboxClient.getWorkerUrl(),
      });
      return;
    }

    // --- Vultr Cloud Compute & Serverless Inference Discovery ---
    if (method === 'GET' && pathname === '/api/vultr/overview') {
      const creds = llmClient.getVultrInferenceCredentials();
      const [modelsInfo, instances] = await Promise.all([
        vultrCloud.listInferenceModels(creds.apiKey, creds.baseUrl),
        vultrCloud.hasApiKey() ? vultrCloud.listInstances().catch(() => []) : Promise.resolve([]),
      ]);
      const sampleCloudInit = vultrCloud.generateSandboxCloudInit({
        sharedSecret: '<REDACTED_HMAC_SECRET>',
        region: vultrCloud.getDefaults().defaultRegion,
        label: 'aegis-vultr-sandbox-ewr',
      });

      sendJson(res, 200, {
        vultrApiConfigured: vultrCloud.hasApiKey(),
        inferenceModels: modelsInfo,
        instances,
        sampleCloudInit,
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/vultr/provision') {
      const body = JSON.parse((await readBody(req)) || '{}') as {
        region?: string;
        plan?: string;
        label?: string;
      };
      const result = await vultrCloud.provisionSandboxNode({
        region: body.region,
        plan: body.plan,
        label: body.label,
        sharedSecret: SHARED_SECRET,
      });
      sendJson(res, 201, result);
      return;
    }

    // --- Live 4-Vector Red-Team Containment Self-Test ---
    if (method === 'POST' && pathname === '/api/containment/audit') {
      const report = await runLiveContainmentAudit(sandboxClient, policyEngine);
      sendJson(res, 200, report);
      return;
    }

    // --- Enterprise Future-of-Work Operations Hub APIs ---
    if (method === 'GET' && pathname === '/api/enterprise/overview') {
      sendJson(res, 200, enterpriseStore.getOverview());
      return;
    }

    if (method === 'POST' && pathname === '/api/enterprise/reset') {
      const fresh = await enterpriseStore.resetToSeed();
      sendJson(res, 200, fresh);
      return;
    }

    if (method === 'POST' && pathname === '/api/enterprise/sales/leads') {
      const body = JSON.parse((await readBody(req)) || '{}') as {
        company: string;
        domainUrl: string;
        contactName: string;
        contactRole: string;
        contactEmail: string;
        estimatedArrUsd: number;
        industry: string;
      };
      if (!body.company || !body.domainUrl) {
        sendJson(res, 400, { error: 'company and domainUrl are required' });
        return;
      }
      const lead = await enterpriseStore.addLead(body);
      sendJson(res, 201, { lead, overview: enterpriseStore.getOverview() });
      return;
    }

    const salesQualifyMatch = pathname.match(/^\/api\/enterprise\/sales\/leads\/([a-zA-Z0-9_-]+)\/qualify$/);
    if (method === 'POST' && salesQualifyMatch) {
      const mission = await enterpriseWorkflows.launchSalesLeadQualification(salesQualifyMatch[1]);
      sendJson(res, 201, { mission, overview: enterpriseStore.getOverview() });
      return;
    }

    if (method === 'POST' && pathname === '/api/enterprise/finance/invoices') {
      const body = JSON.parse((await readBody(req)) || '{}') as {
        invoiceNumber: string;
        vendorName: string;
        poNumber: string;
        category: string;
        expectedPoAmountUsd: number;
        billedAmountUsd: number;
        dueDate: string;
        ibanLast4: string;
        expectedIbanLast4: string;
      };
      if (!body.vendorName) {
        sendJson(res, 400, { error: 'vendorName is required' });
        return;
      }
      const invoice = await enterpriseStore.addInvoice(body);
      sendJson(res, 201, { invoice, overview: enterpriseStore.getOverview() });
      return;
    }

    if (method === 'POST' && pathname === '/api/enterprise/finance/reconcile') {
      const mission = await enterpriseWorkflows.launchFinanceReconciliation();
      sendJson(res, 201, { mission, overview: enterpriseStore.getOverview() });
      return;
    }

    if (method === 'POST' && pathname === '/api/enterprise/support/tickets') {
      const body = JSON.parse((await readBody(req)) || '{}') as {
        customerName: string;
        customerTier: 'Enterprise' | 'Growth';
        subject: string;
        category: 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security';
        priority: 'P1' | 'P2' | 'P3';
        requestedCreditUsd?: number;
      };
      if (!body.customerName || !body.subject) {
        sendJson(res, 400, { error: 'customerName and subject are required' });
        return;
      }
      const ticket = await enterpriseStore.addTicket(body);
      sendJson(res, 201, { ticket, overview: enterpriseStore.getOverview() });
      return;
    }

    const supportInvestigateMatch = pathname.match(/^\/api\/enterprise\/support\/tickets\/([a-zA-Z0-9_-]+)\/investigate$/);
    if (method === 'POST' && supportInvestigateMatch) {
      const mission = await enterpriseWorkflows.launchSupportInvestigation(supportInvestigateMatch[1]);
      sendJson(res, 201, { mission, overview: enterpriseStore.getOverview() });
      return;
    }

    const approvalDecideMatch = pathname.match(/^\/api\/enterprise\/approvals\/([a-zA-Z0-9_-]+)\/decide$/);
    if (method === 'POST' && approvalDecideMatch) {
      const body = JSON.parse((await readBody(req)) || '{}') as {
        decision: 'approved' | 'rejected';
        reviewerNote?: string;
      };
      const approval = await enterpriseStore.decideApproval(
        approvalDecideMatch[1],
        body.decision === 'rejected' ? 'rejected' : 'approved',
        body.reviewerNote
      );
      sendJson(res, 200, { approval, overview: enterpriseStore.getOverview() });
      return;
    }

    // --- Missions API ---
    if (method === 'GET' && pathname === '/api/missions') {
      sendJson(res, 200, { missions: orchestrator.listMissions() });
      return;
    }

    if (method === 'POST' && pathname === '/api/missions') {
      const body = JSON.parse((await readBody(req)) || '{}') as {
        prompt?: string;
        templateId?: string;
        policy?: Partial<ContainmentPolicy>;
      };
      if (!body.prompt || !body.prompt.trim()) {
        sendJson(res, 400, { error: 'Mission prompt is required' });
        return;
      }
      const mission = await orchestrator.startMission({
        prompt: body.prompt.trim(),
        templateId: body.templateId,
        policyOverrides: body.policy,
      });
      sendJson(res, 201, { mission });
      return;
    }

    const msnMatch = pathname.match(/^\/api\/missions\/([a-zA-Z0-9_-]+)(?:\/(.*))?$/);
    if (msnMatch) {
      const missionId = msnMatch[1];
      const sub = msnMatch[2] || '';
      const mission = orchestrator.getMission(missionId);
      if (!mission) {
        sendJson(res, 404, { error: 'Mission not found' });
        return;
      }

      if (method === 'GET' && sub === '') {
        sendJson(res, 200, { mission });
        return;
      }

      if (method === 'GET' && sub === 'verify') {
        const verification = orchestrator.verifyMissionChain(missionId);
        sendJson(res, 200, verification);
        return;
      }

      if (method === 'GET' && sub === 'stream') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        // Replay existing events so late-joining SSE clients have complete history
        for (const ev of mission.events) {
          res.write(`data: ${JSON.stringify(ev)}\n\n`);
        }

        const unsubscribe = orchestrator.subscribe(missionId, (ev) => {
          res.write(`data: ${JSON.stringify(ev)}\n\n`);
        });

        const heartbeat = setInterval(() => {
          res.write(': keepalive\n\n');
        }, 15000);

        req.on('close', () => {
          clearInterval(heartbeat);
          unsubscribe();
        });
        return;
      }

      if (method === 'GET' && sub === 'artifact') {
        const relPath = urlObj.searchParams.get('path');
        if (!relPath || !mission.sandboxId) {
          sendJson(res, 400, { error: 'Missing artifact path or sandbox session' });
          return;
        }
        const { buffer, mimeType } = await sandboxClient.readArtifactRaw(
          mission.sandboxId,
          relPath
        );
        const download = urlObj.searchParams.get('download') === '1';
        const headers: Record<string, string | number> = {
          'Content-Type': mimeType,
          'Content-Length': buffer.length,
          'Access-Control-Allow-Origin': '*',
        };
        if (download) {
          const fname = path.basename(relPath);
          headers['Content-Disposition'] = `attachment; filename="${fname}"`;
        }
        res.writeHead(200, headers);
        res.end(buffer);
        return;
      }
    }

    // --- Production Static Frontend Serving (when built) ---
    if (method === 'GET' && fs.existsSync(STATIC_WEB_DIST)) {
      const requested = pathname === '/' ? '/index.html' : pathname;
      const candidate = path.resolve(STATIC_WEB_DIST, '.' + requested);
      if (candidate.startsWith(STATIC_WEB_DIST) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const ext = path.extname(candidate).toLowerCase();
        const buf = await fsp.readFile(candidate);
        res.writeHead(200, {
          'Content-Type': STATIC_MIME[ext] || 'application/octet-stream',
          'Content-Length': buf.length,
        });
        res.end(buf);
        return;
      }
      const indexHtml = path.join(STATIC_WEB_DIST, 'index.html');
      if (fs.existsSync(indexHtml)) {
        const buf = await fsp.readFile(indexHtml);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': buf.length,
        });
        res.end(buf);
        return;
      }
    }

    sendJson(res, 404, { error: `Route not found: ${method} ${pathname}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    sendJson(res, 500, { error: msg });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[AEGIS Control Plane] Listening on http://0.0.0.0:${PORT} -> dispatching to Sandbox Worker at ${sandboxClient.getWorkerUrl()}`
  );
});
