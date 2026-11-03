import { useState } from 'react';
import { Fingerprint, ShieldCheck, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';
import type { ChainVerificationResult, ExecutionReceipt } from '@aegis/shared';
import { verifyMissionReceipts } from '../api';

interface ReceiptChainPanelProps {
  missionId?: string;
  receipts: ExecutionReceipt[];
}

export function ReceiptChainPanel({ missionId, receipts }: ReceiptChainPanelProps) {
  const [verification, setVerification] = useState<ChainVerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!missionId) return;
    setVerifying(true);
    try {
      const res = await verifyMissionReceipts(missionId);
      setVerification(res);
    } finally {
      setVerifying(false);
    }
  };

  if (!missionId || receipts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500">
        <Fingerprint className="w-8 h-8 text-slate-700 mb-2" />
        <p className="font-medium text-slate-400 mb-1">No Signed Receipts Yet</p>
        <p className="max-w-xs leading-relaxed">
          Every sandbox file write, code execution, and browser action is signed by the Sandbox
          Worker&apos;s Ed25519 private key and chained via SHA-256 hashes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
      <div className="rounded-xl border border-purple-500/30 bg-purple-950/15 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Ed25519 Execution Audit Chain
          </div>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-2.5 py-1 rounded-md bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/40 text-purple-200 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer transition"
          >
            <RefreshCw className={`w-3 h-3 ${verifying ? 'animate-spin' : ''}`} />
            <span>Verify Signatures</span>
          </button>
        </div>

        {verification && (
          <div
            className={`rounded-lg p-2.5 border text-[11px] font-mono ${
              verification.valid
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              {verification.valid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    VERIFIED: {verification.verifiedCount}/{verification.totalReceipts} Ed25519
                    Signatures &amp; Hash Links Intact
                  </span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>TAMPER DETECTED: {verification.reason}</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Head Hash: {verification.headHash}
            </div>
          </div>
        )}
      </div>

      {/* Receipt Cards */}
      <div className="space-y-2">
        {receipts.map((r) => (
          <div
            key={r.receiptId}
            className="rounded-lg border border-slate-800 bg-[#0b101d] p-2.5 text-[11px] font-mono space-y-1.5"
          >
            <div className="flex items-center justify-between text-slate-200">
              <span className="font-semibold text-sky-300">
                #{r.stepIndex} {r.action}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  r.exitCode === 0
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                exit {r.exitCode} • {r.durationMs}ms
              </span>
            </div>
            <div className="grid grid-cols-1 gap-0.5 text-[10px] text-slate-400">
              <div className="truncate">
                <span className="text-slate-500">tier:</span> {r.isolationTier} ({r.workerNode.region})
              </div>
              <div className="truncate">
                <span className="text-slate-500">prev:</span> {r.prevReceiptHash.slice(0, 28)}...
              </div>
              <div className="truncate">
                <span className="text-slate-500">hash:</span>{' '}
                <span className="text-slate-300">{r.receiptHash.slice(0, 28)}...</span>
              </div>
              <div className="truncate">
                <span className="text-slate-500">in/out:</span> {r.inputSha256.slice(0, 12)}... /{' '}
                {r.stdoutSha256.slice(0, 12)}...
              </div>
              <div className="truncate text-purple-300/90">
                <span className="text-slate-500">ed25519:</span> {r.signature.slice(0, 36)}...
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
