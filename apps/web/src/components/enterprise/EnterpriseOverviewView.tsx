import {
  Briefcase,
  Receipt,
  LifeBuoy,
  UserCheck,
  TerminalSquare,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { EnterpriseOverviewPayload } from '@aegis/shared';

export type WorkspaceTab =
  | 'overview'
  | 'sales'
  | 'finance'
  | 'support'
  | 'approvals'
  | 'studio';

interface EnterpriseOverviewViewProps {
  overview: EnterpriseOverviewPayload | null;
  onNavigate: (tab: WorkspaceTab) => void;
  onResetDemo: () => Promise<void>;
  onQuickReconcileFinance: () => Promise<void>;
  onQuickQualifyTopLead: () => Promise<void>;
  onQuickTriageTopTicket: () => Promise<void>;
  isBusy: boolean;
}

export function EnterpriseOverviewView({
  overview,
  onNavigate,
  onResetDemo,
  onQuickReconcileFinance,
  onQuickQualifyTopLead,
  onQuickTriageTopTicket,
  isBusy,
}: EnterpriseOverviewViewProps) {
  const s = overview?.stats;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Hero Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0b1325] via-[#09101f] to-[#081518] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Sparkles className="w-3 h-3" />
            Vultr Enterprise Operations Control Plane + Contained Sandbox Execution
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Future-of-Work Autonomous Operations Hub
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Every business workflow—live web prospect qualification, 3-way AP invoice reconciliation,
            and untrusted support log diagnostics—executes inside an isolated sandbox on Vultr,
            returns Ed25519-signed outputs, and routes high-impact actions through Human-in-the-Loop
            approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => void onResetDemo()}
            disabled={isBusy}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={() => onNavigate('studio')}
            className="px-3.5 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <TerminalSquare className="w-3.5 h-3.5" />
            <span>Open Sandbox Studio</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('sales')}
          className="rounded-xl border border-slate-800/90 bg-[#090e1a] hover:border-sky-500/40 p-4 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sales Pipeline ARR</span>
            <Briefcase className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${(s?.pipelineArrUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-emerald-400">
            {s?.qualifiedLeadsCount ?? 0} / {s?.totalLeadsCount ?? 0} leads researched &amp; qualified
          </div>
        </div>

        <div
          onClick={() => onNavigate('finance')}
          className="rounded-xl border border-slate-800/90 bg-[#090e1a] hover:border-emerald-500/40 p-4 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Prevented AP Leakage</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            ${(s?.preventedLeakageUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {s?.reconciledInvoicesCount ?? 0} reconciled •{' '}
            <span className="text-rose-400">{s?.flaggedAnomaliesCount ?? 0} anomalies flagged</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('support')}
          className="rounded-xl border border-slate-800/90 bg-[#090e1a] hover:border-purple-500/40 p-4 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Support &amp; Incident Queue</span>
            <LifeBuoy className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {s?.openTicketsCount ?? 0} Open
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            <span className="text-emerald-400">{s?.autoResolvedTicketsCount ?? 0} auto-fixed</span> •{' '}
            <span className="text-amber-400">{s?.escalatedTicketsCount ?? 0} escalated</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('approvals')}
          className="rounded-xl border border-slate-800/90 bg-[#090e1a] hover:border-amber-500/40 p-4 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Human Approval Inbox</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {s?.pendingApprovalsCount ?? 0} Pending
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Every recommendation backed by Ed25519 receipts
          </div>
        </div>
      </div>

      {/* 3 Enterprise Department Workflow Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Ops Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#090e1a] p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                Sales Operations
              </span>
              <span className="text-[11px] font-mono text-slate-500">Chromium + Python ICP</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              Live Prospect Research, CRM Qualification &amp; Outreach
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visits prospect domains inside the SSRF-guarded Headless Chromium sandbox, extracts
              live product &amp; security signals, computes a deterministic ICP fit score in Python,
              updates CRM stage, and queues personalized executive outreach for approval.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => void onQuickQualifyTopLead()}
              disabled={isBusy}
              className="flex-1 py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-xs cursor-pointer transition"
            >
              Qualify Next Lead Live
            </button>
            <button
              onClick={() => onNavigate('sales')}
              className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>CRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Finance & Accounting Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#090e1a] p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Finance &amp; Accounting
              </span>
              <span className="text-[11px] font-mono text-slate-500">Python 3-Way Match</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              AP Invoice Reconciliation, Fraud &amp; Overbilling Audit
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatches invoices &amp; purchase orders into an isolated Python workspace to verify
              3-way PO tolerances, catch duplicate submissions &amp; vendor IBAN tampering, generate
              a CFO SVG/HTML audit pack, and stage payment holds.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => void onQuickReconcileFinance()}
              disabled={isBusy}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs cursor-pointer transition"
            >
              Run AP Ledger Audit
            </button>
            <button
              onClick={() => onNavigate('finance')}
              className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Customer Support Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#090e1a] p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Customer Support
              </span>
              <span className="text-[11px] font-mono text-slate-500">Sandboxed Triage</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              Cross-System Ticket Reproduction &amp; Human Escalation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Isolates untrusted customer webhook payloads, billing logs, and SAML assertions inside
              the sandbox to reproduce root causes in Python—auto-resolving tier-2 issues and
              escalating credits or security policy changes to human sign-off.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => void onQuickTriageTopTicket()}
              disabled={isBusy}
              className="flex-1 py-2 px-3 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-semibold text-xs cursor-pointer transition"
            >
              Triage Next P1 Ticket
            </button>
            <button
              onClick={() => onNavigate('support')}
              className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Platform Architecture Strip */}
      <div className="rounded-xl border border-slate-800/80 bg-[#080c17] p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Why Containment-First Matters for Enterprise Ops:</strong>{' '}
            Scraping external prospect websites and parsing untrusted vendor/customer payloads are top
            prompt-injection &amp; SSRF vectors. AEGIS isolates every execution step on Vultr.
          </span>
        </div>
        <button
          onClick={() => onNavigate('studio')}
          className="text-sky-400 hover:text-sky-300 font-mono text-[11px] cursor-pointer"
        >
          Inspect Raw Sandbox Studio &amp; Receipts →
        </button>
      </div>
    </div>
  );
}
