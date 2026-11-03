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
    <div className="p-4 space-y-4 overflow-y-auto flex-1">
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Task Execution Plan
          </span>
          {plan.length > 0 && (
            <span className="text-[11px] font-mono text-[#6B7280]">
              {plan.filter((s) => s.status === 'completed' || s.status === 'healed').length}/
              {plan.length} verified
            </span>
          )}
        </div>

        {plan.length === 0 ? (
          <div className="rounded-md border border-[#242830] bg-[#111419] p-4 text-center text-xs text-[#6B7280]">
            Launch a mission above to generate a multi-step sandbox execution plan.
          </div>
        ) : (
          <div className="space-y-2">
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
                      ? 'bg-[#15181E] border-[#38BDF8]/40'
                      : isCompleted
                        ? 'bg-[#111419] border-[#242830]'
                        : isHealed
                          ? 'bg-[#111419] border-[#FBBF24]/30'
                          : isBlocked || isFailed
                            ? 'bg-[#111419] border-[#F87171]/30'
                            : 'bg-[#0D0F12] border-[#242830]/80'
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
                        <Circle className="w-3.5 h-3.5 text-[#6B7280]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-[#F4F4F5] leading-snug">
                          {step.index}. {step.title}
                        </span>
                        {step.durationMs !== undefined && (
                          <span className="text-[10px] font-mono text-[#6B7280] shrink-0">
                            {step.durationMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug">
                        {step.description}
                      </p>
                      {step.verificationNote && (
                        <div className="mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#15181E] text-[#38BDF8] border border-[#242830] inline-block">
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
        <div className="pt-3 border-t border-[#242830]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
            Session Mission History
          </div>
          <div className="space-y-1">
            {missions.slice(0, 8).map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMission(m.id)}
                className={`w-full text-left rounded-md px-2.5 py-1.5 border text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                  m.id === activeMissionId
                    ? 'bg-[#15181E] border-[#38BDF8]/40 text-[#F4F4F5]'
                    : 'bg-[#111419] hover:bg-[#15181E] border-[#242830] text-[#9CA3AF]'
                }`}
              >
                <span className="truncate">{m.prompt}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    m.status === 'completed'
                      ? 'bg-[#34D399]/15 text-[#34D399]'
                      : m.status === 'failed'
                        ? 'bg-[#F87171]/15 text-[#F87171]'
                        : 'bg-[#38BDF8]/15 text-[#38BDF8]'
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
