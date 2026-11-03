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
        `Provisioned Vultr VM ${res.instance.label} (${res.instance.id}) in ${res.instance.region}. Once Cloud-Init completes (~90s), configure Sandbox Worker URL to http://${res.instance.mainIp || '<instance-ip>'}:4100`
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
    <div className="fixed inset-0 z-50 bg-[#0B0D10]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-lg border border-[#242830] bg-[#111419] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#0D0F12] border-b border-[#242830] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-[#38BDF8]" />
            <div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Vultr Cloud Infrastructure &amp; Runtime Settings
              </h3>
              <p className="text-[11px] text-[#9CA3AF]">
                Configure serverless inference models, cloud compute VM nodes, and RPC worker endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#15181E] text-[#9CA3AF] hover:text-[#F4F4F5] cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4 rounded-md border border-[#242830] bg-[#0D0F12] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F4F4F5] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#38BDF8]" />
                Inference &amp; Sandbox RPC Settings
              </span>
              <span className="text-[10px] font-mono text-[#34D399]">
                Airgapped from Sandboxes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">
                  Planner Engine Mode
                </label>
                <select
                  value={preferredProvider}
                  onChange={(e) => setPreferredProvider(e.target.value)}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-1.5 text-[#F4F4F5] outline-none"
                >
                  <option value="auto">Auto (Vultr Inference → Gemini → OpenAI → Playbook)</option>
                  <option value="vultr">Vultr Serverless Inference (api.vultrinference.com)</option>
                  <option value="gemini">Google Gemini API</option>
                  <option value="openai">OpenAI API</option>
                  <option value="playbook">Deterministic Autonomous Engine (Airgapped)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">
                  Vultr Serverless Inference Model
                </label>
                <input
                  type="text"
                  list="vultr-models"
                  value={vultrModel}
                  onChange={(e) => setVultrModel(e.target.value)}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-1.5 font-mono text-[#F4F4F5] outline-none"
                />
                <datalist id="vultr-models">
                  {(overview?.inferenceModels.models || ['kimi-k2-instruct']).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">
                  VULTR_INFERENCE_API_KEY{' '}
                  {status?.llm.vultrInferenceConfigured && (
                    <span className="text-[#34D399]">(Configured ✓)</span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder="Enter Vultr Inference key..."
                  value={vultrInferenceKey}
                  onChange={(e) => setVultrInferenceKey(e.target.value)}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-1.5 font-mono text-[#F4F4F5] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">
                  VULTR_API_KEY (Cloud Compute v2){' '}
                  {status?.vultrCloud.configured && (
                    <span className="text-[#34D399]">(Configured ✓)</span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder="Enter Vultr API key for VM provisioning..."
                  value={vultrApiKey}
                  onChange={(e) => setVultrApiKey(e.target.value)}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-1.5 font-mono text-[#F4F4F5] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">
                  Optional Gemini / OpenAI API Keys
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    placeholder="Gemini Key"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-2.5 py-1.5 font-mono text-[#F4F4F5] outline-none"
                  />
                  <input
                    type="password"
                    placeholder="OpenAI Key"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-2.5 py-1.5 font-mono text-[#F4F4F5] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">
                  Active Sandbox Worker RPC URL
                </label>
                <input
                  type="text"
                  value={workerUrl}
                  onChange={(e) => setWorkerUrl(e.target.value)}
                  placeholder="http://127.0.0.1:4100 or http://<instance-ip>:4100"
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-1.5 font-mono text-[#38BDF8] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242830]">
              {savedToast && (
                <span className="text-xs text-[#34D399] flex items-center gap-1 font-mono">
                  <Check className="w-3.5 h-3.5" /> Configuration updated
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] font-semibold text-xs cursor-pointer transition shadow-sm"
              >
                {saving ? 'Saving...' : 'Apply Configuration'}
              </button>
            </div>
          </form>

          {/* VM Provisioner */}
          <div className="rounded-md border border-[#242830] bg-[#0D0F12] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#F4F4F5] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#34D399]" />
                One-Click Vultr Cloud Compute Provisioner (Ubuntu 24.04 + Docker + gVisor)
              </div>
              <span className="text-[10px] font-mono text-[#6B7280]">POST /v2/instances</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-2.5 py-1.5 text-[#F4F4F5] outline-none"
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
                className="rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-2.5 py-1.5 text-[#F4F4F5] outline-none"
              >
                <option value="vc2-2c-4gb">vc2-2c-4gb (2 vCPU / 4 GB RAM)</option>
                <option value="vc2-4c-8gb">vc2-4c-8gb (4 vCPU / 8 GB RAM)</option>
                <option value="vhp-2c-4gb-amd">vhp-2c-4gb-amd (High Perf AMD EPYC)</option>
              </select>

              <button
                type="button"
                onClick={handleProvision}
                disabled={provisioning}
                className="rounded-md bg-[#34D399] hover:bg-[#6EE7B7] text-[#0B0D10] font-semibold px-3 py-1.5 flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm disabled:opacity-50"
              >
                {provisioning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                <span>Provision Vultr VM</span>
              </button>
            </div>

            {provisionMsg && (
              <div className="rounded bg-[#0B0D10] border border-[#242830] p-2.5 text-[11px] font-mono text-[#38BDF8]">
                {provisionMsg}
              </div>
            )}

            {overview && overview.instances.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] text-[#9CA3AF] font-medium">
                  Active Vultr Cloud Instances:
                </div>
                {overview.instances.map((inst) => (
                  <div
                    key={inst.id}
                    className="rounded bg-[#0B0D10] border border-[#242830] px-3 py-2 flex items-center justify-between text-[11px] font-mono"
                  >
                    <div>
                      <span className="text-[#F4F4F5] font-medium">{inst.label}</span>{' '}
                      <span className="text-[#6B7280]">
                        ({inst.region} · {inst.plan} · {inst.mainIp})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkerUrl(`http://${inst.mainIp}:4100`)}
                      className="text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      Connect IP →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {overview?.sampleCloudInit && (
              <details className="rounded border border-[#242830] bg-[#0B0D10]">
                <summary className="px-3 py-2 text-[11px] font-mono text-[#9CA3AF] cursor-pointer flex items-center justify-between">
                  <span>Hardened Vultr Cloud-Init Blueprint (Docker + gVisor + 169.254.169.254 Drop)</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      void navigator.clipboard.writeText(overview.sampleCloudInit);
                      setCopiedInit(true);
                      setTimeout(() => setCopiedInit(false), 1800);
                    }}
                    className="text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedInit ? 'Copied' : 'Copy'}</span>
                  </button>
                </summary>
                <pre className="p-3 border-t border-[#242830] text-[10px] font-mono text-[#6B7280] overflow-x-auto max-h-44 leading-relaxed">
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
