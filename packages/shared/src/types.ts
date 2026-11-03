export type NetworkPolicyMode = 'standard' | 'strict_allowlist' | 'airgapped';

export type IsolationTier =
  | 'vultr-docker-gvisor'
  | 'vultr-docker-hardened'
  | 'isolated-ephemeral-sandbox';

export interface ContainmentPolicy {
  networkMode: NetworkPolicyMode;
  allowedDomains: string[];
  blockCloudMetadata: boolean;
  blockPrivateNetworks: boolean;
  maxTimeoutMs: number;
  maxMemoryMb: number;
  maxSteps: number;
  maxArtifactBytes: number;
}

export type PlanStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'healed'
  | 'blocked'
  | 'failed';

export interface PlanStep {
  id: string;
  index: number;
  title: string;
  description: string;
  actionType: 'code' | 'browser' | 'filesystem' | 'verify' | 'synthesis';
  status: PlanStepStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  verificationNote?: string;
}

export type PolicyDecisionType = 'ALLOW' | 'BLOCK' | 'SANITIZE';

export interface PolicyEvaluation {
  id: string;
  timestamp: string;
  toolName: string;
  decision: PolicyDecisionType;
  ruleId: string;
  reason: string;
  inspectedTarget: string;
}

export interface ArtifactMeta {
  name: string;
  relativePath: string;
  sizeBytes: number;
  sha256: string;
  mimeType: string;
  createdAt: string;
}

export interface BrowserInteractiveElement {
  ref: number;
  tag: string;
  text: string;
  href?: string;
  selector: string;
}

export interface BrowserSnapshot {
  frameId: string;
  timestamp: string;
  url: string;
  title: string;
  httpStatus: number;
  loadTimeMs: number;
  screenshotArtifact: string;
  screenshotSha256: string;
  textExcerpt: string;
  elements: BrowserInteractiveElement[];
  securityHeaders: Record<string, string>;
  blockedRequests: string[];
}

export interface ExecutionReceiptPayload {
  receiptId: string;
  missionId: string;
  sandboxId: string;
  stepIndex: number;
  timestamp: string;
  action: string;
  isolationTier: IsolationTier;
  workerNode: {
    label: string;
    region: string;
    arch: string;
    platform: string;
  };
  inputSha256: string;
  stdoutSha256: string;
  stderrSha256: string;
  artifactHashes: Record<string, string>;
  exitCode: number;
  durationMs: number;
  policyRuleId: string;
  prevReceiptHash: string;
}

export interface ExecutionReceipt extends ExecutionReceiptPayload {
  receiptHash: string;
  signature: string;
  signerPublicKeyPem: string;
}

export type MissionEventType =
  | 'mission_started'
  | 'plan_updated'
  | 'agent_thought'
  | 'policy_evaluated'
  | 'tool_dispatched'
  | 'code_written'
  | 'terminal_output'
  | 'browser_snapshot'
  | 'artifact_created'
  | 'receipt_signed'
  | 'mission_completed'
  | 'mission_failed';

export interface MissionEvent {
  id: string;
  missionId: string;
  timestamp: string;
  type: MissionEventType;
  data: Record<string, unknown>;
}

export type MissionStatus = 'planning' | 'executing' | 'completed' | 'failed';

export interface MissionRecord {
  id: string;
  prompt: string;
  templateId?: string;
  status: MissionStatus;
  createdAt: string;
  completedAt?: string;
  sandboxId?: string;
  llmProviderUsed: string;
  llmModelUsed: string;
  policy: ContainmentPolicy;
  plan: PlanStep[];
  events: MissionEvent[];
  artifacts: ArtifactMeta[];
  browserSnapshots: BrowserSnapshot[];
  receipts: ExecutionReceipt[];
  finalSummary?: string;
  error?: string;
}

export interface SandboxWorkerHealth {
  ok: boolean;
  workerLabel: string;
  region: string;
  platform: string;
  arch: string;
  isolationTier: IsolationTier;
  dockerAvailable: boolean;
  gvisorAvailable: boolean;
  browserAvailable: boolean;
  pythonVersion: string;
  nodeVersion: string;
  activeSandboxes: number;
  publicKeyPem: string;
  uptimeSec: number;
}

export interface ExecCodeRequest {
  language: 'python' | 'javascript' | 'bash';
  code: string;
  filename?: string;
  args?: string[];
  timeoutMs: number;
  networkMode: NetworkPolicyMode;
  missionId: string;
  stepIndex: number;
  policyRuleId: string;
  prevReceiptHash: string;
}

export interface ExecCodeResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  writtenFile?: string;
  artifacts: ArtifactMeta[];
  receipt: ExecutionReceipt;
}

export interface BrowserActionRequest {
  action: 'navigate' | 'click' | 'fill' | 'extract_js' | 'screenshot';
  url?: string;
  selector?: string;
  value?: string;
  expression?: string;
  timeoutMs: number;
  networkMode: NetworkPolicyMode;
  allowedDomains: string[];
  blockCloudMetadata: boolean;
  blockPrivateNetworks: boolean;
  missionId: string;
  stepIndex: number;
  policyRuleId: string;
  prevReceiptHash: string;
}

export interface BrowserActionResponse {
  snapshot?: BrowserSnapshot;
  evalResult?: unknown;
  error?: string;
  exitCode: number;
  durationMs: number;
  artifacts: ArtifactMeta[];
  receipt: ExecutionReceipt;
}

export interface ContainmentProbeResult {
  id: string;
  name: string;
  vector: string;
  attackDescription: string;
  contained: boolean;
  enforcedBy: string;
  evidence: string;
  durationMs: number;
  receipt?: ExecutionReceipt;
}

export interface ContainmentAuditReport {
  auditId: string;
  timestamp: string;
  sandboxId: string;
  isolationTier: IsolationTier;
  allContained: boolean;
  probes: ContainmentProbeResult[];
  chainVerified: boolean;
}
