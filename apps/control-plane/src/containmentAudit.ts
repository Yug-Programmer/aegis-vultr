import crypto from 'node:crypto';
import {
  GENESIS_RECEIPT_HASH,
  verifyReceiptChain,
  type ContainmentAuditReport,
  type ContainmentProbeResult,
  type ExecutionReceipt,
} from '@aegis/shared';
import type { SandboxClient } from './sandboxClient.js';
import { DEFAULT_CONTAINMENT_POLICY, type PolicyEngine } from './policyEngine.js';

export async function runLiveContainmentAudit(
  sandboxClient: SandboxClient,
  policyEngine: PolicyEngine
): Promise<ContainmentAuditReport> {
  const auditId = `audit_${crypto.randomBytes(5).toString('hex')}`;
  const { sandboxId, isolationTier } = await sandboxClient.createSandbox();
  const receipts: ExecutionReceipt[] = [];
  const probes: ContainmentProbeResult[] = [];
  let prevHash = GENESIS_RECEIPT_HASH;

  try {
    // PROBE 1: Host Environment & API Key Exfiltration Probe
    const p1Start = Date.now();
    const envProbeScript = `
import json, os

sensitive_prefixes = ("VULTR_", "OPENAI_", "GEMINI_", "ANTHROPIC_", "SANDBOX_SHARED", "AWS_", "SECRET", "TOKEN")
leaked = [k for k in os.environ.keys() if any(p in k.upper() for p in sensitive_prefixes)]
print(json.dumps({
    "visible_env_keys": sorted(list(os.environ.keys())),
    "leaked_secrets": leaked,
    "sandbox_flag": os.environ.get("AEGIS_SANDBOX")
}))
`;
    const p1Res = await sandboxClient.execCode(sandboxId, {
      language: 'python',
      code: envProbeScript,
      filename: 'probe_env_secrets.py',
      timeoutMs: 8000,
      networkMode: 'standard',
      missionId: auditId,
      stepIndex: 1,
      policyRuleId: 'AUDIT-ENV-01',
      prevReceiptHash: prevHash,
    });
    receipts.push(p1Res.receipt);
    prevHash = p1Res.receipt.receiptHash;

    let leakedCount = 0;
    let visibleKeys: string[] = [];
    try {
      const parsed = JSON.parse(p1Res.stdout.trim()) as {
        leaked_secrets: string[];
        visible_env_keys: string[];
      };
      leakedCount = parsed.leaked_secrets.length;
      visibleKeys = parsed.visible_env_keys;
    } catch {
      leakedCount = -1;
    }

    probes.push({
      id: 'probe-env-isolation',
      name: 'Control-Plane Secret & Credential Isolation',
      vector: 'Environment Variable Exfiltration',
      attackDescription:
        'Executes Python inside sandbox scanning os.environ for VULTR_API_KEY, VULTR_INFERENCE_API_KEY, LLM keys, and RPC HMAC secrets.',
      contained: p1Res.exitCode === 0 && leakedCount === 0,
      enforcedBy: 'Zero-Secret Sanitized Process Environment',
      evidence:
        leakedCount === 0
          ? `0 host credentials present. Visible keys strictly limited to [${visibleKeys.join(', ')}].`
          : `Unexpected env scan result: ${p1Res.stdout || p1Res.stderr}`,
      durationMs: Date.now() - p1Start,
      receipt: p1Res.receipt,
    });

    // PROBE 2: Vultr Cloud Instance Metadata SSRF (169.254.169.254)
    const p2Start = Date.now();
    const policyEval = policyEngine.evaluateBrowserTarget(
      'http://169.254.169.254/v1.json',
      DEFAULT_CONTAINMENT_POLICY
    );
    const ssrfScript = `
import socket
try:
    s = socket.create_connection(("169.254.169.254", 80), timeout=2.0)
    print("BREACH: Connected to metadata IP")
except PermissionError as e:
    print("BLOCKED_BY_RUNTIME:", str(e))
except Exception as e:
    print("BLOCKED_BY_NET:", type(e).__name__, str(e))
`;
    const p2Res = await sandboxClient.execCode(sandboxId, {
      language: 'python',
      code: ssrfScript,
      filename: 'probe_vultr_metadata_ssrf.py',
      timeoutMs: 6000,
      networkMode: 'standard',
      missionId: auditId,
      stepIndex: 2,
      policyRuleId: policyEval.ruleId,
      prevReceiptHash: prevHash,
    });
    receipts.push(p2Res.receipt);
    prevHash = p2Res.receipt.receiptHash;

    const p2Blocked =
      policyEval.decision === 'BLOCK' &&
      !p2Res.stdout.includes('BREACH:') &&
      (p2Res.stdout.includes('BLOCKED_BY_') || p2Res.exitCode !== 0);

    probes.push({
      id: 'probe-metadata-ssrf',
      name: 'Vultr Cloud Metadata SSRF Defense (169.254.169.254)',
      vector: 'Cloud Instance Metadata Exfiltration',
      attackDescription:
        'Targets http://169.254.169.254/v1.json via both Control-Plane Policy Gate and raw TCP socket inside sandbox.',
      contained: p2Blocked,
      enforcedBy: `Dual-Layer: Policy Gate (${policyEval.ruleId}) + Runtime Socket Audit Hook / Docker Firewall`,
      evidence: `Policy verdict=${policyEval.decision}; Sandbox socket output="${p2Res.stdout.trim()}"`,
      durationMs: Date.now() - p2Start,
      receipt: p2Res.receipt,
    });

    // PROBE 3: Filesystem Path Traversal Escape
    const p3Start = Date.now();
    const pathPolicyEval = policyEngine.evaluateFilePath('write_sandbox_file', '../../.env');
    const fsEscapeScript = `
results = []
for target in ["../../.env", "/etc/shadow", "C:\\\\Users\\\\Public\\\\escape_test.txt"]:
    try:
        with open(target, "w") as f:
            f.write("escape")
        results.append(f"BREACH:{target}")
    except Exception as e:
        results.append(f"DENIED:{target}->{type(e).__name__}")
print(" | ".join(results))
`;
    const p3Res = await sandboxClient.execCode(sandboxId, {
      language: 'python',
      code: fsEscapeScript,
      filename: 'probe_fs_escape.py',
      timeoutMs: 6000,
      networkMode: 'standard',
      missionId: auditId,
      stepIndex: 3,
      policyRuleId: pathPolicyEval.ruleId,
      prevReceiptHash: prevHash,
    });
    receipts.push(p3Res.receipt);
    prevHash = p3Res.receipt.receiptHash;

    const p3Contained =
      pathPolicyEval.decision === 'BLOCK' &&
      !p3Res.stdout.includes('BREACH:') &&
      p3Res.stdout.includes('DENIED:');

    probes.push({
      id: 'probe-fs-traversal',
      name: 'Host Filesystem Traversal & Write Confinement',
      vector: 'Directory Traversal (../../.env & Host Root)',
      attackDescription:
        'Attempts RPC path traversal and direct Python file writes outside /workspace.',
      contained: p3Contained,
      enforcedBy: `Workspace Path Confinement (${pathPolicyEval.ruleId}) + Read-Only Rootfs / Audit Hook`,
      evidence: `RPC Gate=${pathPolicyEval.decision}; Runtime="${p3Res.stdout.trim()}"`,
      durationMs: Date.now() - p3Start,
      receipt: p3Res.receipt,
    });

    // PROBE 4: Runaway CPU Infinite Loop / DoS Containment
    const p4Start = Date.now();
    const cpuBombScript = `
import time
print("Starting runaway busy loop...")
while True:
    _ = sum(i * i for i in range(10000))
`;
    const p4Res = await sandboxClient.execCode(sandboxId, {
      language: 'python',
      code: cpuBombScript,
      filename: 'probe_cpu_runaway.py',
      timeoutMs: 1400,
      networkMode: 'airgapped',
      missionId: auditId,
      stepIndex: 4,
      policyRuleId: 'AUDIT-WATCHDOG-04',
      prevReceiptHash: prevHash,
    });
    receipts.push(p4Res.receipt);

    const p4Contained = p4Res.timedOut && p4Res.exitCode === 124;

    probes.push({
      id: 'probe-resource-watchdog',
      name: 'Runaway Process Tree & Timeout Reaper',
      vector: 'CPU Exhaustion / Infinite Busy-Loop',
      attackDescription:
        'Launches an unbounded CPU spin loop under a strict 1,400ms supervisor deadline.',
      contained: p4Contained,
      enforcedBy: 'Sandbox Supervisor Process-Tree Watchdog (exitCode=124)',
      evidence: `Terminated cleanly in ${p4Res.durationMs}ms. ${p4Res.stderr.split('\n').pop() || ''}`,
      durationMs: Date.now() - p4Start,
      receipt: p4Res.receipt,
    });

    const chainCheck = verifyReceiptChain(receipts);

    return {
      auditId,
      timestamp: new Date().toISOString(),
      sandboxId,
      isolationTier,
      allContained: probes.every((p) => p.contained) && chainCheck.valid,
      probes,
      chainVerified: chainCheck.valid,
    };
  } finally {
    await sandboxClient.destroySandbox(sandboxId);
  }
}
