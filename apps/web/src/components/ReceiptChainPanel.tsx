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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[#6B7280]">
        <Fingerprint className="w-8 h-8 text-[#242830] mb-2" />
        <p className="font-medium text-[#9CA3AF] mb-1">No Signed Receipts Yet</p>
        <p className="max-w-xs leading-relaxed text-[#6B7280]">
          Every sandbox file write, code execution, and browser interaction is signed by the Sandbox
          Worker&apos;s Ed25519 private key and chained via SHA-256 hashes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Verification Header Strip */}
      <div className="rounded-lg border border-[#242830] bg-[#111419] p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-[#F4F4F5] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
            <span>Ed25519 Cryptographic Audit Chain</span>
          </div>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-2.5 py-1 rounded bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-[#38BDF8] text-[11px] font-mono flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${verifying ? 'animate-spin' : ''}`} />
            <span>Verify Chain</span>
          </button>
        </div>

        {verification && (
          <div
            className={`rounded p-2.5 border text-[11px] font-mono ${
              verification.valid
                ? 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]'
                : 'bg-[#F87171]/10 border-[#F87171]/30 text-[#F87171]'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              {verification.valid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>
                    VERIFIED: {verification.verifiedCount}/{verification.totalReceipts} Ed25519
                    Signatures Intact
                  </span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-3.5 h-3.5 text-[#F87171]" />
                  <span>TAMPER DETECTED: {verification.reason}</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-[#9CA3AF] truncate">
              Head Hash: {verification.headHash}
            </div>
          </div>
        )}
      </div>

      {/* Receipts List */}
      <div className="space-y-2">
        {receipts.map((r) => (
          <div
            key={r.receiptId}
            className="rounded-lg border border-[#242830] bg-[#111419] p-3 text-[11px] font-mono space-y-1.5"
          >
            <div className="flex items-center justify-between text-[#F4F4F5]">
              <span className="font-semibold text-[#38BDF8]">
                #{r.stepIndex} {r.action}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] ${
                  r.exitCode === 0
                    ? 'bg-[#34D399]/15 text-[#34D399]'
                    : 'bg-[#FBBF24]/15 text-[#FBBF24]'
                }`}
              >
                exit {r.exitCode} · {r.durationMs}ms
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1 text-[10px] text-[#9CA3AF]">
              <div className="truncate">
                <span className="text-[#6B7280]">Tier:</span> {r.isolationTier} ({r.workerNode.region})
              </div>
              <div className="truncate">
                <span className="text-[#6B7280]">Prev:</span> {r.prevReceiptHash.slice(0, 24)}...
              </div>
              <div className="truncate">
                <span className="text-[#6B7280]">Hash:</span>{' '}
                <span className="text-[#F4F4F5]">{r.receiptHash.slice(0, 24)}...</span>
              </div>
              <div className="truncate text-[#9CA3AF]">
                <span className="text-[#6B7280]">Sig (Ed25519):</span> {r.signature.slice(0, 32)}...
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
