import crypto from 'node:crypto';
import {
  GENESIS_RECEIPT_HASH,
  verifyReceiptChain,
  type ContainmentPolicy,
  type ExecutionReceipt,
  type MissionEvent,
  type MissionEventType,
  type MissionRecord,
  type PlanStep,
} from '@aegis/shared';
import { DEFAULT_CONTAINMENT_POLICY, PolicyEngine } from './policyEngine.js';
import type { SandboxClient } from './sandboxClient.js';
import type { LlmClient, LlmMessage, LlmToolDefinition } from './llmClient.js';
import { runAutonomousPlaybook } from './autonomousPlaybooks.js';

type EventSubscriber = (event: MissionEvent) => void;

const AGENT_TOOLS: LlmToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'set_execution_plan',
      description: 'Initialize or update the multi-step execution plan before running tasks.',
      parameters: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                actionType: {
                  type: 'string',
                  enum: ['code', 'browser', 'filesystem', 'verify', 'synthesis'],
                },
              },
              required: ['id', 'title', 'description', 'actionType'],
            },
          },
        },
        required: ['steps'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_plan_step',
      description: 'Mark a plan step as running, completed, healed, or failed.',
      parameters: {
        type: 'object',
        properties: {
          stepId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['running', 'completed', 'healed', 'failed'],
          },
          verificationNote: { type: 'string' },
        },
        required: ['stepId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_navigate',
      description:
        'Navigate the isolated Headless Chromium browser inside the Vultr sandbox to an http/https URL and capture a live PNG screenshot + DOM summary.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full https:// URL to visit' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_extract_js',
      description:
        'Evaluate a JavaScript expression inside the active sandboxed browser page to extract structured JSON data from the DOM.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'JavaScript IIFE or expression returning serializable JSON data',
          },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_sandbox_file',
      description: 'Write a UTF-8 file inside the confined /workspace directory of the sandbox.',
      parameters: {
        type: 'object',
        properties: {
          relativePath: { type: 'string', description: 'Relative path inside /workspace' },
          content: { type: 'string' },
        },
        required: ['relativePath', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_sandbox_code',
      description:
        'Write and execute Python 3 or JavaScript (Node.js ESM) code inside the isolated Vultr sandbox and return real stdout, stderr, exitCode, and generated artifacts.',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['python', 'javascript'] },
          filename: { type: 'string', description: 'Script filename inside /workspace, e.g. analyze.py' },
          code: { type: 'string', description: 'Complete runnable source code' },
        },
        required: ['language', 'filename', 'code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_mission',
      description:
        'Finalize the mission once real execution outputs and artifacts have been verified.',
      parameters: {
        type: 'object',
        properties: {
          summaryMarkdown: {
            type: 'string',
            description: 'Concise markdown report citing real executed numbers and generated artifact filenames',
          },
        },
        required: ['summaryMarkdown'],
      },
    },
  },
];

export class AgentOrchestrator {
  private readonly missions = new Map<string, MissionRecord>();
  private readonly subscribers = new Map<string, Set<EventSubscriber>>();

  constructor(
    private readonly sandboxClient: SandboxClient,
    private readonly policyEngine: PolicyEngine,
    private readonly llmClient: LlmClient
  ) {}

