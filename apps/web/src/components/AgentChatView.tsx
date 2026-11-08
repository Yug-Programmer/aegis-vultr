import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Globe,
  Terminal,
  ShieldCheck,
  FileCode2,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  ShieldAlert,
  ArrowRight,
  FolderOpen,
  Play,
  Layers,
  Maximize2,
} from 'lucide-react';
import { ExtensibleWorkspaceSidebar, type SidebarTab } from './ExtensibleWorkspaceSidebar';
import {
  Globe02Icon,
  Attachment01Icon,
  ChartLineData01Icon,
  File02Icon,
  Mail01Icon,
  Calendar03Icon,
} from '@hugeicons/core-free-icons';
import type {
  BrowserSnapshot,
  ContainmentPolicy,
  ExecutionReceipt,
  MissionEvent,
  MissionRecord,
  NetworkPolicyMode,
  PolicyEvaluation,
} from '@aegis/shared';
import {
  createMission,
  fetchMission,
  getArtifactUrl,
  subscribeToMissionEvents,
  type SystemStatusResponse,
} from '../api';
import ThoughtLine from './ThoughtLine';
import PromptBar, {
  type PromptBarCommand,
  type PromptBarModel,
  type PromptBarSendDetail,
  type PromptBarSource,
} from './PromptBar';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  missionId?: string;
  mission?: MissionRecord | null;
  isStreaming?: boolean;
  thoughtSteps?: string[];
  thoughtSeconds?: number;
  events?: MissionEvent[];
}

interface AgentChatViewProps {
  networkMode: NetworkPolicyMode;
  status?: SystemStatusResponse | null;
  onNavigateToStudio?: () => void;
  onSelectMission?: (mission: MissionRecord) => void;
}

const CHAT_SOURCES: PromptBarSource[] = [
  {
    key: 'files',
    name: 'Photos & files',
    description: 'Upload to sandbox workspace',
    icon: Attachment01Icon,
    attach: true,
  },
  { key: 'web', name: 'Web Search', description: 'Live Chromium browsing', icon: Globe02Icon },
  { key: 'sales', name: 'Sales CRM', description: 'Leads & ICP research', icon: ChartLineData01Icon },
  { key: 'finance', name: 'AP Ledger', description: 'Invoices & 3-way match', icon: File02Icon },
  { key: 'support', name: 'Support Queue', description: 'Tickets & telemetry diagnostics', icon: Mail01Icon },
  { key: 'workspace', name: '/workspace Files', description: 'Read generated artifacts', icon: Calendar03Icon },
];

const CHAT_COMMANDS: PromptBarCommand[] = [
  { key: 'audit', name: '/audit', description: 'Run red-team containment security audit' },
  { key: 'reconcile', name: '/reconcile', description: 'Execute three-way AP ledger reconciliation' },
  { key: 'qualify', name: '/qualify', description: 'Research prospect domain and compute ICP score' },
  { key: 'diagnose', name: '/diagnose', description: 'Isolate customer telemetry payload and find root cause' },
  { key: 'summarize', name: '/summarize', description: 'Synthesize findings and output verified receipts' },
];

const CHAT_MODELS: PromptBarModel[] = [
  { key: 'gemini', name: 'Gemini 2.5 Flash', tag: 'Fast' },
  { key: 'playbook', name: 'Autonomous Engine', tag: 'Airgapped' },
];

const SUGGESTIONS = [
  {
    title: 'Hacker News Front Page Analysis',
    prompt: 'Open https://news.ycombinator.com in the sandboxed browser, extract top frontpage stories with points and comments, run a Python analytics script to compute engagement statistics, and save an SVG chart + CSV dataset.',
    icon: Globe,
  },
  {
    title: 'Three-Way AP Invoice Fraud Audit',
    prompt: 'Run AP invoice reconciliation against master purchase orders and vendor IBAN records inside the isolated Python sandbox. Identify duplicate charges, overbilling, and account tampering.',
    icon: FileCode2,
  },
  {
    title: 'Untrusted Customer Telemetry Diagnostics',
    prompt: 'Isolate untrusted customer SAML assertions and webhook logs in the sandbox to safely reproduce production issues, determine root cause, and draft an executive resolution memo.',
    icon: ShieldCheck,
  },
  {
    title: 'Sales Account Research & ICP Scoring',
    prompt: 'Inspect prospect company domains in isolated Chromium, evaluate technology stack signals, compute deterministic ICP fit scores, and prepare a personalized outreach email for sign-off.',
    icon: Sparkles,
  },
];

