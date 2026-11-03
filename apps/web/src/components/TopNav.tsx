import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Cloud,
  Lock,
  Globe,
  WifiOff,
  Sliders,
} from 'lucide-react';
import type { NetworkPolicyMode } from '@aegis/shared';
import type { SystemStatusResponse } from '../api';

interface TopNavProps {
  status: SystemStatusResponse | null;
  networkMode: NetworkPolicyMode;
  onChangeNetworkMode: (mode: NetworkPolicyMode) => void;
  onOpenContainmentAudit: () => void;
  onOpenVultrModal: () => void;
}

export function TopNav({
  status,
  networkMode,
  onChangeNetworkMode,
  onOpenContainmentAudit,
  onOpenVultrModal,
}: TopNavProps) {
  const workerOnline = Boolean(status?.workerHealth?.ok);
  const tier = status?.workerHealth?.isolationTier || 'connecting...';
  const region = status?.workerHealth?.region || 'local';
  const activeEngine = status?.llm.activeMode || 'loading';
  const activeModel = status?.llm.activeModel || '';

  return (
    <header className="h-14 border-b border-slate-800/90 bg-[#080c17]/95 backdrop-blur px-4 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/25 to-emerald-500/20 border border-sky-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.18)]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-sm text-white">
              AEGIS <span className="text-sky-400 font-mono">//</span> VULTR
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Containment-First
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Centralized Agent Control Layer &amp; Cryptographically Verified Sandbox Runtime
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap justify-end">
        {/* Sandbox Node Pill */}
        <div
          className={`hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono ${
            workerOnline
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-200'
              : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
          }`}
          title={`Sandbox Worker: ${status?.sandboxWorkerUrl || ''}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              workerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span>{tier}</span>
          <span className="text-slate-500">|</span>
          <span className="text-sky-400">{region}</span>
        </div>

        {/* Active Planner / LLM Pill */}
        <button
          onClick={onOpenVultrModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs transition cursor-pointer"
          title="Configure Vultr Serverless Inference or Cloud Compute"
        >
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-300 font-medium">
            {activeEngine === 'vultr'
              ? 'Vultr Inference'
              : activeEngine === 'autonomous-playbook'
                ? 'Autonomous Engine'
                : activeEngine.toUpperCase()}
          </span>
          <span className="text-[11px] font-mono text-slate-400 max-w-[140px] truncate">
            ({activeModel})
          </span>
        </button>

        {/* Egress Policy Mode Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-md p-0.5 text-xs">
          <button
            onClick={() => onChangeNetworkMode('standard')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer ${
              networkMode === 'standard'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Outbound HTTP/HTTPS permitted; Cloud Metadata (169.254.169.254) & Private LAN SSRF blocked"
          >
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">SSRF-Guarded</span>
          </button>
          <button
            onClick={() => onChangeNetworkMode('strict_allowlist')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer ${
              networkMode === 'strict_allowlist'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Only approved domains on the Control Plane allowlist can be contacted"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">Allowlist</span>
          </button>
          <button
            onClick={() => onChangeNetworkMode('airgapped')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer ${
              networkMode === 'airgapped'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Zero outbound sockets or browser navigation allowed (--network=none / socket audit block)"
          >
            <WifiOff className="w-3 h-3" />
            <span className="hidden sm:inline">Airgapped</span>
          </button>
        </div>

        {/* Red-Team Containment Self-Test */}
        <button
          onClick={onOpenContainmentAudit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Containment Self-Test</span>
        </button>

        {/* Vultr Cloud & Inference Drawer */}
        <button
          onClick={onOpenVultrModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-medium transition cursor-pointer"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Vultr Cloud</span>
          <Sliders className="w-3 h-3 opacity-75" />
        </button>
      </div>
    </header>
  );
}
