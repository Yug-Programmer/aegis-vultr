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
  const [menuOpen, setMenuOpen] = useState(false);
  const [containmentExpanded, setContainmentExpanded] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Header (Minimal, Typography-Driven, Linear/Vercel style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E232B]">
        <div>
          <h1 className="text-xl font-semibold text-[#F4F4F5] tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Monitor business operations, autonomous workflows, and security activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Subtle Demo Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F4F4F5] hover:bg-[#15181E] text-xs font-medium transition cursor-pointer flex items-center"
              title="Demo & Environment Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-md bg-[#15181E] border border-[#242830] shadow-xl py-1 z-30">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void onResetDemo();
                  }}
                  disabled={isBusy}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#9CA3AF] hover:text-[#F4F4F5] hover:bg-[#111419] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('studio')}
            className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Pipeline ARR */}
        <div
          onClick={() => onNavigate('sales')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#38BDF8]/40 p-5 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
            Sales Pipeline ARR
          </div>
          <div className="my-2 text-2xl font-semibold tracking-tight text-[#F4F4F5]">
            ${(s?.pipelineArrUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
            <span>{s?.qualifiedLeadsCount ?? 0} of {s?.totalLeadsCount ?? 0} qualified</span>
          </div>
        </div>

        {/* Prevented AP Leakage */}
        <div
          onClick={() => onNavigate('finance')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#34D399]/40 p-5 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
            Prevented AP Leakage
          </div>
          <div className="my-2 text-2xl font-semibold tracking-tight text-[#34D399]">
            ${(s?.preventedLeakageUsd ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
            <span>{s?.reconciledInvoicesCount ?? 0} reconciled</span>
            <span className="text-[#6B7280]">·</span>
            <span className={s?.flaggedAnomaliesCount ? 'text-[#F87171]' : 'text-[#9CA3AF]'}>
              {s?.flaggedAnomaliesCount ?? 0} anomalies
            </span>
          </div>
        </div>

        {/* Support & Incident Queue */}
        <div
          onClick={() => onNavigate('support')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#38BDF8]/40 p-5 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
            Support Queue
          </div>
          <div className="my-2 text-2xl font-semibold tracking-tight text-[#F4F4F5]">
            {s?.openTicketsCount ?? 0}
            <span className="text-xs font-normal text-[#9CA3AF] ml-1.5">Open</span>
          </div>
          <div className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
            <span>{s?.autoResolvedTicketsCount ?? 0} resolved</span>
            <span className="text-[#6B7280]">·</span>
            <span className={s?.escalatedTicketsCount ? 'text-[#FBBF24]' : 'text-[#9CA3AF]'}>
              {s?.escalatedTicketsCount ?? 0} escalated
            </span>
          </div>
        </div>

        {/* Human Approval Inbox */}
        <div
          onClick={() => onNavigate('approvals')}
          className="rounded-lg border border-[#1E232B] bg-[#111419]/50 hover:bg-[#111419] hover:border-[#FBBF24]/40 p-5 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
            Approval Inbox
          </div>
          <div className="my-2 text-2xl font-semibold tracking-tight text-[#FBBF24]">
            {s?.pendingApprovalsCount ?? 0}
            <span className="text-xs font-normal text-[#9CA3AF] ml-1.5">Pending</span>
          </div>
          <div className="text-xs text-[#9CA3AF]">
            Cryptographically signed
          </div>
        </div>
      </div>

      {/* Operational Workflows Section */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Autonomous Operations
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sales Operations Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider">
                  Sales Ops
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  Chromium + Python
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Prospect Research &amp; Qualification
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Visits prospect domains inside an isolated Chromium sandbox, evaluates product signals,
                computes deterministic ICP fit scores, and prepares personalized outreach for approval.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => void onQuickQualifyTopLead()}
                disabled={isBusy}
                className="flex-1 py-1.5 px-3 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs cursor-pointer transition text-center"
              >
                Qualify Next Lead
              </button>
              <button
                onClick={() => onNavigate('sales')}
                className="py-1.5 px-2.5 rounded-md hover:bg-[#15181E] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Finance & Accounting Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#34D399] uppercase tracking-wider">
                  Finance &amp; AP
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  3-Way Match
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                AP Invoice Reconciliation &amp; Fraud Audit
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Matches invoices and POs in an isolated Python workspace to identify duplicate submissions,
                unauthorized overbilling, and vendor IBAN tampering before disbursement.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => void onQuickReconcileFinance()}
                disabled={isBusy}
                className="flex-1 py-1.5 px-3 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs cursor-pointer transition text-center"
              >
                Run AP Audit
              </button>
              <button
                onClick={() => onNavigate('finance')}
                className="py-1.5 px-2.5 rounded-md hover:bg-[#15181E] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Customer Support Card */}
          <div className="rounded-lg border border-[#1E232B] bg-[#111419]/50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider">
                  Support
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  Sandboxed Triage
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Ticket Reproduction &amp; Diagnostics
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Isolates untrusted customer webhook payloads, billing logs, and SAML assertions inside
                the sandbox to reproduce errors safely, resolving tickets and routing policy escalations.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1E232B]">
              <button
                onClick={() => void onQuickTriageTopTicket()}
                disabled={isBusy}
                className="flex-1 py-1.5 px-3 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs cursor-pointer transition text-center"
              >
                Triage Next Ticket
              </button>
              <button
                onClick={() => onNavigate('support')}
                className="py-1.5 px-2.5 rounded-md hover:bg-[#15181E] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Containment Architecture Information */}
      <div className="rounded-lg border border-[#1E232B] bg-[#111419]/30 overflow-hidden">
        <button
          onClick={() => setContainmentExpanded(!containmentExpanded)}
          className="w-full p-3.5 flex items-center justify-between text-xs text-[#9CA3AF] hover:text-[#F4F4F5] cursor-pointer transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#34D399] shrink-0" />
            <span className="font-medium text-[#F4F4F5]">
              Containment-First Architecture
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6B7280] hidden sm:inline">
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
          <div className="px-3.5 pb-3.5 pt-1 text-xs text-[#9CA3AF] border-t border-[#1E232B] space-y-2 leading-relaxed">
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
