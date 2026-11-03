import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ApprovalItem,
  EnterpriseOverviewPayload,
  FinanceInvoice,
  SalesLead,
  SupportTicket,
} from '@aegis/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.resolve(__dirname, '../../../data/enterprise_state.json');

interface PersistedState {
  leads: SalesLead[];
  invoices: FinanceInvoice[];
  tickets: SupportTicket[];
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
        this.state = JSON.parse(raw) as PersistedState;
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

  getOverview(): EnterpriseOverviewPayload {
    const leads = this.state.leads;
    const invoices = this.state.invoices;
    const tickets = this.state.tickets;
    const approvals = [...this.state.approvals].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );

    const pipelineArrUsd = leads.reduce((sum, l) => sum + l.estimatedArrUsd, 0);
    const qualifiedLeadsCount = leads.filter((l) =>
      ['qualified', 'outreach_queued', 'contacted'].includes(l.stage)
    ).length;

    const totalInvoicedUsd = invoices.reduce((sum, i) => sum + i.billedAmountUsd, 0);
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
      },
      leads,
      invoices,
      tickets,
      approvals,
    };
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

  getInvoices(): FinanceInvoice[] {
    return this.state.invoices;
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
      invoiceNumber: input.invoiceNumber.trim() || `INV-2026-${Math.floor(5000 + Math.random() * 4000)}`,
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
    const inv = this.state.invoices.find((i) => i.id === id);
    if (!inv) return undefined;
    Object.assign(inv, patch, { updatedAt: new Date().toISOString() });
    await this.save();
    return inv;
  }

  getTicket(id: string): SupportTicket | undefined {
    return this.state.tickets.find((t) => t.id === id);
  }

  async addTicket(input: {
    customerName: string;
    customerTier: 'Enterprise' | 'Growth';
    subject: string;
    category: 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security';
    priority: 'P1' | 'P2' | 'P3';
    requestedCreditUsd?: number;
  }): Promise<SupportTicket> {
    const credit = Number(input.requestedCreditUsd || 0);
    const ticket: SupportTicket = {
      id: `tkt_${crypto.randomBytes(4).toString('hex')}`,
      ticketNumber: `TKT-${Math.floor(910 + Math.random() * 89)}`,
      customerName: input.customerName.trim(),
      customerTier: input.customerTier || 'Enterprise',
      subject: input.subject.trim(),
      category: input.category || 'API & Webhooks',
      priority: input.priority || 'P2',
      status: 'open',
      requiresHumanApproval: credit >= 500 || input.priority === 'P1',
      requestedCreditUsd: credit > 0 ? credit : undefined,
      diagnosticPayload: {
        issueType: 'custom_ticket_investigation',
        submittedSubject: input.subject.trim(),
        requestedCreditUsd: credit,
        timestampUtc: new Date().toISOString(),
      },
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

  async upsertApproval(item: Omit<ApprovalItem, 'id' | 'createdAt'>): Promise<ApprovalItem> {
    const existing = this.state.approvals.find(
      (a) => a.entityId === item.entityId && a.department === item.department && a.status === 'pending'
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
    }

    await this.save();
    return apr;
  }
}
