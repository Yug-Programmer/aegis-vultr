import { useState } from 'react';
import {
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import type { EnterpriseOverviewPayload } from '@aegis/shared';

export type WorkspaceTab =
  | 'overview'
  | 'chat'
  | 'sales'
  | 'finance'
  | 'support'
  | 'hr'
  | 'procurement'
  | 'approvals'
  | 'studio';

interface EnterpriseOverviewViewProps {
  overview: EnterpriseOverviewPayload | null;
  onNavigate: (tab: WorkspaceTab) => void;
  onResetDemo: () => Promise<void>;
  onClearData?: () => Promise<void>;
  onQuickReconcileFinance: () => Promise<void>;
  onQuickQualifyTopLead: () => Promise<void>;
  onQuickTriageTopTicket: () => Promise<void>;
  onQuickScreenCandidate?: () => Promise<void>;
  onQuickEvaluateProcurement?: () => Promise<void>;
  isBusy: boolean;
}

export function EnterpriseOverviewView({
  overview,
  onNavigate,
  onResetDemo,
  onClearData,
  onQuickReconcileFinance,
  onQuickQualifyTopLead,
  onQuickTriageTopTicket,
  onQuickScreenCandidate,
  onQuickEvaluateProcurement,
  isBusy,
}: EnterpriseOverviewViewProps) {
  const s = overview?.stats;
  const [menuOpen, setMenuOpen] = useState(false);
  const [containmentExpanded, setContainmentExpanded] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-7 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2E2E2E]">
        <div>
          <h1 className="text-[18px] font-semibold text-[#F2F2F2] tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs text-[#888888] mt-1">
            Monitor business operations, autonomous workflows, and security activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Subtle Demo Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md text-[#777777] hover:text-[#D0D0D0] hover:bg-[#2A2A2A] text-xs font-medium transition cursor-pointer flex items-center"
              title="Demo & Environment Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-md bg-[#242424] border border-[#333333] shadow-xl py-1 z-30">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void onResetDemo();
                  }}
                  disabled={isBusy}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#888888] hover:text-[#D0D0D0] hover:bg-[#2A2A2A] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>
                {onClearData && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void onClearData();
                    }}
                    disabled={isBusy}
                    className="w-full px-3 py-1.5 text-left text-xs text-[#F87171] hover:bg-[#2A2A2A] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 rotate-180" />
                    <span>Clear All Datasets</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('chat')}
            className="px-3 py-1.5 rounded-md bg-[#242424] hover:bg-[#2A2A2A] border border-[#2E2E2E] text-[#D0D0D0] hover:text-[#F2F2F2] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition"
          >
            <span>Agent Chat</span>
          </button>

          <button
            onClick={() => onNavigate('studio')}
            className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#191919] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Sales Pipeline ARR */}
        <div
          onClick={() => onNavigate('sales')}
          className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] hover:bg-[#242424] hover:border-[#38BDF8]/30 p-5 cursor-pointer transition-all flex flex-col justify-between gap-3"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#777777]">
            Sales Pipeline ARR
          </div>
          <div className="text-[26px] font-semibold tracking-tight text-[#F2F2F2] leading-none">
            ${(s?.pipelineArrUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-[#777777] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] flex-shrink-0" />
            <span>{s?.qualifiedLeadsCount ?? 0} of {s?.totalLeadsCount ?? 0} qualified</span>
          </div>
        </div>

        {/* Prevented AP Leakage */}
        <div
          onClick={() => onNavigate('finance')}
          className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] hover:bg-[#242424] hover:border-[#34D399]/30 p-5 cursor-pointer transition-all flex flex-col justify-between gap-3"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#777777]">
            Prevented AP Leakage
          </div>
          <div className="text-[26px] font-semibold tracking-tight text-[#34D399] leading-none">
            ${(s?.preventedLeakageUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-[#777777] flex items-center gap-2 flex-wrap">
            <span>{s?.reconciledInvoicesCount ?? 0} reconciled</span>
            <span className="text-[#444444]">·</span>
            <span className={s?.flaggedAnomaliesCount ? 'text-[#F87171]' : 'text-[#777777]'}>
              {s?.flaggedAnomaliesCount ?? 0} anomalies
            </span>
          </div>
        </div>

        {/* Support Queue */}
        <div
          onClick={() => onNavigate('support')}
          className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] hover:bg-[#242424] hover:border-[#38BDF8]/30 p-5 cursor-pointer transition-all flex flex-col justify-between gap-3"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#777777]">
            Support Queue
          </div>
          <div className="text-[26px] font-semibold tracking-tight text-[#F2F2F2] leading-none">
            {s?.openTicketsCount ?? 0}
            <span className="text-sm font-normal text-[#777777] ml-2">Open</span>
          </div>
          <div className="text-xs text-[#777777] flex items-center gap-2 flex-wrap">
            <span>{s?.autoResolvedTicketsCount ?? 0} resolved</span>
            <span className="text-[#444444]">·</span>
            <span className={s?.escalatedTicketsCount ? 'text-[#FBBF24]' : 'text-[#777777]'}>
              {s?.escalatedTicketsCount ?? 0} escalated
            </span>
          </div>
        </div>

        {/* Approval Inbox */}
        <div
          onClick={() => onNavigate('approvals')}
          className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] hover:bg-[#242424] hover:border-[#FBBF24]/30 p-5 cursor-pointer transition-all flex flex-col justify-between gap-3"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#777777]">
            Approval Inbox
          </div>
          <div className="text-[26px] font-semibold tracking-tight text-[#FBBF24] leading-none">
            {s?.pendingApprovalsCount ?? 0}
            <span className="text-sm font-normal text-[#777777] ml-2">Pending</span>
          </div>
          <div className="text-xs text-[#777777]">
            Cryptographically signed
          </div>
        </div>
      </div>

      {/* Autonomous Operations Section */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
          Autonomous Operations
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Sales Operations Card */}
          <div className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] p-5 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider font-semibold">
                  Sales Ops
                </span>
                <span className="text-[11px] font-mono text-[#555555]">
                  Chromium + Python
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F2F2F2] leading-snug">
                Prospect Research &amp; Qualification
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                Visits prospect domains inside an isolated Chromium sandbox, evaluates product signals,
                computes deterministic ICP fit scores, and prepares personalized outreach for approval.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#2A2A2A]">
              <button
                onClick={() => void onQuickQualifyTopLead()}
                disabled={isBusy}
                className="flex-1 py-2 px-3 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-40 text-[#191919] font-semibold text-xs cursor-pointer transition text-center"
              >
                Qualify Next Lead
              </button>
              <button
                onClick={() => onNavigate('sales')}
                className="py-2 px-2.5 rounded-md hover:bg-[#2A2A2A] text-[#777777] hover:text-[#D0D0D0] text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Finance & Accounting Card */}
          <div className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] p-5 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#34D399] uppercase tracking-wider font-semibold">
                  Finance &amp; AP
                </span>
                <span className="text-[11px] font-mono text-[#555555]">
                  3-Way Match
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F2F2F2] leading-snug">
                AP Invoice Reconciliation &amp; Fraud Audit
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                Matches invoices and POs in an isolated Python workspace to identify duplicate submissions,
                unauthorized overbilling, and vendor IBAN tampering before disbursement.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#2A2A2A]">
              <button
                onClick={() => void onQuickReconcileFinance()}
                disabled={isBusy}
                className="flex-1 py-2 px-3 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] disabled:opacity-40 text-[#191919] font-semibold text-xs cursor-pointer transition text-center"
              >
                Run AP Audit
              </button>
              <button
                onClick={() => onNavigate('finance')}
                className="py-2 px-2.5 rounded-md hover:bg-[#2A2A2A] text-[#777777] hover:text-[#D0D0D0] text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Customer Support Card */}
          <div className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] p-5 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider font-semibold">
                  Support
                </span>
                <span className="text-[11px] font-mono text-[#555555]">
                  Sandboxed Triage
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F2F2F2] leading-snug">
                Ticket Reproduction &amp; Diagnostics
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                Isolates untrusted customer webhook payloads, billing logs, and SAML assertions inside
                the sandbox to reproduce errors safely, resolving tickets and routing policy escalations.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#2A2A2A]">
              <button
                onClick={() => void onQuickTriageTopTicket()}
                disabled={isBusy}
                className="flex-1 py-2 px-3 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-40 text-[#191919] font-semibold text-xs cursor-pointer transition text-center"
              >
                Triage Next Ticket
              </button>
              <button
                onClick={() => onNavigate('support')}
                className="py-2 px-2.5 rounded-md hover:bg-[#2A2A2A] text-[#777777] hover:text-[#D0D0D0] text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* HR & Talent Card */}
          <div className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] p-5 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#A78BFA] uppercase tracking-wider font-semibold">
                  HR &amp; Talent
                </span>
                <span className="text-[11px] font-mono text-[#555555]">
                  Sandboxed NLP + Match
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F2F2F2] leading-snug">
                Candidate Screening &amp; Technical Fit
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                Screens candidate resumes, GitHub signals, and tech stacks in the Python sandbox,
                computes deterministic fit scores, and prepares tailored interview guides for HR approval.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#2A2A2A]">
              <button
                onClick={() => onQuickScreenCandidate ? void onQuickScreenCandidate() : onNavigate('hr')}
                disabled={isBusy}
                className="flex-1 py-2 px-3 rounded-md bg-[#A78BFA] hover:bg-[#C4B5FD] disabled:opacity-40 text-[#191919] font-semibold text-xs cursor-pointer transition text-center"
              >
                Screen Candidate
              </button>
              <button
                onClick={() => onNavigate('hr')}
                className="py-2 px-2.5 rounded-md hover:bg-[#2A2A2A] text-[#777777] hover:text-[#D0D0D0] text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>Talent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Procurement & Vendor Card */}
          <div className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] p-5 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#FBBF24] uppercase tracking-wider font-semibold">
                  Procurement
                </span>
                <span className="text-[11px] font-mono text-[#555555]">
                  MCDA Matrix
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F2F2F2] leading-snug">
                Vendor RFP Multi-Criteria Optimization
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                Evaluates vendor bids across price, SLA, lead-time, and reliability inside the sandbox,
                generating an optimal PO requisition packet with projected budget savings for CFO approval.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#2A2A2A]">
              <button
                onClick={() => onQuickEvaluateProcurement ? void onQuickEvaluateProcurement() : onNavigate('procurement')}
                disabled={isBusy}
                className="flex-1 py-2 px-3 rounded-md bg-[#FBBF24] hover:bg-[#FDE68A] disabled:opacity-40 text-[#191919] font-semibold text-xs cursor-pointer transition text-center"
              >
                Evaluate Next RFP
              </button>
              <button
                onClick={() => onNavigate('procurement')}
                className="py-2 px-2.5 rounded-md hover:bg-[#2A2A2A] text-[#777777] hover:text-[#D0D0D0] text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>Bids</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Containment Architecture Information */}
      <div className="rounded-lg border border-[#2E2E2E] bg-[#1A1A1A] overflow-hidden">
        <button
          onClick={() => setContainmentExpanded(!containmentExpanded)}
          className="w-full p-3.5 flex items-center justify-between text-xs text-[#888888] hover:text-[#D0D0D0] cursor-pointer transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#34D399] shrink-0" />
            <span className="font-medium text-[#D0D0D0]">
              Containment-First Architecture
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#555555] hidden sm:inline">
              SSRF isolation &amp; Ed25519 cryptographic receipts
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                containmentExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {containmentExpanded && (
          <div className="px-3.5 pb-3.5 pt-1 text-xs text-[#888888] border-t border-[#2E2E2E] space-y-2 leading-relaxed">
            <p>
              Scraping external prospect websites and parsing untrusted vendor invoices or customer payloads are top
              prompt-injection and SSRF vectors. AEGIS isolates every execution step on Vultr Cloud Compute with gVisor sandbox
              containment, blocking private network egress (169.254.169.254 metadata and RFC1918) and signing every artifact with Ed25519 keys.
            </p>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => onNavigate('studio')}
                className="text-[#38BDF8] hover:underline text-[11px] font-mono cursor-pointer flex items-center gap-1"
              >
                <span>Inspect Sandbox Studio &amp; Receipts</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
