import { useState } from 'react';
import {
  Play,
  Plus,
  Loader2,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  ChevronDown,
  X,
} from 'lucide-react';
import type { SupportTicket } from '@aegis/shared';

interface SupportOpsViewProps {
  tickets: SupportTicket[];
  isBusy: boolean;
  onAddTicket: (payload: {
    customerName: string;
    customerTier: 'Enterprise' | 'Growth';
    subject: string;
    category: 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security';
    priority: 'P1' | 'P2' | 'P3';
    requestedCreditUsd?: number;
  }) => Promise<void>;
  onInvestigateTicket: (ticketId: string) => Promise<void>;
  onInspectMission: (missionId: string) => void;
}

export function SupportOpsView({
  tickets,
  isBusy,
  onAddTicket,
  onInvestigateTicket,
  onInspectMission,
}: SupportOpsViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerTier, setCustomerTier] = useState<'Enterprise' | 'Growth'>('Enterprise');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security'>(
    'API & Webhooks'
  );
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3'>('P1');
  const [requestedCreditUsd, setRequestedCreditUsd] = useState(0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !subject.trim()) return;
    await onAddTicket({
      customerName,
      customerTier,
      subject,
      category,
      priority,
      requestedCreditUsd: requestedCreditUsd || undefined,
    });
    setCustomerName('');
    setSubject('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h1 className="text-[18px] font-semibold text-[#F2F2F2] tracking-tight">
            Customer Support
          </h1>
          <p className="text-xs text-[#888888] mt-1">
            Sandboxed root-cause investigation, ticket reproduction, and escalation.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#191919] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition self-start sm:self-auto"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showAdd ? 'Cancel' : 'New Support Ticket'}</span>
        </button>
      </div>

      {/* Add Ticket Form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] p-5 space-y-4"
        >
          <div className="text-xs font-semibold text-[#D0D0D0]">
            Create Support Incident Ticket
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#777777] mb-1">Customer Name</label>
              <input
                required
                placeholder="Enterprise Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-md bg-[#191919] border border-[#2E2E2E] focus:border-[#38BDF8] px-3 py-2 text-[#F2F2F2] outline-none placeholder:text-[#555555]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#777777] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security'
                  )
                }
                className="w-full rounded-md bg-[#191919] border border-[#2E2E2E] focus:border-[#38BDF8] px-3 py-2 text-[#F2F2F2] outline-none"
              >
                <option value="API & Webhooks">API &amp; Webhooks</option>
                <option value="Billing & Ledger">Billing &amp; Ledger</option>
                <option value="SSO & Security">SSO &amp; Security</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#777777] mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'P1' | 'P2' | 'P3')}
                  className="w-full rounded-md bg-[#191919] border border-[#2E2E2E] focus:border-[#38BDF8] px-3 py-2 text-[#F2F2F2] outline-none"
                >
                  <option value="P1">P1 Critical</option>
                  <option value="P2">P2 High</option>
                  <option value="P3">P3 Normal</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#777777] mb-1">Tier</label>
                <select
                  value={customerTier}
                  onChange={(e) => setCustomerTier(e.target.value as 'Enterprise' | 'Growth')}
                  className="w-full rounded-md bg-[#191919] border border-[#2E2E2E] focus:border-[#38BDF8] px-3 py-2 text-[#F2F2F2] outline-none"
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="Growth">Growth</option>
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-[#777777] mb-1">Issue Subject / Symptoms</label>
              <input
                required
                placeholder="Issue Subject / Symptoms"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md bg-[#191919] border border-[#2E2E2E] focus:border-[#38BDF8] px-3 py-2 text-[#F2F2F2] outline-none placeholder:text-[#555555]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#777777] mb-1">Requested Credit ($)</label>
              <input
                type="number"
                placeholder="0"
                value={requestedCreditUsd}
                onChange={(e) => setRequestedCreditUsd(Number(e.target.value))}
                className="w-full rounded-md bg-[#191919] border border-[#2E2E2E] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F2F2F2] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#191919] font-semibold text-xs cursor-pointer transition"
            >
              Create Incident Ticket
            </button>
          </div>
        </form>
      )}

      {/* Ticket List */}
      <div className="space-y-3">
        {tickets.map((t) => {
          const isP1 = t.priority === 'P1';
          const isInvestigating = t.status === 'investigating';
          const isResolved = t.status === 'auto_resolved' || t.status === 'resolved';
          const isEscalated = t.status === 'escalated_human';

          return (
            <div
              key={t.id}
              className={`rounded-lg border bg-[#1D1D1D] p-5 space-y-4 transition ${isP1
                  ? 'border-[#2E2E2E] border-l-2 border-l-[#F87171]'
                  : 'border-[#2E2E2E]'
                }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left Section */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-[#777777]">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${isP1
                          ? 'bg-[#F87171]/12 text-[#F87171]'
                          : 'bg-[#FBBF24]/12 text-[#FBBF24]'
                        }`}
                    >
                      {t.priority}
                    </span>
                    <h3 className="text-sm font-semibold text-[#F2F2F2] truncate">
                      {t.subject}
                    </h3>
                  </div>

                  <div className="text-xs text-[#888888] flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#D0D0D0]">{t.customerName}</span>
                    <span className="text-[#444444]">·</span>
                    <span className="text-[#555555]">{t.customerTier}</span>
                    <span className="text-[#444444]">·</span>
                    <span className="font-mono text-[11px] text-[#38BDF8]">{t.category}</span>
                    {t.requestedCreditUsd ? (
                      <>
                        <span className="text-[#444444]">·</span>
                        <span className="font-mono text-[11px] text-[#FBBF24]">
                          Credit Request: ${t.requestedCreditUsd.toLocaleString()}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <span
                    className={`text-[11px] font-mono capitalize px-2 py-1 rounded flex items-center gap-1.5 ${isResolved
                        ? 'bg-[#34D399]/12 text-[#34D399] border border-[#34D399]/25'
                        : isEscalated
                          ? 'bg-[#FBBF24]/12 text-[#FBBF24] border border-[#FBBF24]/25'
                          : 'bg-[#242424] text-[#777777] border border-[#333333]'
                      }`}
                  >
                    {isResolved && <CheckCircle2 className="w-3 h-3 text-[#34D399]" />}
                    {isEscalated && <AlertOctagon className="w-3 h-3 text-[#FBBF24]" />}
                    <span>{t.status.replace('_', ' ')}</span>
                  </span>

                  {t.lastMissionId && (
                    <button
                      onClick={() => onInspectMission(t.lastMissionId!)}
                      className="px-3 py-1.5 rounded-md bg-[#242424] hover:bg-[#2A2A2A] border border-[#333333] text-[#888888] hover:text-[#D0D0D0] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
                      title="Inspect Diagnostic Findings"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Diagnostics</span>
                    </button>
                  )}

                  <button
                    onClick={() => void onInvestigateTicket(t.id)}
                    disabled={isBusy || isInvestigating}
                    className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-40 text-[#191919] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    {isInvestigating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Diagnosing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Investigate in Sandbox</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Root Cause / Technical Telemetry */}
              {t.rootCauseSummary ? (
                <div className="rounded-md border border-[#2E2E2E] bg-[#191919] p-3.5 space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-[#D0D0D0]">Root Cause: </span>
                    <span className="text-[#888888]">{t.rootCauseSummary}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#34D399]">Resolution Plan: </span>
                    <span className="text-[#888888]">{t.proposedResolution}</span>
                  </div>
                </div>
              ) : (
                <details className="text-[11px] font-mono text-[#555555] group">
                  <summary className="cursor-pointer hover:text-[#888888] flex items-center gap-1">
                    <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                    <span>Inspect Untrusted Customer Telemetry Payload (Isolated on Execution)</span>
                  </summary>
                  <pre className="mt-2 p-3 rounded bg-[#191919] border border-[#2E2E2E] text-[#888888] overflow-x-auto text-[10px] leading-relaxed">
                    {JSON.stringify(t.diagnosticPayload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
