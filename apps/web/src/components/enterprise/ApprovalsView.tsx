import {
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
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="pb-2 border-b border-[#242830]">
        <h1 className="text-2xl font-semibold text-[#F4F4F5] tracking-tight">
          Approvals
        </h1>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Review and authorize sensitive autonomous operations.
        </p>
      </div>

      {/* Pending Queue */}
      {pending.length === 0 ? (
        <div className="rounded-lg border border-[#242830] bg-[#111419] p-8 text-center space-y-2">
          <CheckCircle2 className="w-6 h-6 text-[#34D399] mx-auto" />
          <div className="text-sm font-medium text-[#F4F4F5]">All Clear</div>
          <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
            No pending approvals. Recommendations requiring human authorization will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => {
            const isHighRisk = item.riskLevel === 'critical' || item.riskLevel === 'high';
            return (
              <div
                key={item.id}
                className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#15181E] text-[#9CA3AF] border border-[#242830]">
                        {item.department}
                      </span>
                      <span
                        className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                          isHighRisk
                            ? 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/25'
                            : 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/25'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>{item.riskLevel} risk</span>
                      </span>
                      <h3 className="text-base font-semibold text-[#F4F4F5]">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-xs text-[#9CA3AF] font-mono">
                      {item.subtitle}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => onInspectMission(item.missionId)}
                      className="px-2.5 py-1.5 rounded-md bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
                      title="Inspect Ed25519 Signed Sandbox Execution Chain"
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Receipt {item.receiptHeadHash.slice(0, 8)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => void onDecide(item.id, 'rejected')}
                      className="px-3 py-1.5 rounded-md bg-[#15181E] hover:bg-[#F87171]/10 border border-[#242830] hover:border-[#F87171]/40 text-[#9CA3AF] hover:text-[#F87171] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => void onDecide(item.id, 'approved')}
                      className="px-3.5 py-1.5 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] text-[#0B0D10] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve &amp; Execute</span>
                    </button>
                  </div>
                </div>

                {/* Proposed Action */}
                <div className="text-xs text-[#9CA3AF] border-t border-[#242830] pt-3">
                  <span className="font-medium text-[#F4F4F5]">Proposed Action: </span>
                  <span>{item.recommendedAction}</span>
                </div>

                {/* Prepared Memo / Outbound Preview */}
                <div className="rounded-md border border-[#242830] bg-[#0D0F12] p-4 space-y-1.5">
                  <div className="text-[11px] font-mono text-[#6B7280]">
                    Prepared Outbound Communication / Action Memo
                  </div>
                  <div className="text-xs text-[#9CA3AF] whitespace-pre-wrap leading-relaxed font-sans">
                    {item.draftCommunication}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Log */}
      {history.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[#242830]">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Completed Human Sign-Off Audit Log
          </div>
          <div className="rounded-lg border border-[#242830] bg-[#111419] divide-y divide-[#242830] overflow-hidden">
            {history.map((h) => (
              <div
                key={h.id}
                className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium ${
                      h.status === 'approved'
                        ? 'bg-[#34D399]/15 text-[#34D399]'
                        : 'bg-[#F87171]/15 text-[#F87171]'
                    }`}
                  >
                    {h.status}
                  </span>
                  <span className="text-[#F4F4F5] font-medium truncate">{h.title}</span>
                </div>
                <button
                  onClick={() => onInspectMission(h.missionId)}
                  className="text-[11px] font-mono text-[#38BDF8] hover:underline shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span>Proof ({h.missionId.slice(0, 10)})</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
