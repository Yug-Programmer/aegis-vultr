import { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Cpu,
  Cloud,
  Lock,
  Globe,
  WifiOff,
  ChevronDown,
  Check,
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

function AegisBrandEmblem() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="aegis-shield-grad" x1="12" y1="2" x2="12" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" stopOpacity="0.28" />
          <stop stopColor="#0B0D10" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Outer Armor Hull */}
      <path
        d="M12 2.2L3.8 6.2V12.2C3.8 17.4 7.3 21.4 12 22.3C16.7 21.4 20.2 17.4 20.2 12.2V6.2L12 2.2Z"
        fill="url(#aegis-shield-grad)"
        stroke="#38BDF8"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Precision Core Lattice */}
      <path
        d="M12 6.8L7 9.4V12.8C7 16 9.1 18.7 12 19.3C14.9 18.7 17 16 17 12.8V9.4L12 6.8Z"
        stroke="#38BDF8"
        strokeWidth="1"
        strokeDasharray="2.5 2"
        opacity="0.65"
      />
      {/* Cryptographic Key Nexus */}
      <circle cx="12" cy="13" r="2.2" fill="#38BDF8" />
      <path
        d="M12 9.2V10.8M12 15.2V16.8M8.2 13H9.8M14.2 13H15.8"
        stroke="#38BDF8"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function TopNav({
  status,
  networkMode,
  onChangeNetworkMode,
  onOpenContainmentAudit,
  onOpenVultrModal,
}: TopNavProps) {
  const [networkMenuOpen, setNetworkMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const workerOnline = Boolean(status?.workerHealth?.ok);
  const tier = status?.workerHealth?.isolationTier || 'connecting...';
  const region = status?.workerHealth?.region || 'local';
  const activeEngine = status?.llm.activeMode || 'loading';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setNetworkMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const networkOptions: {
    mode: NetworkPolicyMode;
    label: string;
    desc: string;
    icon: typeof Globe;
    color: string;
  }[] = [
    {
      mode: 'standard',
      label: 'SSRF-Guarded',
      desc: 'HTTP/HTTPS allowed; Cloud metadata & private LAN blocked',
      icon: Globe,
      color: 'text-[#38BDF8]',
    },
    {
      mode: 'strict_allowlist',
      label: 'Strict Allowlist',
      desc: 'Only approved control plane domains accessible',
      icon: Lock,
      color: 'text-[#FBBF24]',
    },
    {
      mode: 'airgapped',
      label: 'Airgapped',
      desc: 'Zero outbound networking or browser connections',
      icon: WifiOff,
      color: 'text-[#F87171]',
    },
  ];

  const currentOption =
    networkOptions.find((o) => o.mode === networkMode) || networkOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <header className="h-12 border-b border-[#1E232B] bg-[#0B0D10] px-4 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Brand & Refined Operational Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 select-none">
          <AegisBrandEmblem />
          <div className="flex items-center tracking-tight">
            <span className="font-bold text-[13px] tracking-[0.08em] text-[#F4F4F5]">
              AEGIS
            </span>
            <span className="text-[#38BDF8] text-xs font-mono font-medium mx-1.5 opacity-80">
              //
            </span>
            <span className="font-semibold text-[13px] tracking-[0.08em] text-[#D4D4D8]">
              VULTR
            </span>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div
          className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-[#1E232B]"
          title={`Isolation: ${tier} (${status?.sandboxWorkerUrl || 'local'})`}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#111419] border border-[#1E232B] text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                workerOnline
                  ? 'bg-[#34D399] shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                  : 'bg-[#F87171]'
              }`}
            />
            <span className="text-[#A1A1AA] font-medium">
              {workerOnline ? 'Isolated Sandbox' : 'Connecting...'}
            </span>
            <span className="text-[#3F3F46]">·</span>
            <span className="font-mono text-[10px] text-[#38BDF8] uppercase font-semibold">
              {region}
            </span>
          </div>
        </div>
      </div>

      {/* Clean, Frameless Action Controls */}
      <div className="flex items-center gap-1">
        {/* Network Policy Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setNetworkMenuOpen(!networkMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#15181E] cursor-pointer transition"
            title="Egress Network Policy Mode"
          >
            <CurrentIcon className={`w-3.5 h-3.5 ${currentOption.color}`} />
            <span className="text-[12px]">{currentOption.label}</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {networkMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 rounded-lg bg-[#111419] border border-[#242830] shadow-2xl py-1 z-30 divide-y divide-[#1E232B]">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#6B7280]">
                Egress Network Policy
              </div>
              <div className="py-1">
                {networkOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = networkMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => {
                        onChangeNetworkMode(opt.mode);
                        setNetworkMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-[#15181E] cursor-pointer transition ${
                        active ? 'bg-[#15181E]/60' : ''
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${opt.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#F4F4F5] flex items-center justify-between">
                          <span>{opt.label}</span>
                          {active && <Check className="w-3.5 h-3.5 text-[#38BDF8]" />}
                        </div>
                        <div className="text-[11px] text-[#6B7280] leading-snug mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Engine Config Ghost Button */}
        <button
          onClick={onOpenVultrModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#15181E] cursor-pointer transition"
          title="Configure Planner Engine"
        >
          <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-[12px]">
            {activeEngine === 'vultr'
              ? 'Vultr Inference'
              : activeEngine === 'autonomous-playbook'
                ? 'Autonomous Engine'
                : activeEngine.toUpperCase()}
          </span>
        </button>

        {/* Self-Test Ghost Button */}
        <button
          onClick={onOpenContainmentAudit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#15181E] cursor-pointer transition"
          title="Run 4 live adversarial containment probes"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#34D399]" />
          <span className="hidden sm:inline text-[12px]">Self-Test</span>
        </button>

        {/* Settings Ghost Button */}
        <button
          onClick={onOpenVultrModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#15181E] cursor-pointer transition"
          title="Vultr Cloud Settings & Infrastructure"
        >
          <Cloud className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="hidden sm:inline text-[12px]">Vultr Cloud</span>
        </button>
      </div>
    </header>
  );
}
