import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ApprovalItem,
  EnterpriseOverviewPayload,
  FinanceInvoice,
  HrCandidate,
  ProcurementRequisition,
  SalesLead,
  SupportTicket,
} from '@aegis/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.resolve(__dirname, '../../../data/enterprise_state.json');

interface PersistedState {
  leads: SalesLead[];
  invoices: FinanceInvoice[];
  tickets: SupportTicket[];
  candidates: HrCandidate[];
  procurements: ProcurementRequisition[];
  approvals: ApprovalItem[];
}

function buildSeedState(): PersistedState {
  const now = new Date().toISOString();
  return {
    leads: [
      {
        id: 'lead_wiki_ops',
        company: 'Wikimedia Enterprise Platform',
        domainUrl: 'https://www.wikipedia.org',
        contactName: 'Elena Rostova',
        contactRole: 'VP of Platform Engineering',
        contactEmail: 'erostova@wikimedia-enterprise-demo.org',
        estimatedArrUsd: 145000,
        industry: 'Global Knowledge & High-Traffic Web',
        stage: 'new',
        detectedSignals: [],
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'lead_psf_infra',
        company: 'Python Cloud Ecosystem Corp',
        domainUrl: 'https://www.python.org',
        contactName: 'Marcus Vance',
        contactRole: 'Director of Cloud Infrastructure',
        contactEmail: 'mvance@python-cloud-demo.org',
        estimatedArrUsd: 98000,
        industry: 'Developer Tooling & AI Runtime',
        stage: 'new',
        detectedSignals: [],
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'lead_yc_digest',
        company: 'HN Founder Syndicate',
        domainUrl: 'https://news.ycombinator.com',
        contactName: 'Devon Lin',
        contactRole: 'Head of Developer Ecosystem',
        contactEmail: 'devon@hn-syndicate-demo.com',
        estimatedArrUsd: 68000,
        industry: 'Developer Platforms & Venture',
        stage: 'new',
        detectedSignals: [],
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'lead_iana_ref',
        company: 'Example Global Logistics',
        domainUrl: 'https://example.com',
        contactName: 'Claire Sterling',
        contactRole: 'Chief Operations Officer',
        contactEmail: 'csterling@example-logistics.io',
        estimatedArrUsd: 38000,
        industry: 'Supply Chain & Freight',
        stage: 'new',
        detectedSignals: [],
        isUserCreated: false,
        updatedAt: now,
      },
    ],
    invoices: [
      {
        id: 'inv_4012',
        invoiceNumber: 'INV-2026-4012',
        vendorName: 'CloudScale Transit Inc.',
        poNumber: 'PO-8810',
        category: 'Backbone Bandwidth',
        expectedPoAmountUsd: 14200,
        billedAmountUsd: 14200,
        dueDate: '2026-11-18',
        ibanLast4: '7741',
        expectedIbanLast4: '7741',
        status: 'pending_review',
        anomalyType: 'NONE',
        varianceUsd: 0,
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'inv_4015',
        invoiceNumber: 'INV-2026-4015',
        vendorName: 'Observability Grid Co.',
        poNumber: 'PO-8842',
        category: 'APM & Telemetry SaaS',
        expectedPoAmountUsd: 8500,
        billedAmountUsd: 8520,
        dueDate: '2026-11-20',
        ibanLast4: '3309',
        expectedIbanLast4: '3309',
        status: 'pending_review',
        anomalyType: 'NONE',
        varianceUsd: 20,
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'inv_4018a',
        invoiceNumber: 'INV-2026-4018',
        vendorName: 'Apex Technical Staffing',
        poNumber: 'PO-8901',
        category: 'Contractor Engineering',
        expectedPoAmountUsd: 19400,
        billedAmountUsd: 19400,
        dueDate: '2026-11-15',
        ibanLast4: '9102',
        expectedIbanLast4: '9102',
        status: 'pending_review',
        anomalyType: 'NONE',
        varianceUsd: 0,
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'inv_4018b',
        invoiceNumber: 'INV-2026-4018-DUP',
        vendorName: 'Apex Technical Staffing',
        poNumber: 'PO-8901',
        category: 'Contractor Engineering',
        expectedPoAmountUsd: 19400,
        billedAmountUsd: 19400,
        dueDate: '2026-11-16',
        ibanLast4: '9102',
        expectedIbanLast4: '9102',
        status: 'pending_review',
        anomalyType: 'NONE',
        varianceUsd: 0,
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'inv_4022',
        invoiceNumber: 'INV-2026-4022',
        vendorName: 'Nexus Hardware Logistics',
        poNumber: 'PO-8955',
        category: 'Rack Equipment & Procurement',
        expectedPoAmountUsd: 25000,
        billedAmountUsd: 31150,
        dueDate: '2026-11-12',
        ibanLast4: '5520',
        expectedIbanLast4: '5520',
        status: 'pending_review',
        anomalyType: 'NONE',
        varianceUsd: 6150,
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'inv_4029',
        invoiceNumber: 'INV-2026-4029',
        vendorName: 'Vector Cyber Defense Ltd.',
        poNumber: 'PO-9012',
        category: 'SOC Compliance Retainer',
        expectedPoAmountUsd: 16800,
        billedAmountUsd: 16800,
        dueDate: '2026-11-14',
        ibanLast4: '8821',
        expectedIbanLast4: '4410',
        status: 'pending_review',
        anomalyType: 'NONE',
        varianceUsd: 0,
        isUserCreated: false,
        updatedAt: now,
      },
    ],
    tickets: [
      {
        id: 'tkt_901',
        ticketNumber: 'TKT-901',
        customerName: 'FinStream Payments Corp',
        customerTier: 'Enterprise',
        subject: 'Production Webhook HMAC-SHA256 Signatures Failing 401 After Payload UTF-8 Upgrade',
        category: 'API & Webhooks',
        priority: 'P1',
        status: 'open',
        requiresHumanApproval: false,
        diagnosticPayload: {
          issueType: 'webhook_hmac_mismatch',
          sharedSecretPreview: 'whsec_test_demo_key_991',
          rawPayloadJson: '{"event":"payout.settled","merchant":"Café Münchner","amount":4200}',
          customerComputedHeader: 'd41d8cd98f00b204e9800998ecf8427e',
          encodingUsedByCustomer: 'latin1',
          expectedEncoding: 'utf-8',
        },
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'tkt_904',
        ticketNumber: 'TKT-904',
        customerName: 'Northstar BioLabs',
        customerTier: 'Enterprise',
        subject: 'Mid-Cycle Seat Downgrade Pro-Ration Dispute & $2,850 SLA Credit Request',
        category: 'Billing & Ledger',
        priority: 'P1',
        status: 'open',
        requiresHumanApproval: true,
        requestedCreditUsd: 2850,
        diagnosticPayload: {
          issueType: 'billing_proration_credit',
          planPricePerSeatMonthly: 95,
          initialSeats: 120,
          downgradedSeats: 80,
          dayOfCycleChanged: 10,
          billingCycleDays: 30,
          billedAmountUsd: 11400,
          requestedRefundUsd: 2850,
        },
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'tkt_908',
        ticketNumber: 'TKT-908',
        customerName: 'Meridian Freight Systems',
        customerTier: 'Growth',
        subject: 'Intermittent SAML 2.0 SSO Login Rejections (NotOnOrAfter Clock Skew)',
        category: 'SSO & Security',
        priority: 'P2',
        status: 'open',
        requiresHumanApproval: true,
        diagnosticPayload: {
          issueType: 'saml_clock_skew',
          idpIssuer: 'urn:meridian:okta:idp',
          assertionNotBeforeEpoch: 1793709000,
          assertionNotOnOrAfterEpoch: 1793709060,
          spServerEpochAtValidation: 1793709195,
          configuredAllowedSkewSec: 30,
        },
        isUserCreated: false,
        updatedAt: now,
      },
    ],
    candidates: [
      {
        id: 'cand_101',
        candidateName: 'Alexei Voronov',
        email: 'alexei.voronov@staff-dev.io',
        appliedRole: 'Staff Distributed Systems Engineer',
        experienceYears: 8,
        techStack: ['Rust', 'Go', 'Kubernetes', 'eBPF', 'Docker', 'Distributed Consensus (Raft)'],
        desiredSalaryUsd: 185000,
        resumeSummary:
          'Principal author of multi-region gRPC service meshes. 5 years maintaining low-latency Linux kernel hooks and zero-copy packet processing pipelines.',
        portfolioUrl: 'https://github.com/example/alexei-mesh',
        status: 'new',
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'cand_102',
        candidateName: 'Sarah Jenkins',
        email: 'sarah.jenkins@ai-runtime.net',
        appliedRole: 'Senior AI Inference Infrastructure Lead',
        experienceYears: 6,
        techStack: ['Python', 'PyTorch', 'vLLM', 'CUDA', 'Triton', 'TensorRT-LLM', 'Docker'],
        desiredSalaryUsd: 175000,
        resumeSummary:
          'Specialist in high-throughput LLM serving clusters on Vultr GPU cloud. Reduced p99 token-to-first-token latency by 44% with dynamic batching.',
        portfolioUrl: 'https://github.com/example/sarah-vllm-bench',
        status: 'new',
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'cand_103',
        candidateName: 'Kenji Takahashi',
        email: 'kenji.t@frontend-sec.org',
        appliedRole: 'Senior Full-Stack & Security Engineer',
        experienceYears: 5,
        techStack: ['TypeScript', 'React', 'Node.js', 'WebAuthn', 'SSO/SAML', 'PostgreSQL'],
        desiredSalaryUsd: 155000,
        resumeSummary:
          'Architect of enterprise B2B auth suites, zero-trust RBAC dashboards, and real-time WebSocket state synchronizers.',
        portfolioUrl: 'https://github.com/example/kenji-sec',
        status: 'new',
        isUserCreated: false,
        updatedAt: now,
      },
    ],
    procurements: [
      {
        id: 'req_301',
        reqNumber: 'REQ-2026-301',
        title: 'NVIDIA H100 Cloud GPU Cluster (8-Node High-Speed Interconnect)',
        department: 'AI Research & Platform Ops',
        targetBudgetUsd: 48000,
        deliveryDeadline: '2026-11-28',
        vendorBids: [
          {
            vendorName: 'Vultr Cloud Compute',
            quoteAmountUsd: 41200,
            deliveryDays: 1,
            slaGuaranteePercent: 99.99,
            reliabilityScore: 5,
          },
          {
            vendorName: 'Hyperscale Cloud Corp',
            quoteAmountUsd: 49800,
            deliveryDays: 5,
            slaGuaranteePercent: 99.9,
            reliabilityScore: 4,
          },
          {
            vendorName: 'Legacy Metal Hosting',
            quoteAmountUsd: 44500,
            deliveryDays: 12,
            slaGuaranteePercent: 99.5,
            reliabilityScore: 3,
          },
        ],
        status: 'pending_rfp',
        isUserCreated: false,
        updatedAt: now,
      },
      {
        id: 'req_302',
        reqNumber: 'REQ-2026-302',
        title: 'Global Edge Anycast Transit & WAF DDoS Mitigation Pool',
        department: 'Backbone Networking',
        targetBudgetUsd: 22000,
        deliveryDeadline: '2026-12-05',
        vendorBids: [
          {
            vendorName: 'CloudScale Fiber Edge',
            quoteAmountUsd: 18900,
            deliveryDays: 3,
            slaGuaranteePercent: 99.99,
            reliabilityScore: 5,
          },
          {
            vendorName: 'Global Shield CDN',
            quoteAmountUsd: 23400,
            deliveryDays: 4,
            slaGuaranteePercent: 99.95,
            reliabilityScore: 4,
          },
        ],
        status: 'pending_rfp',
        isUserCreated: false,
        updatedAt: now,
      },
    ],
    approvals: [],
  };
}

