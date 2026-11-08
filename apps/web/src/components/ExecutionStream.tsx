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
  ExternalLink,
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
    <div className="rounded-md border border-[#2E2E2E] bg-[#1D1D1D] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-[#242424] border-b border-[#2E2E2E] flex items-center justify-between text-xs cursor-pointer"
      >
        <div className="flex items-center gap-2 font-mono text-[#38BDF8]">
          <FileCode2 className="w-3.5 h-3.5" />
          <span>/workspace/{filename}</span>
          <span className="text-[10px] text-[#555555]">({lines.length} lines)</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#888888]">
          <span>{expanded ? 'Collapse' : 'Inspect source'}</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>
      <pre className="p-3 text-[11px] font-mono text-[#E0E0E0] overflow-x-auto leading-relaxed bg-[#191919]">
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#191919]">
        <div className="w-12 h-12 rounded-lg bg-[#242424] border border-[#2E2E2E] flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6 text-[#38BDF8]" />
        </div>
        <h2 className="text-base font-semibold text-[#F2F2F2] mb-1">
          Agent Control Plane
        </h2>
        <p className="text-xs text-[#888888] max-w-sm leading-relaxed mb-6">
          Launch a mission from the left panel. Every action evaluates against security policy,
          executes inside the isolated Vultr sandbox, and produces Ed25519-signed output receipts.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-md w-full text-left">
          <div className="rounded-md bg-[#1D1D1D] border border-[#2E2E2E] p-3">
            <div className="text-[10px] font-mono text-[#34D399] uppercase font-semibold mb-1">
              01 · Plan
            </div>
            <div className="text-[11px] text-[#888888] leading-snug">
              Decomposes mission into verifiable tasks
            </div>
          </div>
          <div className="rounded-md bg-[#1D1D1D] border border-[#2E2E2E] p-3">
            <div className="text-[10px] font-mono text-[#38BDF8] uppercase font-semibold mb-1">
              02 · Contain
            </div>
            <div className="text-[11px] text-[#888888] leading-snug">
              SSRF blocker, zero host secrets, isolated workspace
            </div>
          </div>
          <div className="rounded-md bg-[#1D1D1D] border border-[#2E2E2E] p-3">
            <div className="text-[10px] font-mono text-[#FBBF24] uppercase font-semibold mb-1">
              03 · Verify
            </div>
            <div className="text-[11px] text-[#888888] leading-snug">
              Ed25519 cryptographic receipts &amp; real artifacts
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#191919]">
      {/* Mission Header Card */}
      <div className="rounded-md bg-[#1D1D1D] border border-[#2E2E2E] p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888]">
            <span className="text-[#38BDF8] font-semibold">{mission.id}</span>
            <span>·</span>
            <span>Sandbox: {mission.sandboxId || 'initializing...'}</span>
            <span>·</span>
            <span className="uppercase text-[#555555]">Policy: {mission.policy.networkMode}</span>
          </div>
          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
              mission.status === 'completed'
                ? 'bg-[#34D399]/12 text-[#34D399]'
                : mission.status === 'failed'
                  ? 'bg-[#F87171]/12 text-[#F87171]'
                  : 'bg-[#38BDF8]/12 text-[#38BDF8]'
            }`}
          >
            {mission.status}
          </span>
        </div>
        <p className="text-xs text-[#F2F2F2] leading-relaxed font-sans">{mission.prompt}</p>
      </div>

      {/* Event Feed */}
      {mission.events.map((ev: MissionEvent) => {
        if (ev.type === 'agent_thought') {
          return (
            <div
              key={ev.id}
              className="rounded-md bg-[#1D1D1D] border border-[#2E2E2E] border-l-2 border-l-[#38BDF8] p-3 flex items-start gap-2.5"
            >
              <BrainCircuit className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <div className="text-xs text-[#E0E0E0] leading-relaxed whitespace-pre-wrap font-sans">
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
              className={`rounded-md px-3 py-2 border text-[11px] font-mono flex items-center justify-between gap-2 ${
                allowed
                  ? 'bg-[#1D1D1D] border-[#2E2E2E] text-[#34D399]'
                  : 'bg-[#242424] border-[#F87171]/30 text-[#F87171]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {allowed ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                ) : (
                  <ShieldX className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
                )}
                <span className="font-semibold shrink-0">[{pol.decision}]</span>
                <span className="text-[#555555] shrink-0">{pol.ruleId}</span>
                <span className="truncate text-[#888888]">{pol.reason}</span>
              </div>
              <span className="text-[#555555] shrink-0 max-w-[160px] truncate">
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
              className="rounded-md border border-[#2E2E2E] bg-[#191919] overflow-hidden"
            >
              <div className="px-3 py-1.5 bg-[#242424] border-b border-[#2E2E2E] flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2 text-[#888888]">
                  <Terminal className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>sandbox exec: {String(ev.data.filename || '')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#555555]">{String(ev.data.durationMs || 0)}ms</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      exitCode === 0
                        ? 'bg-[#34D399]/12 text-[#34D399]'
                        : 'bg-[#FBBF24]/12 text-[#FBBF24]'
                    }`}
                  >
                    exit {exitCode}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2 text-[11px] font-mono overflow-x-auto">
                {stdout && (
                  <pre className="text-[#34D399] whitespace-pre-wrap break-words">
                    {stdout}
                  </pre>
                )}
                {stderr && (
                  <pre className="text-[#FBBF24] whitespace-pre-wrap break-words">
                    {stderr}
                  </pre>
                )}
                {!stdout && !stderr && (
                  <span className="text-[#555555]">(process completed cleanly)</span>
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
              className="rounded-md border border-[#2E2E2E] bg-[#1D1D1D] overflow-hidden"
            >
              <div className="px-3 py-2 bg-[#242424] border-b border-[#2E2E2E] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span className="font-mono text-xs text-[#38BDF8] truncate">{snap.url}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#34D399]/12 text-[#34D399] shrink-0">
                    HTTP {snap.httpStatus}
                  </span>
                </div>
                <button
                  onClick={onJumpToBrowser}
                  className="text-[11px] text-[#38BDF8] hover:underline shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span>Viewport</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 flex items-start gap-3">
                <img
                  src={getArtifactUrl(mission.id, snap.screenshotArtifact)}
                  alt={snap.title}
                  onClick={onJumpToBrowser}
                  className="w-40 h-24 object-cover object-top rounded border border-[#2E2E2E] shrink-0 cursor-pointer hover:border-[#38BDF8] transition"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-xs font-semibold text-[#F2F2F2] truncate">{snap.title}</div>
                  <p className="text-[11px] text-[#888888] line-clamp-2 leading-relaxed">
                    {snap.textExcerpt || 'Interactive DOM rendered inside isolated Chromium.'}
                  </p>
                  <div className="text-[10px] font-mono text-[#555555] pt-1">
                    SHA-256: {snap.screenshotSha256.slice(0, 16)}... · {snap.loadTimeMs}ms
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
              className="rounded-md px-3 py-1.5 bg-[#1D1D1D] hover:bg-[#242424] border border-[#2E2E2E] text-[10px] font-mono text-[#888888] flex items-center justify-between gap-2 cursor-pointer transition"
            >
              <div className="flex items-center gap-2 truncate">
                <Fingerprint className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span className="text-[#D0D0D0]">Signed Receipt #{rcpt.stepIndex}</span>
                <span className="text-[#555555]">({rcpt.action})</span>
              </div>
              <span className="text-[#555555] shrink-0 font-mono">
                hash:{rcpt.receiptHash.slice(0, 12)}...
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
              className="rounded-md border border-[#34D399]/30 bg-[#1D1D1D] p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#34D399] font-medium text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Execution Output</span>
                </div>
                <button
                  onClick={onJumpToReceipts}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#34D399]/12 text-[#34D399] border border-[#34D399]/25 hover:bg-[#34D399]/20 cursor-pointer transition"
                >
                  Ed25519 Chain: {mission.receipts.length} Signed Steps ✓
                </button>
              </div>

              <div className="text-xs text-[#F2F2F2] whitespace-pre-wrap leading-relaxed">
                {summary}
              </div>

              {nonScreenshotArtifacts.length > 0 && (
                <div className="pt-2 border-t border-[#2E2E2E]">
                  <div className="text-[11px] font-mono text-[#555555] mb-2">
                    Sandbox Workspace Output Artifacts:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {nonScreenshotArtifacts.map((art) => (
                      <button
                        key={art.relativePath}
                        onClick={() => onJumpToArtifact(art.relativePath)}
                        className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#242424] hover:bg-[#2A2A2A] text-[#38BDF8] border border-[#2E2E2E] hover:border-[#38BDF8]/40 transition cursor-pointer"
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
              className="rounded-md border border-[#F87171]/30 bg-[#1D1D1D] p-3.5 flex items-start gap-2.5 text-xs text-[#F87171]"
            >
              <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">Execution Halted by Supervisor</div>
                <div className="font-mono text-[11px] text-[#888888]">{String(ev.data.error)}</div>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
