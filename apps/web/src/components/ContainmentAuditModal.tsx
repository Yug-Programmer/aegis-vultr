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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700/90 bg-[#080d19] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Live Red-Team Sandbox Containment Self-Test
              </h3>
              <p className="text-[11px] text-slate-400">
                Dispatches 4 real adversarial escape probes into a fresh sandbox and verifies defense layers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
            <div className="text-xs text-slate-300 leading-relaxed">
              Tests <strong className="text-white">API Key Exfiltration</strong>,{' '}
              <strong className="text-white">Vultr Metadata SSRF (169.254.169.254)</strong>,{' '}
              <strong className="text-white">Host Path Traversal</strong>, and{' '}
              <strong className="text-white">Runaway CPU Process Watchdog</strong>.
            </div>
            <button
              onClick={handleRun}
              disabled={running}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 shrink-0 cursor-pointer transition"
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
            <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-200 font-mono">
              {error}
            </div>
          )}

          {report && (
            <div className="space-y-3">
              <div
                className={`rounded-xl p-3.5 border flex items-center justify-between ${
                  report.allContained
                    ? 'bg-emerald-950/35 border-emerald-500/45 text-emerald-200'
                    : 'bg-rose-950/35 border-rose-500/45 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {report.allContained
                      ? 'ALL 4 ADVERSARIAL ESCAPE VECTORS CONTAINED'
                      : 'WARNING: CONTAINMENT REGRESSION DETECTED'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-300">
                  {report.isolationTier} | Ed25519 Chain: {report.chainVerified ? 'VALID' : 'FAIL'}
                </span>
              </div>

              <div className="space-y-2.5">
                {report.probes.map((probe) => (
                  <div
                    key={probe.id}
                    className="rounded-xl border border-slate-800 bg-[#0b1120] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {probe.contained ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-white">{probe.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          probe.contained
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {probe.contained ? 'CONTAINED' : 'EXPOSED'} • {probe.durationMs}ms
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{probe.attackDescription}</p>
                    <div className="text-[11px] font-mono text-sky-300">
                      Defense: {probe.enforcedBy}
                    </div>
                    <div className="rounded bg-slate-950/90 border border-slate-800/80 px-2.5 py-1.5 text-[11px] font-mono text-slate-300 break-words">
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
