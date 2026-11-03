import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Fingerprint,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { ApprovalItem } from '@aegis/shared';

interface ApprovalsViewProps {
  approvals: ApprovalItem[];
  onDecide: (id: string, decision: 'approved' | 'rejected') => Promise<void>;
  onInspectMission: (missionId: string) => void;
}

export function ApprovalsView({
  approvals,
  onDecide,
  onInspectMission,
}: ApprovalsViewProps) {
  const pending = approvals.filter((a) => a.status === 'pending');
  const history = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-400" />
          Human-in-the-Loop Escalation &amp; Approval Inbox
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Agents prepare verifiable findings inside the Vultr sandbox, but outbound customer/vendor
          communications, treasury holds, and SLA credits wait for explicit human sign-off.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-[#090e1a]/60 p-8 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="text-sm font-semibold text-white">Approval Queue Clear</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Run a Sales Lead Qualification, AP Ledger Reconciliation, or P1 Support Investigation
            to see escalated recommendations attested by Ed25519 sandbox receipts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-amber-500/35 bg-[#0b1120] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                      {item.department}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                        item.riskLevel === 'critical' || item.riskLevel === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                      }`}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      {item.riskLevel} risk
                    </span>
                    <span className="text-sm font-bold text-white">{item.title}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{item.subtitle}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onInspectMission(item.missionId)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    title="Inspect Ed25519 Signed Sandbox Execution Chain"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Receipt {item.receiptHeadHash.slice(0, 10)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => void onDecide(item.id, 'rejected')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => void onDecide(item.id, 'approved')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Execute</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-sky-300">
                <strong className="text-slate-300">Proposed Action:</strong>{' '}
                {item.recommendedAction}
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#060911] p-3">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                  Prepared Outbound Communication / Action Memo
                </div>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {item.draftCommunication}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Completed Human Sign-Off Audit Log
          </div>
          {history.map((h) => (
            <div
              key={h.id}
              className="rounded-lg border border-slate-800 bg-[#090e1a] px-4 py-2.5 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                    h.status === 'approved'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {h.status}
                </span>
                <span className="text-slate-200 font-medium truncate">{h.title}</span>
              </div>
              <button
                onClick={() => onInspectMission(h.missionId)}
                className="text-[11px] font-mono text-sky-400 hover:underline shrink-0 cursor-pointer"
              >
                Proof ({h.missionId}) →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