// Helper to extract clean, concise, deduplicated milestone steps
function deriveMilestoneSteps(existingSteps: string[], ev: MissionEvent): string[] {
  const steps = [...existingSteps];
  const addStep = (cleanStep: string) => {
    const normalized = cleanStep.trim().toLowerCase();
    const exists = steps.some((s) => {
      const sn = s.trim().toLowerCase();
      return sn === normalized || (sn.length > 22 && normalized.startsWith(sn.slice(0, 22)));
    });
    if (!exists) {
      steps.push(cleanStep);
    }
  };

  if (ev.type === 'agent_thought') {
    const thought = String(ev.data.thought || '').trim();
    if (thought && !thought.startsWith('Signed') && !thought.startsWith('Policy')) {
      const clean = thought.length > 55 ? `${thought.slice(0, 52)}…` : thought;
      addStep(clean);
    }
  } else if (ev.type === 'policy_evaluated') {
    addStep('Verifying SSRF and egress policies');
  } else if (ev.type === 'browser_snapshot') {
    const snap = ev.data.snapshot as BrowserSnapshot;
    try {
      const host = new URL(snap.url).hostname || 'target site';
      addStep(`Browsing ${host} in sandboxed Chromium`);
    } catch {
      addStep('Browsing target site in sandboxed Chromium');
    }
  } else if (ev.type === 'terminal_output') {
    const fname = String(ev.data.filename || 'script');
    if (fname.includes('verify')) {
      addStep('Verifying outputs & cryptographic receipts');
    } else {
      addStep(`Executing ${fname} in sandbox`);
    }
  }

  // Keep max 5 high-level milestone steps to prevent tall lists
  return steps.slice(0, 5);
}

function AegisLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="aegis-chat-logo-grad" x1="12" y1="2" x2="12" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" stopOpacity="0.4" />
          <stop stopColor="#0B0D10" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.2L3.8 6.2V12.2C3.8 17.4 7.3 21.4 12 22.3C16.7 21.4 20.2 17.4 20.2 12.2V6.2L12 2.2Z"
        fill="url(#aegis-chat-logo-grad)"
        stroke="#38BDF8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 6.8L7 9.4V12.8C7 16 9.1 18.7 12 19.3C14.9 18.7 17 16 17 12.8V9.4L12 6.8Z"
        stroke="#38BDF8"
        strokeWidth="1.1"
        strokeDasharray="2.5 2"
        opacity="0.75"
      />
      <circle cx="12" cy="13" r="2.2" fill="#38BDF8" />
      <path
        d="M12 9.2V10.8M12 15.2V16.8M8.2 13H9.8M14.2 13H15.8"
        stroke="#38BDF8"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function AgentChatView({
  networkMode,
  status,
  onNavigateToStudio,
  onSelectMission,
}: AgentChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');
  const [sidebarFile, setSidebarFile] = useState<string>('');
  const [activeMissionRecord, setActiveMissionRecord] = useState<MissionRecord | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeUnsubRef = useRef<(() => void) | null>(null);

  const availableModels = useMemo<PromptBarModel[]>(() => {
    const list: PromptBarModel[] = [];
    if (status?.llm.vultrInferenceConfigured) {
      list.push({ key: 'vultr', name: 'Vultr Kimi-K2', tag: 'Serverless' });
    }
    list.push({ key: 'gemini', name: 'Gemini 2.5 Flash', tag: 'Fast' });
    if (status?.llm.openaiConfigured) {
      list.push({ key: 'openai', name: 'GPT-4o', tag: 'Flagship' });
    }
    list.push({ key: 'playbook', name: 'Autonomous Engine', tag: 'Airgapped' });
    return list;
  }, [status]);

  const defaultModelKey = useMemo(() => {
    if (status?.llm.vultrInferenceConfigured) return 'vultr';
    return 'gemini';
  }, [status]);

  useEffect(() => {
    return () => {
      if (activeUnsubRef.current) {
        activeUnsubRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, busy]);

  const handleSendMessage = async (text: string, detail: PromptBarSendDetail) => {
    if (!text.trim() || busy) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    const assistantMessageId = `asst-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMessageId,
      sender: 'assistant',
      text: '',
      timestamp: new Date(),
      isStreaming: true,
      thoughtSteps: ['Reading instruction & planning flow'],
      events: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setBusy(true);

    try {
      const policy: Partial<ContainmentPolicy> = { networkMode };
      const created = await createMission({
        prompt: text.trim(),
        policy,
      });
      setActiveMissionRecord(created);

      // Update assistant message with missionId
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                missionId: created.id,
                mission: created,
                thoughtSteps: [
                  'Decomposing mission into verifiable tasks',
                  'Checking egress containment policies',
                ],
              }
            : m
        )
      );

      // Subscribe to real-time mission events
      const unsubscribe = subscribeToMissionEvents(created.id, (ev: MissionEvent) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== assistantMessageId) return msg;

            const existingEvents = msg.events || [];
            const newEvents = [...existingEvents, ev];
            const steps = deriveMilestoneSteps(msg.thoughtSteps || [], ev);

            const isDone =
              ev.type === 'mission_completed' || ev.type === 'mission_failed';

            let responseText = msg.text;
            if (ev.type === 'mission_completed') {
              responseText = String(ev.data.summary || '');
            } else if (ev.type === 'mission_failed') {
              responseText = `Execution error: ${String(ev.data.error || 'Action blocked by containment supervisor')}`;
            }

            return {
              ...msg,
              events: newEvents,
              thoughtSteps: steps,
              text: responseText,
              isStreaming: !isDone,
            };
          })
        );

        if (ev.type === 'mission_completed' || ev.type === 'mission_failed') {
          void fetchMission(created.id).then((full) => {
            setActiveMissionRecord(full);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      mission: full,
                      isStreaming: false,
                      text: full.finalSummary || msg.text,
                    }
                  : msg
              )
            );
            setBusy(false);
          });
        }
      });

      activeUnsubRef.current = unsubscribe;
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                isStreaming: false,
                text: `Failed to initiate mission: ${err instanceof Error ? err.message : String(err)}`,
              }
            : m
        )
      );
      setBusy(false);
    }
  };

  const handleStop = () => {
    if (activeUnsubRef.current) {
      activeUnsubRef.current();
      activeUnsubRef.current = null;
    }
    setBusy(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#191919] overflow-hidden text-[#F2F2F2] relative">
      {/* Main Content Area: Chat Flow (Left) + Extensible Right Sidebar (Right) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Chat Thread + PromptBar Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Soft Atmospheric Replit-Style Blue Glow at the Bottom */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[380px] z-0 select-none overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 50% 100%, rgba(56, 189, 248, 0.16) 0%, rgba(14, 165, 233, 0.08) 35%, rgba(2, 132, 199, 0.03) 60%, transparent 80%)',
            }}
          />

          {/* Floating Workspace & Live Browser Button (Visible ONLY when sidebar is closed) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-3 right-4 z-20 px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 bg-[#1E1E1E]/95 hover:bg-[#262626] text-[#D0D0D0] hover:text-[#FFFFFF] border border-[#333333] hover:border-[#38BDF8]/50 shadow-xl backdrop-blur-md transition-all cursor-pointer group"
              title="Open Workspace & Live Browser"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#38BDF8] group-hover:scale-110 transition-transform" />
              <span>Workspace &amp; Live Browser</span>
              {activeMissionRecord?.artifacts && activeMissionRecord.artifacts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] font-semibold">
                  {activeMissionRecord.artifacts.length}
                </span>
              )}
            </button>
          )}

          {/* Messages Thread Container */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 relative z-10"
          >
            {messages.length === 0 ? (
              /* Clean ChatGPT-Style Empty State */
              <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center pt-8 pb-12 select-none">
                <div className="mb-4 flex items-center justify-center">
                  <AegisLogo className="w-14 h-14 drop-shadow-[0_4px_20px_rgba(56,189,248,0.25)]" />
                </div>
                <h2 className="text-xl font-semibold text-[#F2F2F2] mb-1.5 tracking-tight">
                  AEGIS Agent Control
                </h2>
                <p className="text-xs text-[#888888] max-w-md leading-relaxed mb-8">
                  Give any autonomous goal or engineering prompt. AEGIS will formulate a plan, browse live sites, execute sandbox code, and cryptographically verify outputs.
                </p>

                {/* Quick Action Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {SUGGESTIONS.map((s, idx) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => void handleSendMessage(s.prompt, { attachments: [] })}
                        className="p-3.5 rounded-xl border border-[#2E2E2E] bg-[#1D1D1D] hover:bg-[#242424] hover:border-[#38BDF8]/40 transition text-left cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                          <span className="text-xs font-semibold text-[#D0D0D0] group-hover:text-[#F2F2F2] truncate">
                            {s.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#777777] leading-snug line-clamp-2">
                          {s.prompt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-3">
                    {msg.sender === 'user' ? (
                      /* User Message Bubble */
                      <div className="flex justify-end items-start gap-3 pl-8">
                        <div className="rounded-2xl rounded-tr-sm bg-[#242424] border border-[#2E2E2E] px-4 py-3 text-xs text-[#F2F2F2] max-w-xl leading-relaxed whitespace-pre-wrap font-sans">
                          {msg.text}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#2A2A2A] border border-[#333333] flex items-center justify-center shrink-0 mt-0.5 text-[#9CA3AF]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message Bubble with ThoughtLine + Tools + Response */
                      <div className="flex items-start gap-3.5 pr-4">
                        <div className="w-7 h-7 rounded-full bg-[#1D1D1D] border border-[#2E2E2E] flex items-center justify-center shrink-0 mt-0.5 text-[#38BDF8]">
                          <Bot className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          {/* ThoughtLine Integration - Auto-collapses on settle, muted ChatGPT theme */}
                          <div className="py-0.5">
                            <ThoughtLine
                              working={Boolean(msg.isStreaming)}
                              steps={msg.thoughtSteps && msg.thoughtSteps.length > 0 ? msg.thoughtSteps : ['Analyzing instructions…']}
                              label="Thinking…"
                              doneLabel="Thought for"
                              glyph="sparkle"
                              fontSize={13}
                              breathPeriod={1.6}
                              breathDepth={0.45}
                              settleDuration={300}
                              settleBlur={1.5}
                              collapsible
                              collapseOnSettle={true}
                              showTimer
                              color="#A0A0A0"
                              glyphColor="#38BDF8"
                              onSettle={(sec) => {
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id ? { ...m, thoughtSeconds: sec } : m
                                  )
                                );
                              }}
                            />
                          </div>

                          {/* Tool Calls & Execution Traces - Sleek Minimal Pill */}
                          {msg.events && msg.events.length > 0 && (
                            <ToolExecutionAccordion
                              events={msg.events}
                              missionId={msg.missionId}
                              onOpenBrowser={() => {
                                setSidebarTab('browser');
                                setSidebarOpen(true);
                              }}
                              onOpenFile={(filename) => {
                                setSidebarFile(filename);
                                setSidebarTab('files');
                                setSidebarOpen(true);
                              }}
                            />
                          )}

                          {/* Final Synthesized Response - Clean ChatGPT Typography */}
                          {msg.text ? (
                            <div className="text-xs text-[#F2F2F2] leading-relaxed font-sans pt-1">
                              <FormattedResponse text={msg.text} />

                              {/* Artifact Outputs */}
                              {msg.mission && msg.mission.artifacts.length > 0 && (
                                <ArtifactsShowcase
                                  missionId={msg.mission.id}
                                  artifacts={msg.mission.artifacts}
                                  onOpenFile={(path) => {
                                    setSidebarFile(path);
                                    setSidebarTab('files');
                                    setSidebarOpen(true);
                                  }}
                                />
                              )}

                              {/* Inspect in Studio link */}
                              {msg.mission && (
                                <div className="pt-3 mt-3 border-t border-[#262626] flex items-center justify-between text-xs">
                                  <span className="text-[11px] font-mono text-[#777777] flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                                    <span>Proof: {msg.mission.receipts.length} Ed25519 signed receipts</span>
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => {
                                        setSidebarTab('browser');
                                        setSidebarOpen(true);
                                      }}
                                      className="text-[11px] text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                    >
                                      <Globe className="w-3 h-3" />
                                      <span>Watch Live Browser</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSidebarTab('files');
                                        setSidebarOpen(true);
                                      }}
                                      className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                    >
                                      <FolderOpen className="w-3 h-3" />
                                      <span>Open in Sidebar</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : msg.isStreaming ? (
                            <div className="text-xs text-[#777777] flex items-center gap-2 pt-1 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                              <span>Generating verified response…</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floating PromptBar Input Container */}
          <div className="shrink-0 bg-transparent p-4 flex justify-center relative z-10">
            <PromptBar
              placeholder="Ask AEGIS to plan, browse, code, or execute tools in isolated sandbox…"
              sources={CHAT_SOURCES}
              commands={CHAT_COMMANDS}
              models={availableModels}
              defaultModel={defaultModelKey}
              efforts={['Low', 'Medium', 'High', 'Extra', 'Max']}
              defaultEffort="High"
              busy={busy}
              onSend={(text, detail) => void handleSendMessage(text, detail)}
              onStop={handleStop}
              background="#1D1D1D"
              color="#F2F2F2"
              menuBackground="#1F1F1F"
              sparkColor="#38BDF8"
              sparkBoost={1.2}
              width={760}
              radius={16}
              maxRows={4}
              morphDuration={240}
              squash={0.12}
              tilt={8}
              pressScale={0.96}
            />
          </div>
        </div>

        {/* EXTENSIBLE RIGHT SIDEBAR (Files, Python Runner, Live Browser with Agent Cursor) */}
        <ExtensibleWorkspaceSidebar
          mission={activeMissionRecord}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          initialTab={sidebarTab}
          initialFile={sidebarFile}
          onMissionUpdated={(upd) => setActiveMissionRecord(upd)}
        />
      </div>
    </div>
  );
}

/**
 * Tool Execution Accordion:
 * Displays tool invocations (Browser, Code, Terminal, Policy, Receipts)
 * in an understated ChatGPT/developer-tool card.
 */
function ToolExecutionAccordion({
  events,
  missionId,
  onOpenBrowser,
  onOpenFile,
}: {
  events: MissionEvent[];
  missionId?: string;
  onOpenBrowser?: () => void;
  onOpenFile?: (filename: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Filter significant tool execution events
  const toolEvents = events.filter((e) =>
    ['policy_evaluated', 'browser_snapshot', 'code_written', 'terminal_output', 'receipt_signed'].includes(
      e.type
    )
  );

  if (toolEvents.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#262626] bg-[#1A1A1A] overflow-hidden my-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#242424] flex items-center justify-between text-xs text-[#888888] hover:text-[#D0D0D0] cursor-pointer transition text-left"
      >
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Sandbox Tool Executions</span>
          <span className="px-1.5 py-0.2 rounded bg-[#2A2A2A] text-[#777777] text-[10px]">
            {toolEvents.length} actions
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#777777]">
          <span>{open ? 'Hide trace' : 'View trace'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="p-2.5 divide-y divide-[#262626] space-y-1.5 text-xs font-mono max-h-56 overflow-y-auto bg-[#171717]">
          {toolEvents.map((ev, i) => {
            if (ev.type === 'policy_evaluated') {
              const pol = ev.data.evaluation as PolicyEvaluation;
              return (
                <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-[#34D399]" />
                    <span className="text-[#34D399]">SSRF: [{pol.decision}]</span>
                    <span className="text-[#555555]">{pol.ruleId}</span>
                  </div>
                  <span className="text-[#777777] truncate max-w-xs">{pol.inspectedTarget}</span>
                </div>
              );
            }

            if (ev.type === 'browser_snapshot') {
              const snap = ev.data.snapshot as BrowserSnapshot;
              return (
                <div key={i} className="pt-1.5 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-[#38BDF8]" />
                      <span className="text-[#38BDF8]">browser_navigate</span>
                      <span className="text-[#555555]">HTTP {snap.httpStatus}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onOpenBrowser && (
                        <button
                          onClick={onOpenBrowser}
                          className="text-[10px] text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Globe className="w-2.5 h-2.5" />
                          <span>Watch Agent Cursor</span>
                        </button>
                      )}
                      <span className="text-[#777777]">{snap.loadTimeMs}ms</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#888888] truncate pl-5">
                    {snap.url}
                  </div>
                  {missionId && snap.screenshotArtifact && (
                    <div className="pl-5 pt-1">
                      <img
                        src={getArtifactUrl(missionId, snap.screenshotArtifact)}
                        alt={snap.title}
                        onClick={onOpenBrowser}
                        className="w-32 h-18 object-cover object-top rounded border border-[#2E2E2E] cursor-pointer hover:border-[#38BDF8] transition"
                        title="Click to watch Agent Cursor in Browser View"
                      />
                    </div>
                  )}
                </div>
              );
            }

            if (ev.type === 'code_written') {
              const fname = String(ev.data.filename || '');
              return (
                <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-3 h-3 text-[#38BDF8]" />
                    <span className="text-[#D0D0D0]">write_file</span>
                    <span className="text-[#38BDF8]">/workspace/{fname}</span>
                  </div>
                  {onOpenFile && (
                    <button
                      onClick={() => onOpenFile(fname)}
                      className="text-[10px] text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      View &amp; Run
                    </button>
                  )}
                </div>
              );
            }

            if (ev.type === 'terminal_output') {
              const exit = (ev.data.exitCode as number | undefined) ?? 0;
              const fname = String(ev.data.filename || '');
              return (
                <div key={i} className="pt-1.5 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-[#34D399]" />
                      <span className="text-[#D0D0D0]">exec_code</span>
                      <span className="text-[#38BDF8]">{fname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onOpenFile && fname.endsWith('.py') && (
                        <button
                          onClick={() => onOpenFile(fname)}
                          className="text-[10px] text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Re-Run</span>
                        </button>
                      )}
                      <span className={exit === 0 ? 'text-[#34D399]' : 'text-[#F87171]'}>
                        exit {exit}
                      </span>
                    </div>
                  </div>
                  {Boolean(ev.data.stdout) && (
                    <pre className="text-[10px] text-[#34D399] bg-[#111111] p-1.5 rounded border border-[#262626] overflow-x-auto max-h-20">
                      {String(ev.data.stdout).slice(0, 300)}
                    </pre>
                  )}
                </div>
              );
            }

            if (ev.type === 'receipt_signed') {
              const rcpt = ev.data.receipt as ExecutionReceipt;
              return (
                <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-[#888888]">
                    <Fingerprint className="w-3 h-3 text-[#38BDF8]" />
                    <span>Receipt #{rcpt.stepIndex} ({rcpt.action})</span>
                  </div>
                  <span className="text-[#555555] font-mono">
                    hash:{rcpt.receiptHash.slice(0, 10)}...
                  </span>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Formatted Markdown Response:
 * Renders headers, lists, code spans, and bold text cleanly.
 */
function FormattedResponse({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      elements.push(<div key={`gap-${i}`} className="h-1.5" />);
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-[#F2F2F2] mt-2 mb-1 flex items-center gap-2">
          <span>{line.replace(/^###\s*/, '')}</span>
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-sm font-bold text-[#F2F2F2] mt-2 mb-1">
          {line.replace(/^##\s*/, '')}
        </h2>
      );
    } else if (line.startsWith('- ')) {
      const content = line.replace(/^-\s*/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 text-xs text-[#D0D0D0] leading-relaxed my-0.5 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0 mt-1.5" />
          <div className="flex-1">{renderFormattedInline(content)}</div>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="text-xs text-[#D0D0D0] leading-relaxed my-0.5">
          {renderFormattedInline(line)}
        </p>
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function renderFormattedInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[#F2F2F2]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-[#242424] border border-[#2E2E2E] text-[11px] font-mono text-[#38BDF8]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="text-[#E0E0E0] italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

/**
 * Artifacts Showcase:
 * Displays generated SVG charts with preview and downloadable badges.
 */
function ArtifactsShowcase({
  missionId,
  artifacts,
  onOpenFile,
}: {
  missionId: string;
  artifacts: Array<{ relativePath: string; sizeBytes: number; mimeType: string }>;
  onOpenFile?: (path: string) => void;
}) {
  const svgArtifact = artifacts.find((a) => a.relativePath.endsWith('.svg'));
  const otherArtifacts = artifacts.filter((a) => !a.relativePath.startsWith('screenshots/'));

  return (
    <div className="mt-3 space-y-2">
      {/* Inline SVG Chart Preview */}
      {svgArtifact && (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] overflow-hidden">
          <div className="px-3.5 py-2 bg-[#222222] border-b border-[#2A2A2A] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <span className="font-medium text-[#F2F2F2]">{svgArtifact.relativePath}</span>
              <span className="text-[10px] text-[#777777] font-mono">
                ({(svgArtifact.sizeBytes / 1024).toFixed(1)} KB SVG Data Visualization)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenFile && (
                <button
                  onClick={() => onOpenFile(svgArtifact.relativePath)}
                  className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>Inspect in Sidebar</span>
                </button>
              )}
              <a
                href={getArtifactUrl(missionId, svgArtifact.relativePath, true)}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#777777] hover:text-[#D0D0D0] flex items-center gap-1 font-mono"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>
          </div>
          <div className="p-3 bg-[#171717] flex justify-center overflow-x-auto">
            <img
              src={getArtifactUrl(missionId, svgArtifact.relativePath)}
              alt={svgArtifact.relativePath}
              onClick={() => onOpenFile?.(svgArtifact.relativePath)}
              className="max-h-64 w-auto object-contain rounded cursor-pointer hover:opacity-95 transition"
              title="Click to inspect in Sidebar"
            />
          </div>
        </div>
      )}

      {/* Downloadable / Inspectable Artifact Badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        {otherArtifacts.map((art) => {
          const isPy = art.relativePath.endsWith('.py');
          return (
            <div
              key={art.relativePath}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#2E2E2E] hover:border-[#38BDF8]/40 text-xs font-mono text-[#D0D0D0] transition"
            >
              {isPy ? (
                <FileCode2 className="w-3 h-3 text-[#38BDF8]" />
              ) : (
                <Download className="w-3 h-3 text-[#38BDF8]" />
              )}
              {onOpenFile ? (
                <button
                  onClick={() => onOpenFile(art.relativePath)}
                  className="hover:text-[#38BDF8] hover:underline cursor-pointer"
                  title="Open & view in right sidebar"
                >
                  {art.relativePath}
                </button>
              ) : (
                <a
                  href={getArtifactUrl(missionId, art.relativePath, true)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#38BDF8]"
                >
                  {art.relativePath}
                </a>
              )}
              {isPy && onOpenFile && (
                <button
                  onClick={() => onOpenFile(art.relativePath)}
                  className="px-1.5 py-0.2 rounded bg-[#10B981]/20 text-[#34D399] text-[10px] font-bold hover:bg-[#10B981]/30 cursor-pointer flex items-center gap-1"
                  title="Run Python script in sandbox"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Run</span>
                </button>
              )}
              <span className="text-[10px] text-[#666666]">
                ({(art.sizeBytes / 1024).toFixed(1)} KB)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
