import { useState } from 'react';
import { Play, Sparkles, Loader2, Globe, Code2, Shield, TrendingUp } from 'lucide-react';
import type { MissionTemplate } from '../api';

interface MissionComposerProps {
  templates: MissionTemplate[];
  isRunning: boolean;
  onLaunchMission: (prompt: string, templateId?: string) => Promise<void>;
}

const CATEGORY_ICON: Record<string, typeof Globe> = {
  'browser+code': Globe,
  'self-healing': Code2,
  security: Shield,
  quant: TrendingUp,
};

export function MissionComposer({
  templates,
  isRunning,
  onLaunchMission,
}: MissionComposerProps) {
  const [prompt, setPrompt] = useState(
    templates[0]?.prompt ||
      'Open https://news.ycombinator.com in the sandboxed browser, capture a live screenshot, extract the top front-page stories with points and domains, run a Python analytics script to compute engagement metrics, and generate an SVG chart + CSV dataset.'
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>('hn-intel');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isRunning) return;
    await onLaunchMission(prompt.trim(), selectedTemplateId);
  };

  return (
    <div className="p-3.5 border-b border-slate-800/90 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Mission Dispatch
        </span>
        <span className="text-[11px] font-mono text-slate-500">RPC: HMAC-SHA256</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setSelectedTemplateId(undefined);
          }}
          rows={4}
          placeholder="Describe a multi-step engineering, data analysis, or live browser task to execute inside the Vultr sandbox..."
          className="w-full rounded-lg bg-[#0b101d] border border-slate-700/80 focus:border-sky-500/70 focus:outline-none p-2.5 text-xs text-slate-100 placeholder:text-slate-500 resize-none leading-relaxed"
        />

        <button
          type="submit"
          disabled={isRunning || !prompt.trim()}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.25)] transition cursor-pointer disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Inside Isolated Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Plan &amp; Execute in Sandbox</span>
            </>
          )}
        </button>
      </form>

      <div className="space-y-1.5 pt-1">
        <div className="text-[11px] font-medium text-slate-400">
          Verified Multi-Step Workflows (1-Click Load &amp; Run):
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {templates.map((tpl) => {
            const Icon = CATEGORY_ICON[tpl.category] || Code2;
            const active = selectedTemplateId === tpl.id;
            return (
              <div
                key={tpl.id}
                className={`group rounded-lg p-2 border transition cursor-pointer ${
                  active
                    ? 'bg-sky-500/10 border-sky-500/40'
                    : 'bg-[#0b101d]/70 hover:bg-slate-800/60 border-slate-800'
                }`}
                onClick={() => {
                  setPrompt(tpl.prompt);
                  setSelectedTemplateId(tpl.id);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {tpl.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrompt(tpl.prompt);
                      setSelectedTemplateId(tpl.id);
                      void onLaunchMission(tpl.prompt, tpl.id);
                    }}
                    className="opacity-85 group-hover:opacity-100 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/35 text-sky-300 border border-sky-500/30 shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Run
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                  {tpl.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
