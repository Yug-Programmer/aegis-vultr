import { useState } from 'react';
import {
  LifeBuoy,
  Play,
  Plus,
  Loader2,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
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
    <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-7xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-purple-400" />
            Customer Support — Sandboxed Root-Cause Investigation &amp; Escalation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Isolates customer webhook payloads, billing logs, and SAML assertions inside a Vultr
            sandbox—auto-resolving deterministic issues and escalating policy/credit actions.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-purple-500/35 bg-[#120d21] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
        >
          <input
            required
            placeholder="Enterprise Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
          />
          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value as 'API & Webhooks' | 'Billing & Ledger' | 'SSO & Security'
              )
            }
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
          >
            <option value="API & Webhooks">API &amp; Webhooks</option>
            <option value="Billing & Ledger">Billing &amp; Ledger</option>
            <option value="SSO & Security">SSO &amp; Security</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'P1' | 'P2' | 'P3')}
              className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
            >
              <option value="P1">P1 Critical</option>
              <option value="P2">P2 High</option>
              <option value="P3">P3 Normal</option>
            </select>
            <select
              value={customerTier}
              onChange={(e) => setCustomerTier(e.target.value as 'Enterprise' | 'Growth')}
              className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
            >
              <option value="Enterprise">Enterprise</option>
              <option value="Growth">Growth</option>
            </select>
          </div>
          <input
            required
            placeholder="Issue Subject / Symptoms"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="sm:col-span-2 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Requested Credit $"
              value={requestedCreditUsd}
              onChange={(e) => setRequestedCreditUsd(Number(e.target.value))}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-slate-100"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold shrink-0 cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-slate-800 bg-[#090e1a] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-purple-300">
                    {t.ticketNumber}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      t.priority === 'P1'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {t.priority}
                  </span>
                  <span className="text-sm font-semibold text-white">{t.subject}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <span>{t.customerName}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px]">{t.customerTier}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-sky-400">{t.category}</span>
                  {t.requestedCreditUsd ? (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-amber-300">
                        Requested Credit: ${t.requestedCreditUsd.toLocaleString()}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-1 rounded border flex items-center gap-1 ${
                    t.status === 'auto_resolved' || t.status === 'resolved'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                      : t.status === 'escalated_human'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {(t.status === 'auto_resolved' || t.status === 'resolved') && (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  {t.status === 'escalated_human' && <AlertOctagon className="w-3 h-3" />}
                  {t.status.replace('_', ' ')}
                </span>

                {t.lastMissionId && (
                  <button
                    onClick={() => onInspectMission(t.lastMissionId!)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                    <span>Diagnostic SVG</span>
                  </button>
                )}

                <button
                  onClick={() => void onInvestigateTicket(t.id)}
                  disabled={isBusy || t.status === 'investigating'}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
                >
                  {t.status === 'investigating' ? (
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

            {t.rootCauseSummary ? (
              <div className="rounded-lg border border-slate-800 bg-[#060911] p-3 space-y-1.5 text-xs">
                <div className="text-sky-300 font-mono text-[11px]">
                  Verified Root Cause: <span className="text-slate-200">{t.rootCauseSummary}</span>
                </div>
                <div className="text-emerald-300 font-mono text-[11px]">
                  Action Plan: <span className="text-slate-300">{t.proposedResolution}</span>
                </div>
              </div>
            ) : (
              <details className="text-[11px] font-mono text-slate-500">
                <summary className="cursor-pointer hover:text-slate-300">
                  Inspect Untrusted Customer Telemetry Payload (Isolated on Execution)
                </summary>
                <pre className="mt-1.5 p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-400 overflow-x-auto">
                  {JSON.stringify(t.diagnosticPayload, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
