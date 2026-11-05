import { useState } from 'react';
import {
  RotateCcw,
  ArrowRight,
  MoreHorizontal,
  ChevronDown,
  Trash2,
  UserCheck,
  Layers,
  Briefcase,
  Receipt,
  LifeBuoy,
} from 'lucide-react';
import type { EnterpriseOverviewPayload } from '@aegis/shared';

export type WorkspaceTab =
  | 'overview'
  | 'sales'
  | 'finance'
  | 'hr'
  | 'support'
  | 'procurement'
  | 'approvals'
  | 'studio';

interface EnterpriseOverviewViewProps {
  overview: EnterpriseOverviewPayload | null;
  onNavigate: (tab: WorkspaceTab) => void;
  onResetDemo: () => Promise<void>;
  onClearData: () => Promise<void>;
  onQuickReconcileFinance: () => Promise<void>;
  onQuickQualifyTopLead: () => Promise<void>;
  onQuickTriageTopTicket: () => Promise<void>;
  onQuickScreenCandidate: () => Promise<void>;
  onQuickEvaluateProcurement: () => Promise<void>;
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
    <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E232B]">
        <div>
          <h1 className="text-xl font-semibold text-[#F4F4F5] tracking-tight">
            Autonomous Enterprise Control Plane
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Future-of-Work autonomous agents running inside isolated Vultr sandboxes with Ed25519 cryptographic receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Environment & Dataset Options */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-2.5 py-1.5 rounded-md text-[#9CA3AF] hover:text-[#F4F4F5] hover:bg-[#15181E] text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border border-[#242830]"
              title="Dataset & Environment Options"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>Dataset Options</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-52 rounded-md bg-[#15181E] border border-[#242830] shadow-xl py-1 z-30 divide-y divide-[#1E232B]">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void onResetDemo();
                  }}
                  disabled={isBusy}
                  className="w-full px-3 py-2 text-left text-xs text-[#9CA3AF] hover:text-[#F4F4F5] hover:bg-[#111419] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Reset Sample Demo Dataset</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void onClearData();
                  }}
                  disabled={isBusy}
                  className="w-full px-3 py-2 text-left text-xs text-[#F87171] hover:text-[#FCA5A5] hover:bg-[#111419] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All (Start Blank Canvas)</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('studio')}
            className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <span>Open Sandbox Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Section (6 Core Enterprise Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Sales Pipeline ARR */}
        <div
          onClick={() => onNavigate('sales')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#38BDF8]/40 p-4 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Sales Pipeline</span>
          </div>
          <div className="my-2 text-xl font-semibold tracking-tight text-[#F4F4F5]">
            ${(s?.pipelineArrUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#9CA3AF]">
            {s?.qualifiedLeadsCount ?? 0} of {s?.totalLeadsCount ?? 0} qualified
          </div>
        </div>

        {/* Prevented AP Leakage */}
        <div
          onClick={() => onNavigate('finance')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#34D399]/40 p-4 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-[#34D399]" />
            <span>AP Leakage Blocked</span>
          </div>
          <div className="my-2 text-xl font-semibold tracking-tight text-[#34D399]">
            ${(s?.preventedLeakageUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#9CA3AF]">
            {s?.flaggedAnomaliesCount ?? 0} anomalies caught
          </div>
        </div>

        {/* HR Candidates Screened */}
        <div
          onClick={() => onNavigate('hr')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#38BDF8]/40 p-4 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>HR Screening</span>
          </div>
          <div className="my-2 text-xl font-semibold tracking-tight text-[#F4F4F5]">
            {s?.totalCandidatesCount ?? 0}
            <span className="text-xs font-normal text-[#9CA3AF] ml-1">Candidates</span>
          </div>
          <div className="text-[11px] text-[#34D399]">
            {s?.screenedCandidatesCount ?? 0} screened &amp; scored
          </div>
        </div>

        {/* Procurement Savings */}
        <div
          onClick={() => onNavigate('procurement')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#34D399]/40 p-4 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Procurement Savings</span>
          </div>
          <div className="my-2 text-xl font-semibold tracking-tight text-[#34D399]">
            ${(s?.procurementSavingsUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#9CA3AF]">
            ${(s?.totalProcurementBudgetUsd ?? 0).toLocaleString()} budget
          </div>
        </div>

        {/* Support & Incident Queue */}
        <div
          onClick={() => onNavigate('support')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#38BDF8]/40 p-4 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <LifeBuoy className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Support Queue</span>
          </div>
          <div className="my-2 text-xl font-semibold tracking-tight text-[#F4F4F5]">
            {s?.openTicketsCount ?? 0}
            <span className="text-xs font-normal text-[#9CA3AF] ml-1">Open</span>
          </div>
          <div className="text-[11px] text-[#9CA3AF]">
            {s?.autoResolvedTicketsCount ?? 0} auto-resolved
          </div>
        </div>

        {/* Human Approval Inbox */}
        <div
          onClick={() => onNavigate('approvals')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#FBBF24]/40 p-4 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
            Approvals
          </div>
          <div className="my-2 text-xl font-semibold tracking-tight text-[#FBBF24]">
            {s?.pendingApprovalsCount ?? 0}
            <span className="text-xs font-normal text-[#9CA3AF] ml-1">Pending</span>
          </div>
          <div className="text-[11px] text-[#9CA3AF]">
            Ed25519 signed
          </div>
        </div>
      </div>

      {/* Operational Workflows Section (5 Challenge Focus Areas) */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Autonomous Enterprise Modules (Vultr Sandbox Powered)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Sales Operations Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider">
                  Sales Operations
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  Chromium + Python
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Prospect Research &amp; ICP Qualification
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Navigates prospect domains inside an isolated Chromium sandbox, evaluates DOM signals, computes multi-factor ICP fit (0-100), and stages executive outreach.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => void onQuickQualifyTopLead()}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] text-xs font-semibold cursor-pointer transition"
              >
                Qualify Prospect
              </button>
              <button
                onClick={() => onNavigate('sales')}
                className="px-3 py-1.5 rounded-md hover:bg-[#15181E] text-xs text-[#9CA3AF] hover:text-[#F4F4F5] font-medium transition cursor-pointer"
              >
                View Pipeline →
              </button>
            </div>
          </div>

          {/* 2. Finance & Accounting Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#34D399] uppercase tracking-wider">
                  Finance &amp; Accounting
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  Python 3-Way Match
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                AP Invoice Reconciliation &amp; Fraud Audit
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Runs 3-way match across Invoices, PO limits, and master vendor registries. Flags duplicate submissions, overbilling, and IBAN bank spoofing with CFO audit packs.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => void onQuickReconcileFinance()}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] disabled:opacity-50 text-[#0B0D10] text-xs font-semibold cursor-pointer transition"
              >
                Reconcile AP Ledger
              </button>
              <button
                onClick={() => onNavigate('finance')}
                className="px-3 py-1.5 rounded-md hover:bg-[#15181E] text-xs text-[#9CA3AF] hover:text-[#F4F4F5] font-medium transition cursor-pointer"
              >
                View Ledger →
              </button>
            </div>
          </div>

          {/* 3. HR & Recruitment Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider">
                  HR &amp; Recruitment
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  Python NLP + Radar
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Candidate Screening &amp; Skill Radar
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Scores candidate tech stack, experience depth, and compensation fit in sandbox. Synthesizes structured technical interview questions and stages offer approvals.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => void onQuickScreenCandidate()}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] text-xs font-semibold cursor-pointer transition"
              >
                Screen Candidate
              </button>
              <button
                onClick={() => onNavigate('hr')}
                className="px-3 py-1.5 rounded-md hover:bg-[#15181E] text-xs text-[#9CA3AF] hover:text-[#F4F4F5] font-medium transition cursor-pointer"
              >
                View Candidates →
              </button>
            </div>
          </div>

          {/* 4. Customer Support Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#FBBF24] uppercase tracking-wider">
                  Customer Support
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  Telemetry Diagnostic
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Diagnostic Reproduction &amp; Triage
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Reproduces HMAC byte mismatches, SLA pro-ration credits, latency spikes, and auth drifts inside sandbox. Auto-resolves code bugs or routes high-value fixes to human review.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => void onQuickTriageTopTicket()}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-md bg-[#FBBF24] hover:bg-[#FCD34D] disabled:opacity-50 text-[#0B0D10] text-xs font-semibold cursor-pointer transition"
              >
                Investigate Ticket
              </button>
              <button
                onClick={() => onNavigate('support')}
                className="px-3 py-1.5 rounded-md hover:bg-[#15181E] text-xs text-[#9CA3AF] hover:text-[#F4F4F5] font-medium transition cursor-pointer"
              >
                View Queue →
              </button>
            </div>
          </div>

          {/* 5. Procurement Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#34D399] uppercase tracking-wider">
                  Procurement &amp; Purchasing
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  Python MCDA Model
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Multi-Vendor RFP Optimization
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Runs Multi-Criteria Decision Analysis weighting pricing (45%), delivery SLA (25%), and vendor reliability to select winning bids and compute net cost savings.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => void onQuickEvaluateProcurement()}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] disabled:opacity-50 text-[#0B0D10] text-xs font-semibold cursor-pointer transition"
              >
                Evaluate RFP Bids
              </button>
              <button
                onClick={() => onNavigate('procurement')}
                className="px-3 py-1.5 rounded-md hover:bg-[#15181E] text-xs text-[#9CA3AF] hover:text-[#F4F4F5] font-medium transition cursor-pointer"
              >
                View Requisitions →
              </button>
            </div>
          </div>

          {/* Approvals Quick Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider">
                  Governance
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  Ed25519 Receipts
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Human-in-the-Loop Approvals
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Single pane of glass reviewing and authorizing high-impact decisions across all 5 departments, backed by tamper-evident cryptographic hash chains.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => onNavigate('approvals')}
                className="px-3.5 py-1.5 rounded-md bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-xs font-semibold text-[#F4F4F5] cursor-pointer transition"
              >
                Review Pending ({s?.pendingApprovalsCount ?? 0})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Containment & Cryptographic Verification Accordion */}
      <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 overflow-hidden">
        <button
          onClick={() => setContainmentExpanded(!containmentExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#15181E]/50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <div>
              <div className="text-xs font-semibold text-[#F4F4F5]">
                Vultr Cloud Sandbox Isolation &amp; Containment Guarantees
              </div>
              <div className="text-[11px] text-[#9CA3AF]">
                SSRF-guarded network policies, ephemerally provisioned workspaces, and hardware resource quotas.
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#9CA3AF] transition-transform ${
              containmentExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {containmentExpanded && (
          <div className="p-5 pt-0 border-t border-[#1E232B] text-xs text-[#9CA3AF] space-y-3">
            <p className="leading-relaxed">
              Every workflow executes inside a dedicated, isolated execution sandbox running on <strong>Vultr Cloud Infrastructure (vc2-2c-4gb, Ubuntu 24.04 LTS)</strong>. All actions produce verifiable Ed25519 signatures chained to a root authority, ensuring containment-first enterprise safety.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-[11px]">
              <div className="p-3 rounded bg-[#0D0F12] border border-[#1E232B]">
                <div className="text-[#38BDF8] font-bold">Network Guard</div>
                <div>SSRF + Cloud Metadata Block (169.254.169.254)</div>
              </div>
              <div className="p-3 rounded bg-[#0D0F12] border border-[#1E232B]">
                <div className="text-[#34D399] font-bold">Execution Tier</div>
                <div>vultr-docker-hardened / gVisor Runtime</div>
              </div>
              <div className="p-3 rounded bg-[#0D0F12] border border-[#1E232B]">
                <div className="text-[#FBBF24] font-bold">Auditability</div>
                <div>Ed25519-Signed Execution Receipt Chain</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
