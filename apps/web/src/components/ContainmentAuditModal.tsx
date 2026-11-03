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
    <div className="fixed inset-0 z-50 bg-[#0B0D10]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[#242830] bg-[#111419] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#0D0F12] border-b border-[#242830] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#34D399]" />
            <div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Red-Team Sandbox Containment Self-Test
              </h3>
              <p className="text-[11px] text-[#9CA3AF]">
                Dispatches 4 real escape vectors into a fresh Vultr sandbox to verify defense layers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#15181E] text-[#9CA3AF] hover:text-[#F4F4F5] cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md bg-[#0D0F12] border border-[#242830] p-3.5">
            <div className="text-xs text-[#9CA3AF] leading-relaxed">
              Verifies <strong className="text-[#F4F4F5]">Host Key Leakage</strong>,{' '}
              <strong className="text-[#F4F4F5]">169.254.169.254 SSRF</strong>,{' '}
              <strong className="text-[#F4F4F5]">Filesystem Traversal</strong>, and{' '}
              <strong className="text-[#F4F4F5]">CPU Watchdog Guards</strong>.
            </div>
            <button
              onClick={handleRun}
              disabled={running}
              className="px-4 py-2 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs flex items-center gap-2 shrink-0 cursor-pointer transition shadow-sm"
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
            <div className="rounded-md bg-[#F87171]/10 border border-[#F87171]/30 p-3 text-xs text-[#F87171] font-mono">
              {error}
            </div>
          )}

          {report && (
            <div className="space-y-3">
              <div
                className={`rounded-md p-3 border flex items-center justify-between ${
                  report.allContained
                    ? 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]'
                    : 'bg-[#F87171]/10 border-[#F87171]/30 text-[#F87171]'
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
                <span className="text-[11px] font-mono text-[#9CA3AF]">
                  {report.isolationTier} | Ed25519 Chain: {report.chainVerified ? 'VALID' : 'FAIL'}
                </span>
              </div>

              <div className="space-y-2">
                {report.probes.map((probe) => (
                  <div
                    key={probe.id}
                    className="rounded-md border border-[#242830] bg-[#0D0F12] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {probe.contained ? (
                          <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#F87171] shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-[#F4F4F5]">{probe.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          probe.contained
                            ? 'bg-[#34D399]/15 text-[#34D399]'
                            : 'bg-[#F87171]/15 text-[#F87171]'
                        }`}
                      >
                        {probe.contained ? 'CONTAINED' : 'EXPOSED'} · {probe.durationMs}ms
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF]">{probe.attackDescription}</p>
                    <div className="text-[11px] font-mono text-[#38BDF8]">
                      Defense: {probe.enforcedBy}
                    </div>
                    <div className="rounded bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[11px] font-mono text-[#9CA3AF] break-words">
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
