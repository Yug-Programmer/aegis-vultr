import {
  CheckCircle2,
  Circle,
  Loader2,
  Wrench,
  ShieldX,
  XCircle,
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
    <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-[#1D1D1D]">
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
            Task Execution Plan
          </span>
          {plan.length > 0 && (
            <span className="text-[11px] font-mono text-[#444444]">
              {plan.filter((s) => s.status === 'completed' || s.status === 'healed').length}/
              {plan.length} verified
            </span>
          )}
        </div>

        {plan.length === 0 ? (
          <div className="rounded-md border border-[#2E2E2E] bg-[#191919] p-4 text-center text-xs text-[#555555]">
            Launch a mission above to generate a multi-step sandbox execution plan.
          </div>
        ) : (
          <div className="space-y-1.5">
            {plan.map((step) => {
              const isRunning = step.status === 'running';
              const isCompleted = step.status === 'completed';
              const isHealed = step.status === 'healed';
              const isBlocked = step.status === 'blocked';
              const isFailed = step.status === 'failed';

              return (
                <div
                  key={step.id}
                  className={`rounded-md p-2.5 border text-xs transition ${
                    isRunning
                      ? 'bg-[#242424] border-[#38BDF8]/30'
                      : isCompleted
                        ? 'bg-[#1D1D1D] border-[#2E2E2E]'
                        : isHealed
                          ? 'bg-[#1D1D1D] border-[#FBBF24]/25'
                          : isBlocked || isFailed
                            ? 'bg-[#1D1D1D] border-[#F87171]/25'
                            : 'bg-[#191919] border-[#2A2A2A]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isRunning && (
                        <Loader2 className="w-3.5 h-3.5 text-[#38BDF8] animate-spin" />
                      )}
                      {isCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                      )}
                      {isHealed && (
                        <Wrench className="w-3.5 h-3.5 text-[#FBBF24]" />
                      )}
                      {isBlocked && (
                        <ShieldX className="w-3.5 h-3.5 text-[#F87171]" />
                      )}
                      {isFailed && (
                        <XCircle className="w-3.5 h-3.5 text-[#F87171]" />
                      )}
                      {step.status === 'pending' && (
                        <Circle className="w-3.5 h-3.5 text-[#444444]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-[#D0D0D0] leading-snug">
                          {step.index}. {step.title}
                        </span>
                        {step.durationMs !== undefined && (
                          <span className="text-[10px] font-mono text-[#444444] shrink-0">
                            {step.durationMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#777777] mt-0.5 leading-snug">
                        {step.description}
                      </p>
                      {step.verificationNote && (
                        <div className="mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#242424] text-[#38BDF8] border border-[#2E2E2E] inline-block">
                          {step.verificationNote}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {missions.length > 0 && (
        <div className="pt-3 border-t border-[#2E2E2E]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555555] mb-2">
            Session Mission History
          </div>
          <div className="space-y-1">
            {missions.slice(0, 8).map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMission(m.id)}
                className={`w-full text-left rounded-md px-2.5 py-1.5 border text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                  m.id === activeMissionId
                    ? 'bg-[#242424] border-[#38BDF8]/30 text-[#D0D0D0]'
                    : 'bg-[#191919] hover:bg-[#242424] border-[#2E2E2E] text-[#777777]'
                }`}
              >
                <span className="truncate">{m.prompt}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    m.status === 'completed'
                      ? 'bg-[#34D399]/12 text-[#34D399]'
                      : m.status === 'failed'
                        ? 'bg-[#F87171]/12 text-[#F87171]'
                        : 'bg-[#38BDF8]/12 text-[#38BDF8]'
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
