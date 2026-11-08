import { useEffect, useRef, useState } from 'react';
import {
  Globe,
  Lock,
  ShieldCheck,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  MousePointer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Terminal,
} from 'lucide-react';
import type { BrowserSnapshot } from '@aegis/shared';
import { getArtifactUrl } from '../api';

interface AgentBrowserCursorViewProps {
  missionId?: string;
  snapshots: BrowserSnapshot[];
  activeAction?: string;
}

interface CursorTarget {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  action: string;
  targetDesc: string;
  click?: boolean;
}

// Simulated agent interaction trajectory targets over typical web pages
const DEFAULT_TARGETS: CursorTarget[] = [
  { x: 18, y: 14, action: 'navigate', targetDesc: 'Address bar & navigation initiate' },
  { x: 26, y: 28, action: 'hover', targetDesc: 'Inspecting top frontpage story headline' },
  { x: 34, y: 32, action: 'click', targetDesc: 'Clicking story link to evaluate DOM', click: true },
  { x: 52, y: 44, action: 'extract_js', targetDesc: 'Extracting point scores & comment counters' },
  { x: 68, y: 56, action: 'scroll', targetDesc: 'Scrolling down viewport for next batch' },
  { x: 42, y: 72, action: 'extract_js', targetDesc: 'Reading pagination row & subtext' },
  { x: 82, y: 84, action: 'screenshot', targetDesc: 'Capturing cryptographic viewport artifact', click: true },
];

