import {
  CheckCircle2,
  Circle,
  Loader2,
  Wrench,
  ShieldX,
  XCircle,
  GitBranch,
} from 'lucide-react';
import type { MissionRecord, PlanStep } from '@aegis/shared';

interface PlanTimelineProps {
  plan: PlanStep[];
  missions: MissionRecord[];
  activeMissionId?: string;
  onSelectMission: (id: string) => void;
}

export function PlanTimeline({
  plan,
  missions,
  activeMissionId,
  onSelectMission,
}: PlanTimelineProps) {
  return (
    <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            Task Execution Plan
          </span>
          {plan.length > 0 && (
            <span className="text-[11px] font-mono text-slate-400">
              {plan.filter((s) => s.status === 'completed' || s.status === 'healed').length}/
              {plan.length} verified
            </span>
          )}
        </div>

        {plan.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-xs text-slate-500">
            Launch a mission above to generate a multi-step sandbox execution plan.
          </div>
        ) : (
          <div className="space-y-2">
            {plan.map((step) => (
              <div
                key={step.id}
                className={`rounded-lg p-2.5 border text-xs transition ${
                  step.status === 'running'
                    ? 'bg-sky-500/10 border-sky-500/40'
                    : step.status === 'completed'
                      ? 'bg-emerald-500/5 border-emerald-500/25'
                      : step.status === 'healed'
                        ? 'bg-amber-500/10 border-amber-500/35'
                        : step.status === 'blocked' || step.status === 'failed'
                          ? 'bg-rose-500/10 border-rose-500/35'
                          : 'bg-[#0b101d]/60 border-slate-800/90'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    {step.status === 'running' && (
                      <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                    )}
                    {step.status === 'completed' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {step.status === 'healed' && (
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {step.status === 'blocked' && (
                      <ShieldX className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    {step.status === 'failed' && (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    {step.status === 'pending' && (
                      <Circle className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-slate-200 leading-snug">
                        {step.index}. {step.title}
                      </span>
                      {step.durationMs !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {step.durationMs}ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {step.description}
                    </p>
                    {step.verificationNote && (
                      <div className="mt-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 text-sky-300 border border-slate-800 inline-block">
                        {step.verificationNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {missions.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Session Mission History
          </div>
          <div className="space-y-1.5">
            {missions.slice(0, 8).map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMission(m.id)}
                className={`w-full text-left rounded-md px-2.5 py-1.5 border text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                  m.id === activeMissionId
                    ? 'bg-slate-800/90 border-sky-500/40 text-white'
                    : 'bg-[#0b101d]/50 hover:bg-slate-900 border-slate-800/80 text-slate-300'
                }`}
              >
                <span className="truncate">{m.prompt}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    m.status === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : m.status === 'failed'
                        ? 'bg-rose-500/15 text-rose-300'
                        : 'bg-sky-500/15 text-sky-300'
                  }`}
                >
                  {m.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
