import { useState } from 'react';
import { Globe, Lock, ShieldCheck, ExternalLink } from 'lucide-react';
import type { BrowserSnapshot } from '@aegis/shared';
import { getArtifactUrl } from '../api';

interface BrowserViewportProps {
  missionId?: string;
  snapshots: BrowserSnapshot[];
}

export function BrowserViewport({ missionId, snapshots }: BrowserViewportProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);

  if (!missionId || snapshots.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500">
        <Globe className="w-8 h-8 text-slate-700 mb-2" />
        <p className="font-medium text-slate-400 mb-1">No Active Browser Frame</p>
        <p className="max-w-xs leading-relaxed">
          Run a browser-enabled mission (such as Hacker News Intelligence or Live Web Security
          Audit) to inspect live Headless Chromium screenshots and SSRF route telemetry.
        </p>
      </div>
    );
  }

  const activeIdx =
    selectedIdx >= 0 && selectedIdx < snapshots.length ? selectedIdx : snapshots.length - 1;
  const snap = snapshots[activeIdx];
  const imgUrl = getArtifactUrl(missionId, snap.screenshotArtifact);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
      {/* Frame Switcher */}
      {snapshots.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {snapshots.map((s, idx) => (
            <button
              key={s.frameId}
              onClick={() => setSelectedIdx(idx)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono border shrink-0 cursor-pointer ${
                idx === activeIdx
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Frame #{idx + 1} ({s.loadTimeMs}ms)
            </button>
          ))}
        </div>
      )}

      {/* Browser Chrome Frame */}
      <div className="rounded-xl border border-slate-700/90 bg-[#0a0f1c] overflow-hidden shadow-xl">
        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex-1 min-w-0 bg-[#060911] border border-slate-800 rounded-md px-2.5 py-1 flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 truncate text-slate-200">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{snap.url}</span>
            </div>
            <span className="text-emerald-400 shrink-0">HTTP {snap.httpStatus}</span>
          </div>
          <a
            href={imgUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-sky-300 p-1"
            title="Open full-size PNG screenshot"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-black relative">
          <img
            src={imgUrl}
            alt={snap.title}
            className="w-full h-auto block border-b border-slate-800"
          />
        </div>

        <div className="p-2.5 bg-slate-950/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            169.254.169.254 &amp; RFC1918 Route Blocker Active
          </span>
          <span>SHA-256: {snap.screenshotSha256.slice(0, 16)}...</span>
        </div>
      </div>

      {/* Response Security Headers */}
      <div className="rounded-lg border border-slate-800 bg-[#0b101d] p-3 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          Captured HTTP Security Headers
        </div>
        {Object.keys(snap.securityHeaders).length === 0 ? (
          <div className="text-[11px] font-mono text-slate-500">
            No optional security headers returned on response.
          </div>
        ) : (
          <div className="space-y-1 text-[11px] font-mono">
            {Object.entries(snap.securityHeaders).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2 border-b border-slate-800/60 pb-1">
                <span className="text-sky-400 shrink-0">{k}:</span>
                <span className="text-slate-300 break-all">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Elements Extracted */}
      {snap.elements.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-[#0b101d] p-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Sandboxed DOM Interactive Elements ({snap.elements.length})
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] font-mono">
            {snap.elements.slice(0, 15).map((el) => (
              <div
                key={el.ref}
                className="flex items-center gap-2 text-slate-300 py-0.5 border-b border-slate-800/50"
              >
                <span className="text-sky-400">[{el.ref}]</span>
                <span className="px-1 rounded bg-slate-800 text-slate-400">&lt;{el.tag}&gt;</span>
                <span className="truncate">{el.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
