import { useEffect, useState } from 'react';
import { X, Cloud, Server, KeyRound, PlusCircle, Check, Loader2, Copy } from 'lucide-react';
import {
  fetchVultrOverview,
  provisionVultrSandboxNode,
  saveRuntimeSettings,
  type SystemStatusResponse,
  type VultrOverviewResponse,
} from '../api';

interface VultrInfraModalProps {
  open: boolean;
  onClose: () => void;
  status: SystemStatusResponse | null;
  onRefreshStatus: () => Promise<void>;
}

export function VultrInfraModal({
  open,
  onClose,
  status,
  onRefreshStatus,
}: VultrInfraModalProps) {
  const [overview, setOverview] = useState<VultrOverviewResponse | null>(null);
  const [preferredProvider, setPreferredProvider] = useState(
    status?.llm.preferredProvider || 'auto'
  );
  const [vultrInferenceKey, setVultrInferenceKey] = useState('');
  const [vultrModel, setVultrModel] = useState(
    status?.llm.vultrInferenceModel || 'kimi-k2-instruct'
  );
  const [vultrApiKey, setVultrApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [workerUrl, setWorkerUrl] = useState(status?.sandboxWorkerUrl || 'http://127.0.0.1:4100');

  const [region, setRegion] = useState('ewr');
  const [plan, setPlan] = useState('vc2-2c-4gb');
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState('');
  const [copiedInit, setCopiedInit] = useState(false);

  useEffect(() => {
    if (open) {
      setWorkerUrl(status?.sandboxWorkerUrl || 'http://127.0.0.1:4100');
      setVultrModel(status?.llm.vultrInferenceModel || 'kimi-k2-instruct');
      setPreferredProvider(status?.llm.preferredProvider || 'auto');
      fetchVultrOverview()
        .then(setOverview)
        .catch(() => {});
    }
  }, [open, status]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        preferredProvider,
        vultrInferenceModel: vultrModel,
        sandboxWorkerUrl: workerUrl,
      };
      if (vultrInferenceKey.trim()) payload.vultrInferenceApiKey = vultrInferenceKey.trim();
      if (vultrApiKey.trim()) payload.vultrApiKey = vultrApiKey.trim();
      if (geminiApiKey.trim()) payload.geminiApiKey = geminiApiKey.trim();
      if (openaiApiKey.trim()) payload.openaiApiKey = openaiApiKey.trim();

      await saveRuntimeSettings(payload);
      await onRefreshStatus();
      const updated = await fetchVultrOverview();
      setOverview(updated);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleProvision = async () => {
    setProvisioning(true);
    setProvisionMsg('');
    try {
      const res = await provisionVultrSandboxNode({ region, plan });
      setProvisionMsg(
        `Provisioned Vultr VM ${res.instance.label} (${res.instance.id}) in ${res.instance.region}. Once Cloud-Init finishes (~90s), set Sandbox Worker URL to http://${res.instance.mainIp || '<instance-ip>'}:4100`
      );
      const updated = await fetchVultrOverview();
      setOverview(updated);
    } catch (err) {
      setProvisionMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700/90 bg-[#080d19] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Vultr Infrastructure, Serverless Inference &amp; Sandbox Worker Control
              </h3>
              <p className="text-[11px] text-slate-400">
                Credentials stay strictly inside Control Plane memory — never injected into sandboxes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Runtime Keys & Endpoint Form */}
          <form onSubmit={handleSave} className="space-y-3.5 rounded-xl border border-slate-800 bg-[#0b1120] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                Control Plane Inference &amp; Sandbox RPC Endpoints
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                Airgapped from Sandbox Env
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Planner Engine Mode
                </label>
                <select
                  value={preferredProvider}
                  onChange={(e) => setPreferredProvider(e.target.value)}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-200"
                >
                  <option value="auto">Auto (Vultr Inference → Gemini → OpenAI → Playbook)</option>
                  <option value="vultr">Vultr Serverless Inference (api.vultrinference.com)</option>
                  <option value="gemini">Google Gemini API</option>
                  <option value="openai">OpenAI API</option>
                  <option value="playbook">Deterministic Autonomous Engine (No Key Needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Vultr Serverless Inference Model
                </label>
                <input
                  type="text"
                  list="vultr-models"
                  value={vultrModel}
                  onChange={(e) => setVultrModel(e.target.value)}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-200"
                />
                <datalist id="vultr-models">
                  {(overview?.inferenceModels.models || ['kimi-k2-instruct']).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  VULTR_INFERENCE_API_KEY{' '}
                  {status?.llm.vultrInferenceConfigured && (
                    <span className="text-emerald-400">(Configured ✓)</span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder="Enter Vultr Serverless Inference key..."
                  value={vultrInferenceKey}
                  onChange={(e) => setVultrInferenceKey(e.target.value)}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  VULTR_API_KEY (Cloud Compute v2){' '}
                  {status?.vultrCloud.configured && (
                    <span className="text-emerald-400">(Configured ✓)</span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder="Enter Vultr API v2 key for VM provisioning..."
                  value={vultrApiKey}
                  onChange={(e) => setVultrApiKey(e.target.value)}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Optional GEMINI_API_KEY / OPENAI_API_KEY
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="password"
                    placeholder="Gemini key"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 font-mono text-slate-200"
                  />
                  <input
                    type="password"
                    placeholder="OpenAI key"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 font-mono text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Active Sandbox Worker RPC URL
                </label>
                <input
                  type="text"
                  value={workerUrl}
                  onChange={(e) => setWorkerUrl(e.target.value)}
                  placeholder="http://127.0.0.1:4100 or http://<vultr-vm-ip>:4100"
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-sky-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {savedToast && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Applied live
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer transition"
              >
                {saving ? 'Saving...' : 'Apply Configuration'}
              </button>
            </div>
          </form>

          {/* Vultr Cloud Compute Sandbox Auto-Provisioner */}
          <div className="rounded-xl border border-slate-800 bg-[#0b1120] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                One-Click Vultr Cloud Compute Sandbox Provisioner (Ubuntu 24.04 + Docker + gVisor)
              </div>
              <span className="text-[10px] font-mono text-slate-400">POST /v2/instances</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="rounded-md bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-200"
              >
                <option value="ewr">ewr — New Jersey (US East)</option>
                <option value="ord">ord — Chicago (US Central)</option>
                <option value="sea">sea — Seattle (US West)</option>
                <option value="fra">fra — Frankfurt (EU)</option>
                <option value="blr">blr — Bangalore (India)</option>
                <option value="nrt">nrt — Tokyo (APAC)</option>
              </select>

              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="rounded-md bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-200"
              >
                <option value="vc2-2c-4gb">vc2-2c-4gb (2 vCPU / 4 GB RAM)</option>
                <option value="vc2-4c-8gb">vc2-4c-8gb (4 vCPU / 8 GB RAM)</option>
                <option value="vhp-2c-4gb-amd">vhp-2c-4gb-amd (High Perf EPYC)</option>
              </select>

              <button
                type="button"
                onClick={handleProvision}
                disabled={provisioning}
                className="rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-medium px-3 py-1.5 flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                {provisioning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                <span>Provision Vultr Sandbox VM</span>
              </button>
            </div>

            {provisionMsg && (
              <div className="rounded-md bg-slate-950 border border-slate-800 p-2.5 text-[11px] font-mono text-sky-300">
                {provisionMsg}
              </div>
            )}

            {overview && overview.instances.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-slate-400 font-medium">
                  Active Vultr Account Instances:
                </div>
                {overview.instances.map((inst) => (
                  <div
                    key={inst.id}
                    className="rounded-md bg-slate-950 border border-slate-800 px-3 py-2 flex items-center justify-between text-[11px] font-mono"
                  >
                    <div>
                      <span className="text-white font-semibold">{inst.label}</span>{' '}
                      <span className="text-slate-400">
                        ({inst.region} • {inst.plan} • {inst.mainIp})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkerUrl(`http://${inst.mainIp}:4100`)}
                      className="text-sky-400 hover:underline cursor-pointer"
                    >
                      Use Worker IP →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Cloud-Init Preview */}
            {overview?.sampleCloudInit && (
              <details className="rounded-lg border border-slate-800 bg-slate-950/90">
                <summary className="px-3 py-2 text-[11px] font-mono text-slate-300 cursor-pointer flex items-center justify-between">
                  <span>Inspect Hardened Vultr Cloud-Init Bootstrap (Docker + gVisor + 169.254.169.254 Drop)</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      void navigator.clipboard.writeText(overview.sampleCloudInit);
                      setCopiedInit(true);
                      setTimeout(() => setCopiedInit(false), 1800);
                    }}
                    className="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedInit ? 'Copied' : 'Copy YAML'}</span>
                  </button>
                </summary>
                <pre className="p-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 overflow-x-auto max-h-48">
                  {overview.sampleCloudInit}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
