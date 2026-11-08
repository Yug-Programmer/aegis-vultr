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
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="pb-4 border-b border-[#2E2E2E]">
        <h1 className="text-[18px] font-semibold text-[#F2F2F2] tracking-tight">
          Approvals
        </h1>
        <p className="text-xs text-[#888888] mt-1">
          Review and authorize sensitive autonomous operations.
        </p>
      </div>

      {/* Pending Queue */}
      {pending.length === 0 ? (
        <div className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] p-8 text-center space-y-2">
          <CheckCircle2 className="w-6 h-6 text-[#34D399] mx-auto" />
          <div className="text-sm font-medium text-[#D0D0D0]">All Clear</div>
          <p className="text-xs text-[#888888] max-w-sm mx-auto leading-relaxed">
            No pending approvals. Recommendations requiring human authorization will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((item) => {
            const isHighRisk = item.riskLevel === 'critical' || item.riskLevel === 'high';
            return (
              <div
                key={item.id}
                className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] p-5 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#242424] text-[#777777] border border-[#333333]">
                        {item.department}
                      </span>
                      <span
                        className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                          isHighRisk
                            ? 'bg-[#F87171]/12 text-[#F87171] border border-[#F87171]/20'
                            : 'bg-[#FBBF24]/12 text-[#FBBF24] border border-[#FBBF24]/20'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>{item.riskLevel} risk</span>
                      </span>
                      <h3 className="text-sm font-semibold text-[#F2F2F2]">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-xs text-[#777777] font-mono">
                      {item.subtitle}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      onClick={() => onInspectMission(item.missionId)}
                      className="px-2.5 py-1.5 rounded-md bg-[#242424] hover:bg-[#2A2A2A] border border-[#333333] text-[#777777] hover:text-[#D0D0D0] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
                      title="Inspect Ed25519 Signed Sandbox Execution Chain"
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Receipt {item.receiptHeadHash.slice(0, 8)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => void onDecide(item.id, 'rejected')}
                      className="px-3 py-1.5 rounded-md bg-[#242424] hover:bg-[#F87171]/8 border border-[#333333] hover:border-[#F87171]/30 text-[#777777] hover:text-[#F87171] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => void onDecide(item.id, 'approved')}
                      className="px-3.5 py-1.5 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] text-[#191919] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve &amp; Execute</span>
                    </button>
                  </div>
                </div>

                {/* Proposed Action */}
                <div className="text-xs text-[#888888] border-t border-[#2E2E2E] pt-3">
                  <span className="font-medium text-[#D0D0D0]">Proposed Action: </span>
                  <span>{item.recommendedAction}</span>
                </div>

                {/* Prepared Memo / Outbound Preview */}
                <div className="rounded-md border border-[#2E2E2E] bg-[#191919] p-4 space-y-1.5">
                  <div className="text-[11px] font-mono text-[#555555]">
                    Prepared Outbound Communication / Action Memo
                  </div>
                  <div className="text-xs text-[#888888] whitespace-pre-wrap leading-relaxed font-sans">
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
        <div className="space-y-3 pt-4 border-t border-[#2E2E2E]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
            Completed Human Sign-Off Audit Log
          </div>
          <div className="rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] divide-y divide-[#2A2A2A] overflow-hidden">
            {history.map((h) => (
              <div
                key={h.id}
                className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium ${
                      h.status === 'approved'
                        ? 'bg-[#34D399]/12 text-[#34D399]'
                        : 'bg-[#F87171]/12 text-[#F87171]'
                    }`}
                  >
                    {h.status}
                  </span>
                  <span className="text-[#D0D0D0] font-medium truncate">{h.title}</span>
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
