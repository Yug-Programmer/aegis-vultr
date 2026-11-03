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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[#6B7280]">
        <Globe className="w-8 h-8 text-[#242830] mb-2" />
        <p className="font-medium text-[#9CA3AF] mb-1">No Active Browser Viewport</p>
        <p className="max-w-xs leading-relaxed text-[#6B7280]">
          Run a browser-enabled mission to inspect live Headless Chromium screenshots, HTTP security
          headers, and SSRF route blocker telemetry.
        </p>
      </div>
    );
  }

  const activeIdx =
    selectedIdx >= 0 && selectedIdx < snapshots.length ? selectedIdx : snapshots.length - 1;
  const snap = snapshots[activeIdx];
  const imgUrl = getArtifactUrl(missionId, snap.screenshotArtifact);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Frame Switcher */}
      {snapshots.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {snapshots.map((s, idx) => (
            <button
              key={s.frameId}
              onClick={() => setSelectedIdx(idx)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono border shrink-0 cursor-pointer transition ${
                idx === activeIdx
                  ? 'bg-[#15181E] border-[#38BDF8]/50 text-[#38BDF8]'
                  : 'bg-[#111419] border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5]'
              }`}
            >
              Frame #{idx + 1} ({s.loadTimeMs}ms)
            </button>
          ))}
        </div>
      )}

      {/* Browser Chrome Viewport */}
      <div className="rounded-lg border border-[#242830] bg-[#111419] overflow-hidden">
        {/* Browser Top Bar */}
        <div className="px-3 py-2 bg-[#0D0F12] border-b border-[#242830] flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
            <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
            <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
          </div>
          <div className="flex-1 min-w-0 bg-[#0B0D10] border border-[#242830] rounded px-2.5 py-1 flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 truncate text-[#F4F4F5]">
              <Lock className="w-3 h-3 text-[#34D399] shrink-0" />
              <span className="truncate">{snap.url}</span>
            </div>
            <span className="text-[#34D399] shrink-0 font-medium">HTTP {snap.httpStatus}</span>
          </div>
          <a
            href={imgUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#9CA3AF] hover:text-[#38BDF8] p-1 transition"
            title="Open full-size screenshot in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Viewport Image */}
        <div className="bg-[#0B0D10] relative">
          <img
            src={imgUrl}
            alt={snap.title}
            className="w-full h-auto block border-b border-[#242830]"
          />
        </div>

        {/* Route Blocker Status */}
        <div className="p-2.5 bg-[#0D0F12] flex items-center justify-between text-[10px] font-mono text-[#9CA3AF]">
          <span className="flex items-center gap-1.5 text-[#34D399]">
            <ShieldCheck className="w-3.5 h-3.5" />
            169.254.169.254 &amp; RFC1918 Route Blocker Active
          </span>
          <span className="text-[#6B7280]">SHA-256: {snap.screenshotSha256.slice(0, 16)}...</span>
        </div>
      </div>

      {/* Captured HTTP Security Headers */}
      <div className="rounded-lg border border-[#242830] bg-[#111419] p-3.5 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Captured HTTP Security Headers
        </div>
        {Object.keys(snap.securityHeaders).length === 0 ? (
          <div className="text-[11px] font-mono text-[#6B7280]">
            No optional security headers returned on response.
          </div>
        ) : (
          <div className="space-y-1 text-[11px] font-mono divide-y divide-[#242830]">
            {Object.entries(snap.securityHeaders).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2 pt-1 pb-1">
                <span className="text-[#38BDF8] shrink-0">{k}:</span>
                <span className="text-[#9CA3AF] break-all">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sandboxed DOM Interactive Elements */}
      {snap.elements.length > 0 && (
        <div className="rounded-lg border border-[#242830] bg-[#111419] p-3.5 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Sandboxed DOM Interactive Elements ({snap.elements.length})
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] font-mono">
            {snap.elements.slice(0, 20).map((el) => (
              <div
                key={el.ref}
                className="flex items-center gap-2 text-[#9CA3AF] py-1 border-b border-[#242830]/60"
              >
                <span className="text-[#38BDF8]">[{el.ref}]</span>
                <span className="px-1 rounded bg-[#15181E] text-[#6B7280]">&lt;{el.tag}&gt;</span>
                <span className="truncate text-[#F4F4F5]">{el.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
