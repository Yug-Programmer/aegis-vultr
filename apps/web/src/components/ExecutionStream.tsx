import { useState } from 'react';
import {
  ShieldCheck,
  ShieldX,
  Terminal,
  FileCode2,
  BrainCircuit,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type {
  BrowserSnapshot,
  ExecutionReceipt,
  MissionEvent,
  MissionRecord,
  PolicyEvaluation,
} from '@aegis/shared';
import { getArtifactUrl } from '../api';

interface ExecutionStreamProps {
  mission: MissionRecord | null;
  onJumpToBrowser: () => void;
  onJumpToArtifact: (relativePath: string) => void;
  onJumpToReceipts: () => void;
}

function CodeEventCard({ filename, content }: { filename: string; content: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = content.split('\n');
  const preview = lines.slice(0, 10).join('\n');

  return (
    <div className="rounded-lg border border-slate-800 bg-[#080d19] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs cursor-pointer"
      >
        <div className="flex items-center gap-2 font-mono text-sky-300">
          <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
          <span>/workspace/{filename}</span>
          <span className="text-[10px] text-slate-500">({lines.length} lines)</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span>{expanded ? 'Collapse' : 'Inspect source'}</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>
      <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
        {expanded ? content : preview + (lines.length > 10 ? '\n# ... (' + (lines.length - 10) + ' more lines)' : '')}
      </pre>
    </div>
  );
}

export function ExecutionStream({
  mission,
  onJumpToBrowser,
  onJumpToArtifact,
  onJumpToReceipts,
}: ExecutionStreamProps) {
  if (!mission) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-sky-400" />
        </div>
        <h2 className="text-base font-semibold text-white mb-1.5">
          Containment-First Agent Control Plane
        </h2>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-5">
          Select a flagship workflow on the left or enter any engineering / live-browser prompt.
          Every action passes through the pre-dispatch Policy Gate, executes inside an isolated
          sandbox, and returns Ed25519-signed cryptographic output receipts.
        </p>
        <div className="grid grid-cols-3 gap-2.5 max-w-lg w-full text-left">
          <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-2.5">
            <div className="text-[11px] font-mono text-emerald-400 mb-0.5">01 // PLAN</div>
            <div className="text-[11px] text-slate-400">
              Decomposes goal into verifiable sandbox sub-tasks
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-2.5">
            <div className="text-[11px] font-mono text-sky-400 mb-0.5">02 // CONTAIN</div>
            <div className="text-[11px] text-slate-400">
              Zero host secrets, SSRF 169.254.169.254 guard, isolated /workspace
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-2.5">
            <div className="text-[11px] font-mono text-purple-400 mb-0.5">03 // VERIFY</div>
            <div className="text-[11px] text-slate-400">
              Ed25519 hash-chained receipts + real artifacts
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Mission Header Card */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900/95 to-[#0b1324] border border-slate-800 p-3.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-sky-400 font-semibold">{mission.id}</span>
            <span>•</span>
            <span>Sandbox: {mission.sandboxId || 'initializing...'}</span>
            <span>•</span>
            <span>Policy: {mission.policy.networkMode}</span>
          </div>
          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
              mission.status === 'completed'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                : mission.status === 'failed'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                  : 'bg-sky-500/15 text-sky-300 border-sky-500/35'
            }`}
          >
            {mission.status}
          </span>
        </div>
        <p className="text-xs text-slate-100 leading-relaxed font-medium">{mission.prompt}</p>
      </div>

      {/* Event Feed */}
      {mission.events.map((ev: MissionEvent) => {
        if (ev.type === 'agent_thought') {
          return (
            <div
              key={ev.id}
              className="rounded-lg bg-slate-900/60 border border-slate-800/90 p-3 flex items-start gap-2.5"
            >
              <BrainCircuit className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {String(ev.data.thought || '')}
              </div>
            </div>
          );
        }

        if (ev.type === 'policy_evaluated') {
          const pol = ev.data.evaluation as PolicyEvaluation;
          const allowed = pol.decision === 'ALLOW';
          return (
            <div
              key={ev.id}
              className={`rounded-md px-3 py-1.5 border text-[11px] font-mono flex items-center justify-between gap-2 ${
                allowed
                  ? 'bg-emerald-950/25 border-emerald-800/40 text-emerald-300'
                  : 'bg-rose-950/35 border-rose-700/60 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {allowed ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="font-semibold shrink-0">[{pol.decision}]</span>
                <span className="text-slate-400 shrink-0">{pol.ruleId}</span>
                <span className="truncate text-slate-300">{pol.reason}</span>
              </div>
              <span className="text-slate-500 shrink-0 max-w-[180px] truncate">
                {pol.inspectedTarget}
              </span>
            </div>
          );
        }

        if (ev.type === 'code_written') {
          return (
            <CodeEventCard
              key={ev.id}
              filename={String(ev.data.filename || 'script')}
              content={String(ev.data.content || '')}
            />
          );
        }

        if (ev.type === 'terminal_output') {
          const exitCode = Number(ev.data.exitCode ?? 0);
          const stdout = String(ev.data.stdout || '');
          const stderr = String(ev.data.stderr || '');
          return (
            <div
              key={ev.id}
              className={`rounded-lg border overflow-hidden ${
                exitCode === 0
                  ? 'border-slate-800 bg-[#050811]'
                  : 'border-amber-500/40 bg-amber-950/10'
              }`}
            >
              <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>sandbox exec: {String(ev.data.filename || '')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{String(ev.data.durationMs || 0)}ms</span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      exitCode === 0
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    exit {exitCode}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2 text-[11px] font-mono overflow-x-auto">
                {stdout && (
                  <pre className="text-emerald-200/95 whitespace-pre-wrap break-words">
                    {stdout}
                  </pre>
                )}
                {stderr && (
                  <pre className="text-amber-300/95 whitespace-pre-wrap break-words">
                    {stderr}
                  </pre>
                )}
                {!stdout && !stderr && (
                  <span className="text-slate-500">(process exited cleanly with empty output)</span>
                )}
              </div>
            </div>
          );
        }

        if (ev.type === 'browser_snapshot') {
          const snap = ev.data.snapshot as BrowserSnapshot;
          return (
            <div
              key={ev.id}
              className="rounded-lg border border-sky-500/30 bg-[#08101f] overflow-hidden"
            >
              <div className="px-3 py-2 bg-sky-950/30 border-b border-sky-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="font-mono text-sky-200 truncate">{snap.url}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 shrink-0">
                    HTTP {snap.httpStatus}
                  </span>
                </div>
                <button
                  onClick={onJumpToBrowser}
                  className="text-[11px] font-mono text-sky-400 hover:text-sky-300 shrink-0 cursor-pointer"
                >
                  Open Live Viewport →
                </button>
              </div>
              <div className="p-3 flex items-start gap-3">
                <img
                  src={getArtifactUrl(mission.id, snap.screenshotArtifact)}
                  alt={snap.title}
                  onClick={onJumpToBrowser}
                  className="w-44 h-28 object-cover object-top rounded border border-slate-700 shrink-0 cursor-pointer hover:border-sky-400 transition"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-xs font-semibold text-white truncate">{snap.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                    {snap.textExcerpt || 'Interactive DOM rendered inside isolated Chromium.'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 pt-1">
                    SHA-256: {snap.screenshotSha256.slice(0, 20)}... • {snap.loadTimeMs}ms
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (ev.type === 'receipt_signed') {
          const rcpt = ev.data.receipt as ExecutionReceipt;
          return (
            <div
              key={ev.id}
              onClick={onJumpToReceipts}
              className="rounded-md px-3 py-1 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/70 text-[10px] font-mono text-slate-400 flex items-center justify-between gap-2 cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Fingerprint className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-purple-300">Signed Receipt #{rcpt.stepIndex}</span>
                <span>({rcpt.action})</span>
              </div>
              <span className="text-slate-500 shrink-0">
                sig:{rcpt.signature.slice(0, 14)}... | hash:{rcpt.receiptHash.slice(0, 12)}...
              </span>
            </div>
          );
        }

        if (ev.type === 'mission_completed') {
          const summary = String(ev.data.summary || mission.finalSummary || '');
          const nonScreenshotArtifacts = mission.artifacts.filter(
            (a) => !a.relativePath.startsWith('screenshots/')
          );
          return (
            <div
              key={ev.id}
              className="rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/25 to-[#08101d] p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Sandbox Execution Output</span>
                </div>
                <button
                  onClick={onJumpToReceipts}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer"
                >
                  Ed25519 Chain: {mission.receipts.length} Signed Steps ✓
                </button>
              </div>

              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {summary}
              </div>

              {nonScreenshotArtifacts.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                    Inspect Generated Sandbox Artifacts:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {nonScreenshotArtifacts.map((art) => (
                      <button
                        key={art.relativePath}
                        onClick={() => onJumpToArtifact(art.relativePath)}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-900 hover:bg-sky-500/20 text-sky-300 border border-slate-700 hover:border-sky-500/40 transition cursor-pointer"
                      >
                        {art.relativePath} ({(art.sizeBytes / 1024).toFixed(1)} KB)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (ev.type === 'mission_failed') {
          return (
            <div
              key={ev.id}
              className="rounded-xl border border-rose-500/50 bg-rose-950/25 p-3.5 flex items-start gap-2.5 text-xs text-rose-200"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">Execution Halted by Containment / Supervisor</div>
                <div className="font-mono text-[11px] text-rose-300">{String(ev.data.error)}</div>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