export class EnterpriseStore {
  private state: PersistedState = buildSeedState();

  constructor() {
    this.loadSync();
  }

  private loadSync(): void {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        const seed = buildSeedState();
        this.state = {
          leads: Array.isArray(parsed.leads) ? parsed.leads : seed.leads,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : seed.invoices,
          tickets: Array.isArray(parsed.tickets) ? parsed.tickets : seed.tickets,
          candidates: Array.isArray(parsed.candidates) ? parsed.candidates : seed.candidates,
          procurements: Array.isArray(parsed.procurements) ? parsed.procurements : seed.procurements,
          approvals: Array.isArray(parsed.approvals) ? parsed.approvals : seed.approvals,
        };
      } else {
        this.persistSync();
      }
    } catch {
      this.state = buildSeedState();
    }
  }

  private persistSync(): void {
    try {
      fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.state, null, 2), 'utf8');
    } catch {
      // ignore read-only fs fallback
    }
  }

  async save(): Promise<void> {
    await fsp.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fsp.writeFile(STORE_PATH, JSON.stringify(this.state, null, 2), 'utf8');
  }

  async resetToSeed(): Promise<EnterpriseOverviewPayload> {
    this.state = buildSeedState();
    await this.save();
    return this.getOverview();
  }

  async clearAllData(): Promise<EnterpriseOverviewPayload> {
    this.state = {
      leads: [],
      invoices: [],
      tickets: [],
      candidates: [],
      procurements: [],
      approvals: [],
    };
    await this.save();
    return this.getOverview();
  }

  getOverview(): EnterpriseOverviewPayload {
    const leads = this.state.leads;
    const invoices = this.state.invoices;
    const tickets = this.state.tickets;
    const candidates = this.state.candidates;
    const procurements = this.state.procurements;
    const approvals = [...this.state.approvals].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );

    const pipelineArrUsd = leads.reduce((sum, l) => sum + (Number(l.estimatedArrUsd) || 0), 0);
    const qualifiedLeadsCount = leads.filter((l) =>
      ['qualified', 'outreach_queued', 'contacted'].includes(l.stage)
    ).length;

    const totalInvoicedUsd = invoices.reduce((sum, i) => sum + (Number(i.billedAmountUsd) || 0), 0);
    const reconciledInvoicesCount = invoices.filter(
      (i) => i.status === 'reconciled' || i.status === 'approved_for_payment'
    ).length;
    const flaggedInvoices = invoices.filter(
      (i) => i.status === 'anomaly_flagged' || i.status === 'payment_held'
    );
    const preventedLeakageUsd = flaggedInvoices.reduce((sum, i) => {
      if (i.anomalyType === 'DUPLICATE_INVOICE' || i.anomalyType === 'BANK_IBAN_MISMATCH') {
        return sum + i.billedAmountUsd;
      }
      return sum + Math.max(0, i.billedAmountUsd - i.expectedPoAmountUsd);
    }, 0);

    const totalCandidatesCount = candidates.length;
    const screenedCandidatesCount = candidates.filter(
      (c) => c.status === 'screened' || c.status === 'interview_scheduled'
    ).length;

    const totalProcurementBudgetUsd = procurements.reduce(
      (sum, p) => sum + (Number(p.targetBudgetUsd) || 0),
      0
    );
    const procurementSavingsUsd = procurements.reduce(
      (sum, p) => sum + (Number(p.savingsUsd) || 0),
      0
    );

    return {
      stats: {
        pipelineArrUsd,
        qualifiedLeadsCount,
        totalLeadsCount: leads.length,
        totalInvoicedUsd,
        reconciledInvoicesCount,
        flaggedAnomaliesCount: flaggedInvoices.length,
        preventedLeakageUsd,
        openTicketsCount: tickets.filter((t) => t.status === 'open').length,
        autoResolvedTicketsCount: tickets.filter((t) => t.status === 'auto_resolved').length,
        escalatedTicketsCount: tickets.filter((t) => t.status === 'escalated_human').length,
        pendingApprovalsCount: approvals.filter((a) => a.status === 'pending').length,
        totalCandidatesCount,
        screenedCandidatesCount,
        totalProcurementBudgetUsd,
        procurementSavingsUsd,
      },
      leads,
      invoices,
      tickets,
      candidates,
      procurements,
      approvals,
    };
  }

  // --- SALES LEADS ---
  getLeads(): SalesLead[] {
    return this.state.leads;
  }

  getLead(id: string): SalesLead | undefined {
    return this.state.leads.find((l) => l.id === id);
  }

  async addLead(input: {
    company: string;
    domainUrl: string;
    contactName: string;
    contactRole: string;
    contactEmail: string;
    estimatedArrUsd: number;
    industry: string;
  }): Promise<SalesLead> {
    const lead: SalesLead = {
      id: `lead_${crypto.randomBytes(4).toString('hex')}`,
      company: input.company.trim(),
      domainUrl: input.domainUrl.trim(),
      contactName: input.contactName.trim() || 'VP of Operations',
      contactRole: input.contactRole.trim() || 'Decision Maker',
      contactEmail: input.contactEmail.trim() || 'ops@prospect-company.io',
      estimatedArrUsd: Number(input.estimatedArrUsd) || 50000,
      industry: input.industry.trim() || 'Enterprise Technology',
      stage: 'new',
      detectedSignals: [],
      isUserCreated: true,
      updatedAt: new Date().toISOString(),
    };
    this.state.leads.unshift(lead);
    await this.save();
    return lead;
  }

  async updateLead(id: string, patch: Partial<SalesLead>): Promise<SalesLead | undefined> {
    const lead = this.getLead(id);
    if (!lead) return undefined;
    Object.assign(lead, patch, { updatedAt: new Date().toISOString() });
    await this.save();
    return lead;
  }

  async deleteLead(id: string): Promise<boolean> {
    const idx = this.state.leads.findIndex((l) => l.id === id);
    if (idx < 0) return false;
    this.state.leads.splice(idx, 1);
    this.state.approvals = this.state.approvals.filter(
      (a) => !(a.department === 'sales' && a.entityId === id)
    );
    await this.save();
    return true;
  }

  // --- FINANCE INVOICES ---
  getInvoices(): FinanceInvoice[] {
    return this.state.invoices;
  }

  getInvoice(id: string): FinanceInvoice | undefined {
    return this.state.invoices.find((i) => i.id === id);
  }

  async addInvoice(input: {
    invoiceNumber: string;
    vendorName: string;
    poNumber: string;
    category: string;
    expectedPoAmountUsd: number;
    billedAmountUsd: number;
    dueDate: string;
    ibanLast4: string;
    expectedIbanLast4: string;
  }): Promise<FinanceInvoice> {
    const expected = Number(input.expectedPoAmountUsd) || 10000;
    const billed = Number(input.billedAmountUsd) || 10000;
    const inv: FinanceInvoice = {
      id: `inv_${crypto.randomBytes(4).toString('hex')}`,
      invoiceNumber:
        input.invoiceNumber.trim() ||
        `INV-2026-${Math.floor(5000 + Math.random() * 4000)}`,
      vendorName: input.vendorName.trim(),
      poNumber: input.poNumber.trim() || 'PO-9100',
      category: input.category.trim() || 'Cloud & Software',
      expectedPoAmountUsd: expected,
      billedAmountUsd: billed,
      dueDate: input.dueDate || '2026-11-25',
      ibanLast4: input.ibanLast4.trim() || '1122',
      expectedIbanLast4: input.expectedIbanLast4.trim() || '1122',
      status: 'pending_review',
      anomalyType: 'NONE',
      varianceUsd: billed - expected,
      isUserCreated: true,
      updatedAt: new Date().toISOString(),
    };
    this.state.invoices.unshift(inv);
    await this.save();
    return inv;
  }

  async updateInvoice(
    id: string,
    patch: Partial<FinanceInvoice>
  ): Promise<FinanceInvoice | undefined> {
    const inv = this.getInvoice(id);
    if (!inv) return undefined;
    Object.assign(inv, patch, { updatedAt: new Date().toISOString() });
    await this.save();
    return inv;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const idx = this.state.invoices.findIndex((i) => i.id === id);
    if (idx < 0) return false;
    this.state.invoices.splice(idx, 1);
    this.state.approvals = this.state.approvals.filter(
      (a) => !(a.department === 'finance' && a.entityId === id)
    );
    await this.save();
    return true;
  }

  // --- CUSTOMER SUPPORT ---
  getTickets(): SupportTicket[] {
    return this.state.tickets;
  }

  getTicket(id: string): SupportTicket | undefined {
    return this.state.tickets.find((t) => t.id === id);
  }

  async addTicket(input: {
    customerName: string;
    customerTier: 'Enterprise' | 'Growth';
    subject: string;
    category?: 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security' | 'Performance & Scale' | 'General Operations';
    priority: 'P1' | 'P2' | 'P3';
    requestedCreditUsd?: number;
    diagnosticPayload?: Record<string, unknown>;
  }): Promise<SupportTicket> {
    const credit = Number(input.requestedCreditUsd || 0);
    const ticket: SupportTicket = {
      id: `tkt_${crypto.randomBytes(4).toString('hex')}`,
      ticketNumber: `TKT-${Math.floor(910 + Math.random() * 89)}`,
      customerName: input.customerName.trim(),
      customerTier: input.customerTier || 'Enterprise',
      subject: input.subject.trim(),
      category: input.category || 'General Operations',
      priority: input.priority || 'P2',
      status: 'open',
      requiresHumanApproval: credit >= 500 || input.priority === 'P1',
      requestedCreditUsd: credit > 0 ? credit : undefined,
      diagnosticPayload: input.diagnosticPayload || {
        issueType: 'custom_diagnostic',
        submittedSubject: input.subject.trim(),
        requestedCreditUsd: credit,
        rawLogs: `Customer ${input.customerName} reported: "${input.subject}" at ${new Date().toISOString()}`,
      },
      isUserCreated: true,
      updatedAt: new Date().toISOString(),
    };
    this.state.tickets.unshift(ticket);
    await this.save();
    return ticket;
  }

  async updateTicket(
    id: string,
    patch: Partial<SupportTicket>
  ): Promise<SupportTicket | undefined> {
    const t = this.getTicket(id);
    if (!t) return undefined;
    Object.assign(t, patch, { updatedAt: new Date().toISOString() });
    await this.save();
    return t;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const idx = this.state.tickets.findIndex((t) => t.id === id);
    if (idx < 0) return false;
    this.state.tickets.splice(idx, 1);
    this.state.approvals = this.state.approvals.filter(
      (a) => !(a.department === 'support' && a.entityId === id)
    );
    await this.save();
    return true;
  }

  // --- HR & RECRUITMENT ---
  getCandidates(): HrCandidate[] {
    return this.state.candidates;
  }

  getCandidate(id: string): HrCandidate | undefined {
    return this.state.candidates.find((c) => c.id === id);
  }

  async addCandidate(input: {
    candidateName: string;
    email: string;
    appliedRole: string;
    experienceYears: number;
    techStack: string[];
    desiredSalaryUsd: number;
    resumeSummary: string;
    portfolioUrl?: string;
  }): Promise<HrCandidate> {
    const cand: HrCandidate = {
      id: `cand_${crypto.randomBytes(4).toString('hex')}`,
      candidateName: input.candidateName.trim(),
      email: input.email.trim(),
      appliedRole: input.appliedRole.trim(),
      experienceYears: Number(input.experienceYears) || 3,
      techStack: Array.isArray(input.techStack) ? input.techStack : [input.techStack].filter(Boolean),
      desiredSalaryUsd: Number(input.desiredSalaryUsd) || 150000,
      resumeSummary: input.resumeSummary.trim(),
      portfolioUrl: input.portfolioUrl?.trim(),
      status: 'new',
      isUserCreated: true,
      updatedAt: new Date().toISOString(),
    };
    this.state.candidates.unshift(cand);
    await this.save();
    return cand;
  }

  async updateCandidate(
    id: string,
    patch: Partial<HrCandidate>
  ): Promise<HrCandidate | undefined> {
    const c = this.getCandidate(id);
    if (!c) return undefined;
    Object.assign(c, patch, { updatedAt: new Date().toISOString() });
    await this.save();
    return c;
  }

  async deleteCandidate(id: string): Promise<boolean> {
    const idx = this.state.candidates.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    this.state.candidates.splice(idx, 1);
    this.state.approvals = this.state.approvals.filter(
      (a) => !(a.department === 'hr' && a.entityId === id)
    );
    await this.save();
    return true;
  }

  // --- PROCUREMENT ---
  getProcurements(): ProcurementRequisition[] {
    return this.state.procurements;
  }

  getProcurement(id: string): ProcurementRequisition | undefined {
    return this.state.procurements.find((p) => p.id === id);
  }

  async addProcurement(input: {
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
  }): Promise<ProcurementRequisition> {
    const req: ProcurementRequisition = {
      id: `req_${crypto.randomBytes(4).toString('hex')}`,
      reqNumber: `REQ-2026-${Math.floor(310 + Math.random() * 89)}`,
      title: input.title.trim(),
      department: input.department.trim() || 'Engineering Infrastructure',
      targetBudgetUsd: Number(input.targetBudgetUsd) || 25000,
      deliveryDeadline: input.deliveryDeadline || '2026-12-01',
      vendorBids: input.vendorBids || [],
      status: 'pending_rfp',
      isUserCreated: true,
      updatedAt: new Date().toISOString(),
    };
    this.state.procurements.unshift(req);
    await this.save();
    return req;
  }

  async updateProcurement(
    id: string,
    patch: Partial<ProcurementRequisition>
  ): Promise<ProcurementRequisition | undefined> {
    const p = this.getProcurement(id);
    if (!p) return undefined;
    Object.assign(p, patch, { updatedAt: new Date().toISOString() });
    await this.save();
    return p;
  }

  async deleteProcurement(id: string): Promise<boolean> {
    const idx = this.state.procurements.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    this.state.procurements.splice(idx, 1);
    this.state.approvals = this.state.approvals.filter(
      (a) => !(a.department === 'procurement' && a.entityId === id)
    );
    await this.save();
    return true;
  }

  // --- APPROVALS & HUMAN-IN-THE-LOOP ---
  async upsertApproval(item: Omit<ApprovalItem, 'id' | 'createdAt'>): Promise<ApprovalItem> {
    const existing = this.state.approvals.find(
      (a) =>
        a.entityId === item.entityId &&
        a.department === item.department &&
        a.status === 'pending'
    );
    if (existing) {
      Object.assign(existing, item);
      await this.save();
      return existing;
    }
    const created: ApprovalItem = {
      ...item,
      id: `apr_${crypto.randomBytes(4).toString('hex')}`,
      createdAt: new Date().toISOString(),
    };
    this.state.approvals.unshift(created);
    await this.save();
    return created;
  }

  async decideApproval(
    approvalId: string,
    decision: 'approved' | 'rejected',
    reviewerNote?: string
  ): Promise<ApprovalItem> {
    const apr = this.state.approvals.find((a) => a.id === approvalId);
    if (!apr) throw new Error('Approval item not found');

    apr.status = decision;
    apr.decidedAt = new Date().toISOString();
    apr.reviewerNote = reviewerNote;

    if (apr.department === 'sales') {
      await this.updateLead(apr.entityId, {
        stage: decision === 'approved' ? 'contacted' : 'nurture',
      });
    } else if (apr.department === 'finance') {
      await this.updateInvoice(apr.entityId, {
        status: decision === 'approved' ? 'payment_held' : 'approved_for_payment',
      });
    } else if (apr.department === 'support') {
      await this.updateTicket(apr.entityId, {
        status: decision === 'approved' ? 'resolved' : 'open',
      });
    } else if (apr.department === 'hr') {
      await this.updateCandidate(apr.entityId, {
        status: decision === 'approved' ? 'interview_scheduled' : 'rejected',
      });
    } else if (apr.department === 'procurement') {
      await this.updateProcurement(apr.entityId, {
        status: decision === 'approved' ? 'po_approved' : 'rejected',
      });
    }

    await this.save();
    return apr;
  }
}
