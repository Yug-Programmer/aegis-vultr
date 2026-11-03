export type LeadStage =
  | 'new'
  | 'researching'
  | 'qualified'
  | 'outreach_queued'
  | 'contacted'
  | 'nurture';

export interface SalesLead {
  id: string;
  company: string;
  domainUrl: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  estimatedArrUsd: number;
  industry: string;
  stage: LeadStage;
  icpScore?: number;
  researchSummary?: string;
  detectedSignals: string[];
  draftOutreachSubject?: string;
  draftOutreachBody?: string;
  lastMissionId?: string;
  updatedAt: string;
}

export type InvoiceStatus =
  | 'pending_review'
  | 'reconciling'
  | 'reconciled'
  | 'anomaly_flagged'
  | 'payment_held'
  | 'approved_for_payment';

export type InvoiceAnomalyType =
  | 'NONE'
  | 'DUPLICATE_INVOICE'
  | 'PO_OVERBILLING'
  | 'BANK_IBAN_MISMATCH';

export interface FinanceInvoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  poNumber: string;
  category: string;
  expectedPoAmountUsd: number;
  billedAmountUsd: number;
  dueDate: string;
  ibanLast4: string;
  expectedIbanLast4: string;
  status: InvoiceStatus;
  anomalyType: InvoiceAnomalyType;
  varianceUsd: number;
  riskScore?: number;
  auditNotes?: string;
  followUpDraft?: string;
  lastMissionId?: string;
  updatedAt: string;
}

export type SupportTicketStatus =
  | 'open'
  | 'investigating'
  | 'auto_resolved'
  | 'escalated_human'
  | 'resolved';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerTier: 'Enterprise' | 'Growth';
  subject: string;
  category: 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security';
  priority: 'P1' | 'P2' | 'P3';
  status: SupportTicketStatus;
  diagnosticPayload: Record<string, unknown>;
  rootCauseSummary?: string;
  proposedResolution?: string;
  requiresHumanApproval: boolean;
  requestedCreditUsd?: number;
  lastMissionId?: string;
  updatedAt: string;
}

export type ApprovalDepartment = 'sales' | 'finance' | 'support';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalItem {
  id: string;
  department: ApprovalDepartment;
  entityId: string;
  title: string;
  subtitle: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: ApprovalStatus;
  recommendedAction: string;
  draftCommunication: string;
  missionId: string;
  receiptCount: number;
  receiptHeadHash: string;
  createdAt: string;
  decidedAt?: string;
  reviewerNote?: string;
}

export interface EnterpriseOverviewPayload {
  stats: {
    pipelineArrUsd: number;
    qualifiedLeadsCount: number;
    totalLeadsCount: number;
    totalInvoicedUsd: number;
    reconciledInvoicesCount: number;
    flaggedAnomaliesCount: number;
    preventedLeakageUsd: number;
    openTicketsCount: number;
    autoResolvedTicketsCount: number;
    escalatedTicketsCount: number;
    pendingApprovalsCount: number;
  };
  leads: SalesLead[];
  invoices: FinanceInvoice[];
  tickets: SupportTicket[];
  approvals: ApprovalItem[];
}
