import { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { ContainmentAuditReport } from '@aegis/shared';
import { runContainmentAudit } from '../api';

interface ContainmentAuditModalProps {
  open: boolean;
  onClose: () => void;
}

export function ContainmentAuditModal({ open, onClose }: ContainmentAuditModalProps) {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<ContainmentAuditReport | null>(null);
  const [error, setError] = useState<string>('');

  if (!open) return null;

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await runContainmentAudit();
      setReport(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#191919]/80 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[#2E2E2E] bg-[#1D1D1D] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#242424] border-b border-[#2E2E2E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#34D399]" />
            <div>
              <h3 className="text-sm font-semibold text-[#F2F2F2]">
                Red-Team Sandbox Containment Self-Test
              </h3>
              <p className="text-[11px] text-[#888888]">
                Dispatches 4 real escape vectors into a fresh Vultr sandbox to verify defense layers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2A2A2A] text-[#777777] hover:text-[#D0D0D0] cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md bg-[#242424] border border-[#2E2E2E] p-3.5">
            <div className="text-xs text-[#888888] leading-relaxed">
              Verifies <strong className="text-[#F2F2F2]">Host Key Leakage</strong>,{' '}
              <strong className="text-[#F2F2F2]">169.254.169.254 SSRF</strong>,{' '}
              <strong className="text-[#F2F2F2]">Filesystem Traversal</strong>, and{' '}
              <strong className="text-[#F2F2F2]">CPU Watchdog Guards</strong>.
            </div>
            <button
              onClick={handleRun}
              disabled={running}
              className="px-4 py-2 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] disabled:opacity-40 text-[#191919] font-semibold text-xs flex items-center gap-2 shrink-0 cursor-pointer transition"
            >
              {running ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Probing Sandbox...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute 4 Live Probes</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-[#F87171]/10 border border-[#F87171]/25 p-3 text-xs text-[#F87171] font-mono">
              {error}
            </div>
          )}

          {report && (
            <div className="space-y-3">
              <div
                className={`rounded-md p-3 border flex items-center justify-between ${
                  report.allContained
                    ? 'bg-[#34D399]/10 border-[#34D399]/25 text-[#34D399]'
                    : 'bg-[#F87171]/10 border-[#F87171]/25 text-[#F87171]'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                  <span>
                    {report.allContained
                      ? 'ALL 4 ADVERSARIAL ESCAPE VECTORS CONTAINED'
                      : 'WARNING: CONTAINMENT REGRESSION DETECTED'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#888888]">
                  {report.isolationTier} | Ed25519 Chain: {report.chainVerified ? 'VALID' : 'FAIL'}
                </span>
              </div>

              <div className="space-y-2">
                {report.probes.map((probe) => (
                  <div
                    key={probe.id}
                    className="rounded-md border border-[#2E2E2E] bg-[#242424] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {probe.contained ? (
                          <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#F87171] shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-[#F2F2F2]">{probe.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          probe.contained
                            ? 'bg-[#34D399]/12 text-[#34D399]'
                            : 'bg-[#F87171]/12 text-[#F87171]'
                        }`}
                      >
                        {probe.contained ? 'CONTAINED' : 'EXPOSED'} · {probe.durationMs}ms
                      </span>
                    </div>
                    <p className="text-[11px] text-[#888888]">{probe.attackDescription}</p>
                    <div className="text-[11px] font-mono text-[#38BDF8]">
                      Defense: {probe.enforcedBy}
                    </div>
                    <div className="rounded bg-[#191919] border border-[#2E2E2E] px-2.5 py-1.5 text-[11px] font-mono text-[#888888] break-words">
                      {probe.evidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
