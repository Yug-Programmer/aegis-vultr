import { useState } from 'react';
import {
  Play,
  Plus,
  Loader2,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  Trash2,
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
    category: 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security' | 'Performance & Scale' | 'General Operations';
    priority: 'P1' | 'P2' | 'P3';
    requestedCreditUsd?: number;
    diagnosticPayload?: Record<string, unknown>;
  }) => Promise<void>;
  onDeleteTicket: (ticketId: string) => Promise<void>;
  onInvestigateTicket: (ticketId: string) => Promise<void>;
  onInspectMission: (missionId: string) => void;
}

export function SupportOpsView({
  tickets,
  isBusy,
  onAddTicket,
  onDeleteTicket,
  onInvestigateTicket,
  onInspectMission,
}: SupportOpsViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerTier, setCustomerTier] = useState<'Enterprise' | 'Growth'>('Enterprise');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<
    'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security' | 'Performance & Scale' | 'General Operations'
  >('API & Webhooks');
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3'>('P1');
  const [requestedCreditUsd, setRequestedCreditUsd] = useState(0);
  const [diagnosticTelemetry, setDiagnosticTelemetry] = useState('');

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
      diagnosticPayload: {
        issueType: 'custom_diagnostic',
        submittedSubject: subject.trim(),
        requestedCreditUsd,
        rawLogs:
          diagnosticTelemetry.trim() ||
          `Customer ${customerName} reported: "${subject}" at ${new Date().toISOString()}`,
      },
    });
    setCustomerName('');
    setSubject('');
    setDiagnosticTelemetry('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242830]">
        <div>
          <h1 className="text-2xl font-semibold text-[#F4F4F5] tracking-tight">
            Customer Support
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Sandboxed root-cause investigation, telemetry reproduction, auto-resolution, and escalation to human review.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm self-start sm:self-auto"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showAdd ? 'Cancel' : 'New Support Ticket'}</span>
        </button>
      </div>

      {/* Add Ticket Form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
        >
          <div className="text-xs font-semibold text-[#F4F4F5]">
            Create Support Incident Ticket
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Customer Name</label>
              <input
                required
                placeholder="Enterprise Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Customer Tier</label>
              <select
                value={customerTier}
                onChange={(e) => setCustomerTier(e.target.value as 'Enterprise' | 'Growth')}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none cursor-pointer"
              >
                <option value="Enterprise">Enterprise (24/7 SLA)</option>
                <option value="Growth">Growth</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'P1' | 'P2' | 'P3')}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none cursor-pointer"
              >
                <option value="P1">P1 - Critical Outage / Data Mismatch</option>
                <option value="P2">P2 - Degraded Performance / Billing</option>
                <option value="P3">P3 - General Inquiry</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Incident Category</label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as
                      | 'API & Webhooks'
                      | 'Billing & Ledger'
                      | 'SSO & Security'
                      | 'Performance & Scale'
                      | 'General Operations'
                  )
                }
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none cursor-pointer"
              >
                <option value="API & Webhooks">API &amp; Webhooks</option>
                <option value="Billing & Ledger">Billing &amp; Ledger</option>
                <option value="SSO & Security">SSO &amp; Security</option>
                <option value="Performance & Scale">Performance &amp; Scale</option>
                <option value="General Operations">General Operations</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Requested SLA Credit ($)</label>
              <input
                type="number"
                placeholder="0"
                value={requestedCreditUsd}
                onChange={(e) => setRequestedCreditUsd(Number(e.target.value))}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Incident Subject / Summary</label>
              <input
                required
                placeholder="e.g. 504 Gateway Timeout on /v1/batch-inference endpoint during traffic surge"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] text-[#9CA3AF] mb-1">
                Diagnostic Telemetry / Error Logs / Context (Optional)
              </label>
              <textarea
                rows={2}
                value={diagnosticTelemetry}
                onChange={(e) => setDiagnosticTelemetry(e.target.value)}
                placeholder="Paste stack traces, raw error headers, or diagnostic payloads here for the sandbox Python engine to analyze..."
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] font-mono text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] font-semibold text-xs cursor-pointer transition"
            >
              Submit Ticket to Queue
            </button>
          </div>
        </form>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="rounded-lg border border-[#242830] bg-[#111419] p-8 text-center text-[#9CA3AF] text-xs">
            No support tickets in queue. Click &ldquo;New Support Ticket&rdquo; to submit an incident, or reset sample data.
          </div>
        ) : (
          tickets.map((t) => {
            const isInvestigating = t.status === 'investigating';
            const isEscalated = t.status === 'escalated_human';
            const isAutoResolved = t.status === 'auto_resolved';

            return (
              <div
                key={t.id}
                className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-semibold text-[#F4F4F5]">
                        {t.ticketNumber}
                      </span>
                      <span className="text-xs font-medium text-[#9CA3AF]">
                        {t.customerName}
                      </span>

                      {t.isUserCreated && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                          Custom Record
                        </span>
                      )}

                      {/* Priority Tag */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          t.priority === 'P1'
                            ? 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30'
                            : t.priority === 'P2'
                              ? 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30'
                              : 'bg-[#15181E] text-[#9CA3AF] border border-[#242830]'
                        }`}
                      >
                        {t.priority}
                      </span>

                      {/* Status */}
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#15181E] border border-[#242830] text-[#9CA3AF]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAutoResolved
                              ? 'bg-[#34D399]'
                              : isEscalated
                                ? 'bg-[#FBBF24]'
                                : isInvestigating
                                  ? 'bg-[#38BDF8]'
                                  : 'bg-[#6B7280]'
                          }`}
                        />
                        <span className="capitalize">{t.status.replace('_', ' ')}</span>
                      </span>
                    </div>

                    <div className="text-xs text-[#9CA3AF] flex items-center gap-2 flex-wrap">
                      <span className="text-[#F4F4F5] font-medium">{t.subject}</span>
                      <span className="text-[#6B7280]">·</span>
                      <span>{t.category}</span>
                      <span className="text-[#6B7280]">·</span>
                      <span>Tier: {t.customerTier}</span>
                      {t.requestedCreditUsd && (
                        <>
                          <span className="text-[#6B7280]">·</span>
                          <span className="font-mono text-[#FBBF24]">
                            Credit Requested: ${t.requestedCreditUsd.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    {t.lastMissionId && (
                      <button
                        onClick={() => onInspectMission(t.lastMissionId!)}
                        className="px-3 py-1.5 rounded-md bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
                        title="Inspect Ed25519 Sandbox Execution Proof"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Sandbox Proof</span>
                      </button>
                    )}

                    <button
                      onClick={() => void onInvestigateTicket(t.id)}
                      disabled={isBusy || isInvestigating}
                      className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      {isInvestigating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Diagnosing in Sandbox...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {t.rootCauseSummary ? 'Re-Run Diagnostic' : 'Investigate in Sandbox'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => void onDeleteTicket(t.id)}
                      className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F87171] hover:bg-[#242830] transition cursor-pointer"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Findings */}
                {t.rootCauseSummary && (
                  <div className="rounded-lg border border-[#242830] bg-[#0D0F12] p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      {isEscalated ? (
                        <AlertOctagon className="w-3.5 h-3.5 text-[#FBBF24]" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                      )}
                      <span
                        className={`font-medium ${
                          isEscalated ? 'text-[#FBBF24]' : 'text-[#34D399]'
                        }`}
                      >
                        {isEscalated
                          ? 'Escalated to Human Authorization (High Financial/Security Impact)'
                          : 'Autonomously Resolved in Isolated Sandbox'}
                      </span>
                    </div>

                    <div className="text-[#9CA3AF] leading-relaxed">
                      <span className="font-semibold text-[#F4F4F5] mr-1.5">Root Cause:</span>
                      {t.rootCauseSummary}
                    </div>

                    {t.proposedResolution && (
                      <div className="text-[#9CA3AF] leading-relaxed pt-1 border-t border-[#1E232B]">
                        <span className="font-semibold text-[#38BDF8] mr-1.5">Action Plan:</span>
                        {t.proposedResolution}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
