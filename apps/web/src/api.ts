import type {
  ApprovalItem,
  ChainVerificationResult,
  ContainmentAuditReport,
  ContainmentPolicy,
  EnterpriseOverviewPayload,
  FinanceInvoice,
  HrCandidate,
  MissionEvent,
  MissionRecord,
  ProcurementRequisition,
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

export const API_BASE = (((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL) || '').replace(/\/+$/, '');

export function apiUrl(endpoint: string): string {
  if (!API_BASE) return endpoint;
  return `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
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
  const res = await fetch(apiUrl('/api/status'));
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return (await res.json()) as SystemStatusResponse;
}

export async function fetchMissions(): Promise<MissionRecord[]> {
  const res = await fetch(apiUrl('/api/missions'));
  if (!res.ok) throw new Error(`Missions fetch failed: ${res.status}`);
  const data = (await res.json()) as { missions: MissionRecord[] };
  return data.missions;
}

export async function fetchMission(id: string): Promise<MissionRecord> {
  const res = await fetch(apiUrl(`/api/missions/${encodeURIComponent(id)}`));
  if (!res.ok) throw new Error(`Mission fetch failed: ${res.status}`);
  const data = (await res.json()) as { mission: MissionRecord };
  return data.mission;
}

export async function createMission(opts: {
  prompt: string;
  templateId?: string;
  policy?: Partial<ContainmentPolicy>;
}): Promise<MissionRecord> {
  const res = await fetch(apiUrl('/api/missions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start mission');
  return data.mission;
}

export async function verifyMission(id: string): Promise<ChainVerificationResult> {
  const res = await fetch(apiUrl(`/api/missions/${encodeURIComponent(id)}/verify`));
  if (!res.ok) throw new Error(`Verification failed: ${res.status}`);
  return (await res.json()) as ChainVerificationResult;
}

export async function runContainmentAudit(): Promise<ContainmentAuditReport> {
  const res = await fetch(apiUrl('/api/containment/audit'), { method: 'POST' });
  if (!res.ok) throw new Error(`Audit failed: ${res.status}`);
  const data = (await res.json()) as { report: ContainmentAuditReport };
  return data.report;
}

export async function fetchVultrOverview(): Promise<VultrOverviewResponse> {
  const res = await fetch(apiUrl('/api/vultr/overview'));
  if (!res.ok) throw new Error(`Vultr overview failed: ${res.status}`);
  return (await res.json()) as VultrOverviewResponse;
}

export function subscribeToMissionEvents(
  missionId: string,
  onEvent: (event: MissionEvent) => void,
  onError?: (err: unknown) => void
): () => void {
  const es = new EventSource(apiUrl(`/api/missions/${encodeURIComponent(missionId)}/stream`));
  es.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data) as MissionEvent;
      onEvent(parsed);
    } catch (e) {
      onError?.(e);
    }
  };
  es.onerror = (err) => {
    onError?.(err);
  };
  return () => {
    es.close();
  };
}

export async function verifyMissionReceipts(id: string): Promise<ChainVerificationResult> {
  const res = await fetch(apiUrl(`/api/missions/${encodeURIComponent(id)}/verify`));
  if (!res.ok) throw new Error('Receipt chain verification request failed');
  return (await res.json()) as ChainVerificationResult;
}

export function getArtifactUrl(missionId: string, relativePath: string, download = false): string {
  const dl = download ? '&download=1' : '';
  return apiUrl(`/api/missions/${encodeURIComponent(missionId)}/artifact?path=${encodeURIComponent(relativePath)}${dl}`);
}

export async function saveRuntimeSettings(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(apiUrl('/api/settings'), {
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
  const res = await fetch(apiUrl('/api/vultr/provision'), {
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

export function getArtifactDownloadUrl(missionId: string, filename: string): string {
  return apiUrl(`/api/missions/${encodeURIComponent(missionId)}/artifacts/${encodeURIComponent(filename)}`);
}

// ==========================================
// ENTERPRISE WORKFLOWS & DATA ENGINE (5 DEPARTMENTS)
// ==========================================

export async function fetchEnterpriseOverview(): Promise<EnterpriseOverviewPayload> {
  const res = await fetch(apiUrl('/api/enterprise/overview'));
  if (!res.ok) throw new Error(`Enterprise overview failed: ${res.status}`);
  const data = (await res.json()) as { overview: EnterpriseOverviewPayload };
  return data.overview;
}

export async function resetEnterpriseDataset(): Promise<EnterpriseOverviewPayload> {
  const res = await fetch(apiUrl('/api/enterprise/reset'), { method: 'POST' });
  const data = (await res.json()) as EnterpriseOverviewPayload;
  return data;
}

export async function clearEnterpriseDataset(): Promise<EnterpriseOverviewPayload> {
  const res = await fetch(apiUrl('/api/enterprise/clear'), { method: 'POST' });
  const data = (await res.json()) as EnterpriseOverviewPayload;
  return data;
}

// 1. SALES OPERATIONS
export async function createSalesLead(payload: {
  company: string;
  domainUrl: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  estimatedArrUsd: number;
  industry: string;
}): Promise<{ lead: SalesLead; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl('/api/enterprise/sales/leads'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add lead');
  return data;
}

export async function deleteSalesLead(
  leadId: string
): Promise<{ ok: boolean; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl(`/api/enterprise/sales/leads/${encodeURIComponent(leadId)}`), {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete lead');
  return data;
}

export async function triggerSalesLeadQualification(
  leadId: string
): Promise<{ mission: MissionRecord; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl(`/api/enterprise/sales/leads/${encodeURIComponent(leadId)}/qualify`), {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to launch lead qualification');
  return data;
}

// 2. FINANCE & ACCOUNTING
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
  const res = await fetch(apiUrl('/api/enterprise/finance/invoices'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add invoice');
  return data;
}

export async function deleteFinanceInvoice(
  invoiceId: string
): Promise<{ ok: boolean; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl(`/api/enterprise/finance/invoices/${encodeURIComponent(invoiceId)}`), {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete invoice');
  return data;
}

export async function triggerFinanceReconciliation(): Promise<{
  mission: MissionRecord;
  overview: EnterpriseOverviewPayload;
}> {
  const res = await fetch(apiUrl('/api/enterprise/finance/reconcile'), { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to launch reconciliation');
  return data;
}

// 3. CUSTOMER SUPPORT
export async function createSupportTicket(payload: {
  customerName: string;
  customerTier: 'Enterprise' | 'Growth';
  subject: string;
  category?: 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security' | 'Performance & Scale' | 'General Operations';
  priority: 'P1' | 'P2' | 'P3';
  requestedCreditUsd?: number;
  diagnosticPayload?: Record<string, unknown>;
}): Promise<{ ticket: SupportTicket; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl('/api/enterprise/support/tickets'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create ticket');
  return data;
}

export async function deleteSupportTicket(
  ticketId: string
): Promise<{ ok: boolean; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl(`/api/enterprise/support/tickets/${encodeURIComponent(ticketId)}`), {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete ticket');
  return data;
}

export async function triggerSupportInvestigation(
  ticketId: string
): Promise<{ mission: MissionRecord; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(
    apiUrl(`/api/enterprise/support/tickets/${encodeURIComponent(ticketId)}/investigate`),
    { method: 'POST' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to investigate ticket');
  return data;
}

// 4. HR & RECRUITMENT
export async function createHrCandidate(payload: {
  candidateName: string;
  email: string;
  appliedRole: string;
  experienceYears: number;
  techStack: string[];
  desiredSalaryUsd: number;
  resumeSummary: string;
  portfolioUrl?: string;
}): Promise<{ candidate: HrCandidate; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl('/api/enterprise/hr/candidates'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add candidate');
  return data;
}

export async function deleteHrCandidate(
  candidateId: string
): Promise<{ ok: boolean; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl(`/api/enterprise/hr/candidates/${encodeURIComponent(candidateId)}`), {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete candidate');
  return data;
}

export async function triggerCandidateScreening(
  candidateId: string
): Promise<{ mission: MissionRecord; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl(`/api/enterprise/hr/candidates/${encodeURIComponent(candidateId)}/screen`), {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to screen candidate');
  return data;
}

// 5. PROCUREMENT
export async function createProcurementRequisition(payload: {
  title: string;
  department: string;
  targetBudgetUsd: number;
  deliveryDeadline: string;
  vendorBids: Array<{
    vendorName: string;
    quoteAmountUsd: number;
    deliveryDays: number;
    slaGuaranteePercent: number;
    reliabilityScore: number;
  }>;
}): Promise<{ procurement: ProcurementRequisition; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl('/api/enterprise/procurement/requisitions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add requisition');
  return data;
}

export async function deleteProcurementRequisition(
  procurementId: string
): Promise<{ ok: boolean; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(apiUrl(`/api/enterprise/procurement/requisitions/${encodeURIComponent(procurementId)}`), {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete requisition');
  return data;
}

export async function triggerProcurementEvaluation(
  procurementId: string
): Promise<{ mission: MissionRecord; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(
    apiUrl(`/api/enterprise/procurement/requisitions/${encodeURIComponent(procurementId)}/evaluate`),
    { method: 'POST' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to evaluate procurement RFP');
  return data;
}

// APPROVALS
export async function decideApprovalItem(
  approvalId: string,
  decision: 'approved' | 'rejected',
  reviewerNote?: string
): Promise<{ approval: ApprovalItem; overview: EnterpriseOverviewPayload }> {
  const res = await fetch(
    apiUrl(`/api/enterprise/approvals/${encodeURIComponent(approvalId)}/decide`),
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
