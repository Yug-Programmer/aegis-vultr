import type {
  ApprovalItem,
  ChainVerificationResult,
  ContainmentAuditReport,
  ContainmentPolicy,
  EnterpriseOverviewPayload,
  FinanceInvoice,
  MissionEvent,
  MissionRecord,
  SalesLead,
  SandboxWorkerHealth,
  SupportTicket,
} from '@aegis/shared';

export interface MissionTemplate {
  id: string;
  title: string;
  badge: string;
  category: string;
  description: string;
  prompt: string;
}

export interface SystemStatusResponse {
  ok: boolean;
  controlPlaneVersion: string;
  sandboxWorkerUrl: string;
  workerHealth: SandboxWorkerHealth | null;
  workerError?: string;
  llm: {
    preferredProvider: string;
    activeMode: string;
    activeModel: string;
    vultrInferenceConfigured: boolean;
    vultrInferenceModel: string;
    vultrInferenceBaseUrl: string;
    geminiConfigured: boolean;
    geminiModel: string;
    openaiConfigured: boolean;
    openaiModel: string;
  };
  vultrCloud: {
    configured: boolean;
    defaultRegion: string;
    defaultPlan: string;
  };
  defaultPolicy: ContainmentPolicy;
  templates: MissionTemplate[];
}

export interface VultrOverviewResponse {
  vultrApiConfigured: boolean;
  inferenceModels: {
    live: boolean;
    models: string[];
  };
  instances: Array<{
    id: string;
    label: string;
    region: string;
    plan: string;
    mainIp: string;
    status: string;
    powerStatus: string;
    os: string;
    vcpuCount: number;
    ramMb: number;
  }>;
  sampleCloudInit: string;
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return (await res.json()) as SystemStatusResponse;
}

export async function fetchMissions(): Promise<MissionRecord[]> {
  const res = await fetch('/api/missions');
  if (!res.ok) throw new Error(`Missions fetch failed: ${res.status}`);
  const data = (await res.json()) as { missions: MissionRecord[] };
  return data.missions;
}

export async function fetchMission(id: string): Promise<MissionRecord> {
  const res = await fetch(`/api/missions/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Mission fetch failed: ${res.status}`);
  const data = (await res.json()) as { mission: MissionRecord };
  return data.mission;
}

export async function createMission(opts: {
  prompt: string;
  templateId?: string;
  policy?: Partial<ContainmentPolicy>;
}): Promise<MissionRecord> {
  const res = await fetch('/api/missions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  const data = (await res.json()) as { mission?: MissionRecord; error?: string };
  if (!res.ok || !data.mission) {
    throw new Error(data.error || `Failed to create mission (${res.status})`);
  }
  return data.mission;
}

export function subscribeToMissionEvents(
  missionId: string,
  onEvent: (ev: MissionEvent) => void
): () => void {
  const es = new EventSource(`/api/missions/${encodeURIComponent(missionId)}/stream`);
  es.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data) as MissionEvent;
      onEvent(parsed);
    } catch {
      // ignore heartbeat
    }
  };
  return () => {
    es.close();
  };
}

export async function verifyMissionReceipts(id: string): Promise<ChainVerificationResult> {
  const res = await fetch(`/api/missions/${encodeURIComponent(id)}/verify`);
  if (!res.ok) throw new Error('Receipt chain verification request failed');
  return (await res.json()) as ChainVerificationResult;
}

export function getArtifactUrl(missionId: string, relativePath: string, download = false): string {
  const dl = download ? '&download=1' : '';
  return `/api/missions/${encodeURIComponent(missionId)}/artifact?path=${encodeURIComponent(relativePath)}${dl}`;
}

export async function runContainmentAudit(): Promise<ContainmentAuditReport> {
  const res = await fetch('/api/containment/audit', { method: 'POST' });
  const data = (await res.json()) as ContainmentAuditReport & { error?: string };
  if (!res.ok) throw new Error(data.error || 'Containment audit failed');
  return data;
}

export async function fetchVultrOverview(): Promise<VultrOverviewResponse> {
  const res = await fetch('/api/vultr/overview');
  if (!res.ok) throw new Error('Failed to load Vultr overview');
  return (await res.json()) as VultrOverviewResponse;
}

export async function saveRuntimeSettings(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

export async function provisionVultrSandboxNode(payload: {
  region: string;
  plan: string;
  label?: string;
}) {
  const res = await fetch('/api/vultr/provision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to provision Vultr node');
  }
  return data;
}

export async function fetchEnterpriseOverview(): Promise<EnterpriseOverviewPayload> {
  const res = await fetch('/api/enterprise/overview');
  if (!res.ok) throw new Error('Failed to load enterprise overview');
  return (await res.json()) as EnterpriseOverviewPayload;
}

export async function resetEnterpriseDataset(): Promise<EnterpriseOverviewPayload> {
  const res = await fetch('/api/enterprise/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset dataset');
  return (await res.json()) as EnterpriseOverviewPayload;
}

export async function createSalesLead(payload: {
  company: string;
  domainUrl: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  estimatedArrUsd: number;
  industry: string;
}): Promise<{ lead: SalesLead; overview: EnterpriseOverviewPayload }> {
  const res = await fetch('/api/enterprise/sales/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add lead');
  return data;
}

export async function triggerSalesLeadQualification(
  leadId: string
): Promise<{ mission: MissionRecord; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(`/api/enterprise/sales/leads/${encodeURIComponent(leadId)}/qualify`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to launch lead qualification');
  return data;
}

export async function createFinanceInvoice(payload: {
  invoiceNumber: string;
  vendorName: string;
  poNumber: string;
  category: string;
  expectedPoAmountUsd: number;
  billedAmountUsd: number;
  dueDate: string;
  ibanLast4: string;
  expectedIbanLast4: string;
}): Promise<{ invoice: FinanceInvoice; overview: EnterpriseOverviewPayload }> {
  const res = await fetch('/api/enterprise/finance/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add invoice');
  return data;
}

export async function triggerFinanceReconciliation(): Promise<{
  mission: MissionRecord;
  overview: EnterpriseOverviewPayload;
}> {
  const res = await fetch('/api/enterprise/finance/reconcile', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to launch reconciliation');
  return data;
}

export async function createSupportTicket(payload: {
  customerName: string;
  customerTier: 'Enterprise' | 'Growth';
  subject: string;
  category: 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security';
  priority: 'P1' | 'P2' | 'P3';
  requestedCreditUsd?: number;
}): Promise<{ ticket: SupportTicket; overview: EnterpriseOverviewPayload }> {
  const res = await fetch('/api/enterprise/support/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create ticket');
  return data;
}

export async function triggerSupportInvestigation(
  ticketId: string
): Promise<{ mission: MissionRecord; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(
    `/api/enterprise/support/tickets/${encodeURIComponent(ticketId)}/investigate`,
    { method: 'POST' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to investigate ticket');
  return data;
}

export async function decideApprovalItem(
  approvalId: string,
  decision: 'approved' | 'rejected',
  reviewerNote?: string
): Promise<{ approval: ApprovalItem; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(
    `/api/enterprise/approvals/${encodeURIComponent(approvalId)}/decide`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewerNote }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit approval decision');
  return data;
}