  listMissions(): MissionRecord[] {
    return Array.from(this.missions.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  getMission(id: string): MissionRecord | undefined {
    return this.missions.get(id);
  }

  verifyMissionChain(id: string) {
    const m = this.missions.get(id);
    if (!m) throw new Error('Mission not found');
    return verifyReceiptChain(m.receipts);
  }

  subscribe(missionId: string, fn: EventSubscriber): () => void {
    let set = this.subscribers.get(missionId);
    if (!set) {
      set = new Set();
      this.subscribers.set(missionId, set);
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
    };
  }

  private emit(mission: MissionRecord, type: MissionEventType, data: Record<string, unknown>): void {
    const event: MissionEvent = {
      id: `evt_${crypto.randomBytes(5).toString('hex')}`,
      missionId: mission.id,
      timestamp: new Date().toISOString(),
      type,
      data,
    };
    mission.events.push(event);
    const subs = this.subscribers.get(mission.id);
    if (subs) {
      for (const fn of subs) {
        try {
          fn(event);
        } catch {
          // ignore closed listener
        }
      }
    }
  }

  async startMission(opts: {
    prompt: string;
    templateId?: string;
    policyOverrides?: Partial<ContainmentPolicy>;
    customRunner?: (ctx: import('./autonomousPlaybooks.js').PlaybookContext, mission: MissionRecord) => Promise<string>;
  }): Promise<MissionRecord> {
    const id = `msn_${crypto.randomBytes(6).toString('hex')}`;
    const policy: ContainmentPolicy = {
      ...DEFAULT_CONTAINMENT_POLICY,
      ...opts.policyOverrides,
    };

    const llmStatus = this.llmClient.getPublicStatus();
    const mission: MissionRecord = {
      id,
      prompt: opts.prompt,
      templateId: opts.templateId,
      status: 'planning',
      createdAt: new Date().toISOString(),
      llmProviderUsed: llmStatus.activeMode,
      llmModelUsed: llmStatus.activeModel,
      policy,
      plan: [],
      events: [],
      artifacts: [],
      browserSnapshots: [],
      receipts: [],
    };

    this.missions.set(id, mission);

    // Run asynchronously so HTTP POST returns immediately and client streams SSE
    void this.executeMissionLoop(mission, opts.customRunner);

    return mission;
  }

  private async executeMissionLoop(
    mission: MissionRecord,
    customRunner?: (ctx: import('./autonomousPlaybooks.js').PlaybookContext, mission: MissionRecord) => Promise<string>
  ): Promise<void> {
    let stepCounter = 0;
    let prevReceiptHash = GENESIS_RECEIPT_HASH;

    try {
      const { sandboxId, isolationTier } = await this.sandboxClient.createSandbox();
      mission.sandboxId = sandboxId;
      mission.status = 'executing';

      this.emit(mission, 'mission_started', {
        sandboxId,
        isolationTier,
        networkMode: mission.policy.networkMode,
        llmProvider: mission.llmProviderUsed,
        llmModel: mission.llmModelUsed,
      });

      const appendReceipt = (receipt: ExecutionReceipt) => {
        mission.receipts.push(receipt);
        prevReceiptHash = receipt.receiptHash;
        this.emit(mission, 'receipt_signed', { receipt });
      };

      const syncArtifacts = (latest: MissionRecord['artifacts']) => {
        const known = new Set(mission.artifacts.map((a) => `${a.relativePath}:${a.sha256}`));
        mission.artifacts = latest;
        for (const art of latest) {
          const key = `${art.relativePath}:${art.sha256}`;
          if (!known.has(key)) {
            this.emit(mission, 'artifact_created', { artifact: art });
          }
        }
      };

      const setPlan = (steps: PlanStep[]) => {
        mission.plan = steps;
        this.emit(mission, 'plan_updated', { plan: mission.plan });
      };

      const updateStep = (
        stepId: string,
        status: PlanStep['status'],
        verificationNote?: string
      ) => {
        const found = mission.plan.find((s) => s.id === stepId);
        if (found) {
          const now = new Date().toISOString();
          if (status === 'running' && !found.startedAt) {
            found.startedAt = now;
          }
          if (status === 'completed' || status === 'healed' || status === 'failed' || status === 'blocked') {
            found.completedAt = now;
            if (found.startedAt) {
              found.durationMs = Date.now() - new Date(found.startedAt).getTime();
            }
          }
          found.status = status;
          if (verificationNote) found.verificationNote = verificationNote;
          this.emit(mission, 'plan_updated', { plan: mission.plan });
        }
      };

      const dispatchWriteFile = async (relativePath: string, content: string) => {
        const evalRes = this.policyEngine.evaluateFilePath('write_sandbox_file', relativePath);
        this.emit(mission, 'policy_evaluated', { evaluation: evalRes });
        if (evalRes.decision === 'BLOCK') {
          throw new Error(`Policy Blocked (${evalRes.ruleId}): ${evalRes.reason}`);
        }

        stepCounter++;
        this.emit(mission, 'tool_dispatched', {
          tool: 'write_sandbox_file',
          target: relativePath,
          stepIndex: stepCounter,
        });
        this.emit(mission, 'code_written', {
          filename: relativePath,
          content,
        });

        const res = await this.sandboxClient.writeFile(sandboxId, {
          relativePath,
          content,
          missionId: mission.id,
          stepIndex: stepCounter,
          policyRuleId: evalRes.ruleId,
          prevReceiptHash,
        });
        appendReceipt(res.receipt);
        syncArtifacts(res.artifacts);
      };

      const dispatchExecCode = async (opts: {
        language: 'python' | 'javascript';
        code: string;
        filename: string;
      }) => {
        const evalRes = this.policyEngine.evaluateCodeExecution(
          opts.language,
          opts.code,
          opts.filename,
          mission.policy
        );
        this.emit(mission, 'policy_evaluated', { evaluation: evalRes });
        if (evalRes.decision === 'BLOCK') {
          throw new Error(`Policy Blocked (${evalRes.ruleId}): ${evalRes.reason}`);
        }

        stepCounter++;
        this.emit(mission, 'tool_dispatched', {
          tool: 'run_sandbox_code',
          target: `${opts.language}:${opts.filename}`,
          stepIndex: stepCounter,
        });
        this.emit(mission, 'code_written', {
          filename: opts.filename,
          language: opts.language,
          content: opts.code,
        });

        const execRes = await this.sandboxClient.execCode(sandboxId, {
          language: opts.language,
          code: opts.code,
          filename: opts.filename,
          timeoutMs: mission.policy.maxTimeoutMs,
          networkMode: mission.policy.networkMode,
          missionId: mission.id,
          stepIndex: stepCounter,
          policyRuleId: evalRes.ruleId,
          prevReceiptHash,
        });

        appendReceipt(execRes.receipt);
        syncArtifacts(execRes.artifacts);
        this.emit(mission, 'terminal_output', {
          filename: opts.filename,
          language: opts.language,
          stdout: execRes.stdout,
          stderr: execRes.stderr,
          exitCode: execRes.exitCode,
          durationMs: execRes.durationMs,
        });

        return {
          stdout: execRes.stdout,
          stderr: execRes.stderr,
          exitCode: execRes.exitCode,
          durationMs: execRes.durationMs,
        };
      };

      const dispatchBrowser = async (opts: {
        action: 'navigate' | 'click' | 'fill' | 'extract_js' | 'screenshot';
        url?: string;
        selector?: string;
        value?: string;
        expression?: string;
      }) => {
        let ruleId = 'POL-BROWSER-ACTION';
        if (opts.action === 'navigate' && opts.url) {
          const evalRes = this.policyEngine.evaluateBrowserTarget(opts.url, mission.policy);
          this.emit(mission, 'policy_evaluated', { evaluation: evalRes });
          ruleId = evalRes.ruleId;
          if (evalRes.decision === 'BLOCK') {
            return {
              exitCode: 13,
              error: `Policy Gate Blocked (${evalRes.ruleId}): ${evalRes.reason}`,
            };
          }
        }

        stepCounter++;
        this.emit(mission, 'tool_dispatched', {
          tool: `browser_${opts.action}`,
          target: opts.url || opts.selector || 'DOM extraction',
          stepIndex: stepCounter,
        });

        const bRes = await this.sandboxClient.execBrowser(sandboxId, {
          action: opts.action,
          url: opts.url,
          selector: opts.selector,
          value: opts.value,
          expression: opts.expression,
          timeoutMs: mission.policy.maxTimeoutMs,
          networkMode: mission.policy.networkMode,
          allowedDomains: mission.policy.allowedDomains,
          blockCloudMetadata: mission.policy.blockCloudMetadata,
          blockPrivateNetworks: mission.policy.blockPrivateNetworks,
          missionId: mission.id,
          stepIndex: stepCounter,
          policyRuleId: ruleId,
          prevReceiptHash,
        });

        appendReceipt(bRes.receipt);
        syncArtifacts(bRes.artifacts);

        if (bRes.snapshot) {
          mission.browserSnapshots.push(bRes.snapshot);
          this.emit(mission, 'browser_snapshot', { snapshot: bRes.snapshot });
        }

        return {
          exitCode: bRes.exitCode,
          error: bRes.error,
          evalResult: bRes.evalResult,
          title: bRes.snapshot?.title,
          url: bRes.snapshot?.url,
          httpStatus: bRes.snapshot?.httpStatus,
          securityHeaders: bRes.snapshot?.securityHeaders,
          textExcerpt: bRes.snapshot?.textExcerpt,
        };
      };

      const readWorkspaceText = async (relativePath: string): Promise<string> => {
        const { buffer } = await this.sandboxClient.readArtifactRaw(sandboxId, relativePath);
        return buffer.toString('utf8');
      };

      const playbookCtx = {
        prompt: mission.prompt,
        templateId: mission.templateId,
        emitThought: (thought: string) => this.emit(mission, 'agent_thought', { thought }),
        setPlan,
        updateStep,
        dispatchBrowser,
        dispatchWriteFile,
        dispatchExecCode,
        readWorkspaceText,
      };

      const activeEndpoint = this.llmClient.resolveActiveEndpoint();
      let summaryMarkdown = '';

      if (customRunner) {
        summaryMarkdown = await customRunner(playbookCtx, mission);
      } else if (activeEndpoint) {
        try {
          summaryMarkdown = await this.runLiveLlmToolLoop({
            mission,
            setPlan,
            updateStep,
            dispatchBrowser,
            dispatchWriteFile,
            dispatchExecCode,
          });
        } catch (llmErr) {
          const errText = llmErr instanceof Error ? llmErr.message : String(llmErr);
          this.emit(mission, 'agent_thought', {
            thought: `External LLM endpoint returned an error (${errText}). Seamlessly engaging Deterministic Autonomous Execution Engine so real sandbox tasks still complete.`,
          });
          mission.llmProviderUsed = 'autonomous-playbook (fallback)';
          summaryMarkdown = await runAutonomousPlaybook(playbookCtx);
        }
      } else {
        summaryMarkdown = await runAutonomousPlaybook(playbookCtx);
      }

      mission.finalSummary = summaryMarkdown;
      mission.status = 'completed';
      mission.completedAt = new Date().toISOString();

      const chainCheck = verifyReceiptChain(mission.receipts);
      this.emit(mission, 'mission_completed', {
        summary: summaryMarkdown,
        receiptCount: mission.receipts.length,
        artifactCount: mission.artifacts.length,
        chainVerified: chainCheck.valid,
        headHash: chainCheck.headHash,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      mission.status = 'failed';
      mission.error = msg;
      mission.completedAt = new Date().toISOString();
      this.emit(mission, 'mission_failed', { error: msg });
    }
  }

  private async runLiveLlmToolLoop(ctx: {
    mission: MissionRecord;
    setPlan: (steps: PlanStep[]) => void;
    updateStep: (stepId: string, status: PlanStep['status'], note?: string) => void;
    dispatchBrowser: (opts: {
      action: 'navigate' | 'click' | 'fill' | 'extract_js' | 'screenshot';
      url?: string;
      selector?: string;
      value?: string;
      expression?: string;
    }) => Promise<Record<string, unknown>>;
    dispatchWriteFile: (relativePath: string, content: string) => Promise<void>;
    dispatchExecCode: (opts: {
      language: 'python' | 'javascript';
      code: string;
      filename: string;
    }) => Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }>;
  }): Promise<string> {
    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: `You are AEGIS // VULTR, a containment-first autonomous engineering and web-operator agent running on a centralized Control Plane that dispatches every action into an isolated Vultr sandbox.
Rules:
1. ALWAYS call set_execution_plan FIRST with 3-5 concrete, verifiable steps.
2. Perform REAL work inside the sandbox: write & run Python 3 (standard library only: json, csv, math, statistics, hashlib, unittest, html, urllib, collections) or JavaScript code, and operate the real Headless Chromium browser (browser_navigate, browser_extract_js) when URLs or live web tasks are involved.
3. Generate visual artifacts inside /workspace whenever helpful (such as clean dark-themed .svg charts, .csv datasets, .html or .md reports).
4. Update plan steps via update_plan_step as you progress. If run_sandbox_code exits non-zero, diagnose stderr, fix the script, and re-run!
5. Call complete_mission at the end with a concise markdown summary grounded strictly in real executed outputs.`,
      },
      {
        role: 'user',
        content: ctx.mission.prompt,
      },
    ];

    const maxTurns = ctx.mission.policy.maxSteps;
    for (let turn = 0; turn < maxTurns; turn++) {
      const resp = await this.llmClient.chatCompletion({
        messages,
        tools: AGENT_TOOLS,
        temperature: 0.2,
      });

      ctx.mission.llmProviderUsed = resp.provider;
      ctx.mission.llmModelUsed = resp.model;

      if (resp.content && resp.content.trim()) {
        this.emit(ctx.mission, 'agent_thought', { thought: resp.content.trim() });
      }

      if (!resp.toolCalls || resp.toolCalls.length === 0) {
        if (resp.content && turn > 0) {
          return resp.content;
        }
        messages.push({
          role: 'assistant',
          content: resp.content || '',
        });
        messages.push({
          role: 'user',
          content:
            'Use the sandbox tools (set_execution_plan, run_sandbox_code, browser_navigate, complete_mission) to execute real verifiable work rather than only chatting.',
        });
        continue;
      }

      messages.push({
        role: 'assistant',
        content: resp.content || null,
        tool_calls: resp.toolCalls,
      });

      for (const tc of resp.toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
        } catch {
          args = {};
        }

        let toolResult: unknown = { ok: true };
        try {
          const name = tc.function.name;
          if (name === 'set_execution_plan') {
            const rawSteps = (args.steps as Array<Record<string, string>>) || [];
            const steps: PlanStep[] = rawSteps.map((s, idx) => ({
              id: s.id || `s${idx + 1}`,
              index: idx + 1,
              title: s.title || `Step ${idx + 1}`,
              description: s.description || '',
              actionType: (s.actionType as PlanStep['actionType']) || 'code',
              status: 'pending',
            }));
            ctx.setPlan(steps);
            toolResult = { status: 'plan_set', stepCount: steps.length };
          } else if (name === 'update_plan_step') {
            ctx.updateStep(
              String(args.stepId || ''),
              (args.status as PlanStep['status']) || 'running',
              args.verificationNote ? String(args.verificationNote) : undefined
            );
            toolResult = { updated: true };
          } else if (name === 'browser_navigate') {
            toolResult = await ctx.dispatchBrowser({
              action: 'navigate',
              url: String(args.url || ''),
            });
          } else if (name === 'browser_extract_js') {
            toolResult = await ctx.dispatchBrowser({
              action: 'extract_js',
              expression: String(args.expression || ''),
            });
          } else if (name === 'write_sandbox_file') {
            await ctx.dispatchWriteFile(
              String(args.relativePath || 'output.txt'),
              String(args.content || '')
            );
            toolResult = { written: args.relativePath };
          } else if (name === 'run_sandbox_code') {
            toolResult = await ctx.dispatchExecCode({
              language: args.language === 'javascript' ? 'javascript' : 'python',
              filename: String(args.filename || 'script.py'),
              code: String(args.code || ''),
            });
          } else if (name === 'complete_mission') {
            for (const st of ctx.mission.plan) {
              if (st.status === 'running' || st.status === 'pending') {
                ctx.updateStep(st.id, 'completed');
              }
            }
            return String(args.summaryMarkdown || 'Mission completed inside isolated sandbox.');
          } else {
            toolResult = { error: `Unknown tool ${name}` };
          }
        } catch (toolErr) {
          toolResult = {
            error: toolErr instanceof Error ? toolErr.message : String(toolErr),
          };
        }

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult).slice(0, 12000),
        });
      }
    }

    return 'Mission step budget reached; inspect verified artifacts and cryptographic receipts in the Workspace Inspector.';
  }
}