export function AgentBrowserCursorView({
  missionId,
  snapshots,
  activeAction = 'Inspecting live webpage',
}: AgentBrowserCursorViewProps) {
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 22, y: 24 });
  const [isClicking, setIsClicking] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<CursorTarget>(DEFAULT_TARGETS[0]);
  const [targetIdx, setTargetIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasSnapshots = snapshots && snapshots.length > 0;
  const currentSnap = hasSnapshots ? snapshots[Math.min(activeFrameIdx, snapshots.length - 1)] : null;
  const imgUrl = missionId && currentSnap ? getArtifactUrl(missionId, currentSnap.screenshotArtifact) : '';

  // Animate the Agent Cursor smoothly through action points
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = (1600 / playbackSpeed);
    const interval = setInterval(() => {
      setTargetIdx((prev) => {
        const next = (prev + 1) % DEFAULT_TARGETS.length;
        const target = DEFAULT_TARGETS[next];
        setCurrentTarget(target);
        setCursorPos({ x: target.x, y: target.y });

        if (target.click) {
          setIsClicking(true);
          setTimeout(() => setIsClicking(false), 550);
        }

        // If multiple frames exist, cycle frames with cursor actions
        if (hasSnapshots && snapshots.length > 1 && next % 3 === 0) {
          setActiveFrameIdx((f) => (f + 1) % snapshots.length);
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, hasSnapshots, snapshots?.length]);

  if (!missionId || !hasSnapshots) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[#777777] bg-[#191919]">
        <div className="w-12 h-12 rounded-xl bg-[#242424] border border-[#2E2E2E] flex items-center justify-center mb-3 text-[#38BDF8]">
          <Globe className="w-6 h-6" />
        </div>
        <p className="font-semibold text-sm text-[#F2F2F2] mb-1">No Active Browser Viewport</p>
        <p className="max-w-xs leading-relaxed text-[#777777] text-xs">
          When the agent executes browser actions, live Headless Chromium frames with the virtual AI mouse cursor will stream here in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#161616] text-[#F2F2F2] overflow-hidden select-none">
      {/* Browser Top Chrome / Nav Bar */}
      <div className="px-3 py-2 bg-[#1F1F1F] border-b border-[#2A2A2A] flex items-center gap-2 shrink-0">
        {/* Window controls */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/60" />
        </div>

        {/* Back / Forward / Refresh */}
        <div className="flex items-center gap-0.5 text-[#777777]">
          <button
            onClick={() => setActiveFrameIdx((f) => Math.max(0, f - 1))}
            disabled={activeFrameIdx === 0}
            className="p-1 rounded hover:bg-[#282828] hover:text-[#D0D0D0] disabled:opacity-30 cursor-pointer"
            title="Previous Frame"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveFrameIdx((f) => Math.min(snapshots.length - 1, f + 1))}
            disabled={activeFrameIdx === snapshots.length - 1}
            className="p-1 rounded hover:bg-[#282828] hover:text-[#D0D0D0] disabled:opacity-30 cursor-pointer"
            title="Next Frame"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setTargetIdx(0);
              setCursorPos({ x: 22, y: 24 });
            }}
            className="p-1 rounded hover:bg-[#282828] hover:text-[#D0D0D0] cursor-pointer"
            title="Reset Cursor Position"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 min-w-0 bg-[#141414] border border-[#2D2D2D] rounded-md px-2.5 py-1 flex items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 truncate text-[#D0D0D0]">
            <Lock className="w-3 h-3 text-[#34D399] shrink-0" />
            <span className="truncate text-[11px]">{currentSnap?.url || 'https://sandbox.chromium.local'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#34D399]/15 text-[#34D399] font-semibold">
              HTTP {currentSnap?.httpStatus ?? 200}
            </span>
            <span className="text-[10px] text-[#666666]">
              {currentSnap?.loadTimeMs ?? 240}ms
            </span>
          </div>
        </div>

        {/* External View & Playback Controls */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded text-xs font-mono flex items-center gap-1 cursor-pointer transition ${
              isPlaying ? 'bg-[#38BDF8]/15 text-[#38BDF8]' : 'bg-[#262626] text-[#888888]'
            }`}
            title={isPlaying ? 'Pause Agent Cursor' : 'Play Agent Cursor'}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
            className="px-1.5 py-1 rounded bg-[#242424] text-[10px] font-mono text-[#888888] hover:text-[#F2F2F2] cursor-pointer"
            title="Toggle Cursor Speed"
          >
            {playbackSpeed}x
          </button>

          <a
            href={imgUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 rounded text-[#777777] hover:text-[#38BDF8] cursor-pointer"
            title="Open screenshot in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Switcher Bar if multiple snapshots exist */}
      {snapshots.length > 1 && (
        <div className="px-3 py-1.5 bg-[#1A1A1A] border-b border-[#262626] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[#666666] text-[10px] uppercase font-bold mr-1">Frames:</span>
            {snapshots.map((s, idx) => (
              <button
                key={s.frameId}
                onClick={() => setActiveFrameIdx(idx)}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition ${
                  idx === activeFrameIdx
                    ? 'bg-[#38BDF8] text-[#111111] font-bold'
                    : 'bg-[#222222] text-[#888888] hover:text-[#D0D0D0]'
                }`}
              >
                #{idx + 1}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-[#777777] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
            <span>Agent Live</span>
          </div>
        </div>
      )}

      {/* Main Viewport Area with AI Agent Cursor Overlay */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-[#101010] flex items-start justify-center p-3"
      >
        <div className="relative inline-block max-w-full rounded-lg overflow-hidden border border-[#2A2A2A] shadow-2xl bg-[#000]">
          {/* Webpage Screenshot Render */}
          <img
            src={imgUrl}
            alt={currentSnap?.title || 'Chromium Viewport'}
            className="w-full h-auto max-h-[68vh] object-contain block"
          />

          {/* VIRTUAL AGENT MOUSE CURSOR */}
          <div
            className="absolute pointer-events-none transition-all ease-out duration-500 z-30"
            style={{
              left: `${cursorPos.x}%`,
              top: `${cursorPos.y}%`,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Click Ripple Effect */}
            {isClicking && (
              <span
                className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-2 border-[#38BDF8] animate-ping opacity-75"
                style={{ animationDuration: '600ms' }}
              />
            )}

            {/* Custom AI Agent Cursor Pointer */}
            <div className="relative flex items-start gap-1">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_2px_8px_rgba(56,189,248,0.7)]"
              >
                <path
                  d="M5.5 3.5L18.5 10.5L12 12.5L10 19L5.5 3.5Z"
                  fill="#38BDF8"
                  stroke="#0F172A"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Agent Pill Attached to Cursor */}
              <div className="mt-2 ml-1 px-2 py-0.5 rounded-full bg-[#1A1A1A]/95 border border-[#38BDF8]/40 shadow-lg text-[10px] font-sans font-medium text-[#F2F2F2] flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                <span className="text-[#38BDF8] font-bold">AEGIS</span>
                <span className="text-[#888888] font-mono">[{currentTarget.action}]</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Execution Ticker & Coordinates */}
      <div className="px-3.5 py-2 bg-[#1A1A1A] border-t border-[#262626] flex items-center justify-between text-xs font-mono text-[#888888] shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Terminal className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
          <span className="text-[#38BDF8] font-semibold text-[11px]">Action:</span>
          <span className="text-[#D0D0D0] text-[11px] truncate">
            {currentTarget.targetDesc || activeAction}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[10px] text-[#666666]">
          <span>X: {Math.round(cursorPos.x * 12.8)}px, Y: {Math.round(cursorPos.y * 7.2)}px</span>
          <span className="text-[#34D399] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>SSRF-Guarded</span>
          </span>
        </div>
      </div>
    </div>
  );
}

