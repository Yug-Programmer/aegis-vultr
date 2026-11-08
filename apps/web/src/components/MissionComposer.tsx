import { useState } from 'react';
import { Play, Loader2, Globe, Code2, Shield, TrendingUp } from 'lucide-react';
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
    <div className="p-4 border-b border-[#2E2E2E] space-y-4 shrink-0 overflow-y-auto max-h-[50vh] bg-[#1D1D1D]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-[#777777]">
          Mission Dispatch
        </span>
        <span className="text-[11px] font-mono text-[#444444]">RPC: HMAC-SHA256</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setSelectedTemplateId(undefined);
          }}
          rows={4}
          placeholder="Describe an engineering, data analysis, or web audit mission to execute inside the Vultr sandbox..."
          className="w-full rounded-md bg-[#191919] border border-[#2E2E2E] focus:border-[#38BDF8] p-3 text-xs text-[#F2F2F2] placeholder:text-[#555555] resize-none leading-relaxed outline-none"
        />

        <button
          type="submit"
          disabled={isRunning || !prompt.trim()}
          className="w-full py-2 px-3 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-40 text-[#191919] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing in Isolated Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Plan &amp; Execute in Sandbox</span>
            </>
          )}
        </button>
      </form>

      {/* Verified Multi-Step Workflows Library */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#444444]">
          Verified Flagship Workflows
        </div>
        <div className="space-y-1.5">
          {templates.map((tpl) => {
            const Icon = CATEGORY_ICON[tpl.category] || Code2;
            const active = selectedTemplateId === tpl.id;
            return (
              <div
                key={tpl.id}
                className={`rounded-md p-2.5 border transition cursor-pointer ${
                  active
                    ? 'bg-[#242424] border-[#38BDF8]/30'
                    : 'bg-[#191919] hover:bg-[#242424] border-[#2E2E2E]'
                }`}
                onClick={() => {
                  setPrompt(tpl.prompt);
                  setSelectedTemplateId(tpl.id);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                    <span className="text-xs font-medium text-[#D0D0D0] truncate">
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
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242424] hover:bg-[#38BDF8] hover:text-[#191919] text-[#38BDF8] border border-[#2E2E2E] shrink-0 cursor-pointer transition disabled:opacity-40"
                  >
                    Run
                  </button>
                </div>
                <p className="text-[11px] text-[#777777] mt-1 leading-snug">
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
