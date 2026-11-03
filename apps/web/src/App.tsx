import { useCallback, useEffect, useState } from 'react';
import {
  Globe,
  FolderOpen,
  Fingerprint,
  LayoutDashboard,
  Briefcase,
  Receipt,
  LifeBuoy,
  UserCheck,
  TerminalSquare,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type {
  EnterpriseOverviewPayload,
  MissionRecord,
  NetworkPolicyMode,
} from '@aegis/shared';
import {
  createFinanceInvoice,
  createMission,
  createSalesLead,
  createSupportTicket,
  decideApprovalItem,
  fetchEnterpriseOverview,
  fetchMission,
  fetchMissions,
  fetchSystemStatus,
  resetEnterpriseDataset,
  subscribeToMissionEvents,
  triggerFinanceReconciliation,
  triggerSalesLeadQualification,
  triggerSupportInvestigation,
  type SystemStatusResponse,
} from './api';
import { TopNav } from './components/TopNav';
import { MissionComposer } from './components/MissionComposer';
import { PlanTimeline } from './components/PlanTimeline';
import { ExecutionStream } from './components/ExecutionStream';
import { BrowserViewport } from './components/BrowserViewport';
import { ArtifactExplorer } from './components/ArtifactExplorer';
import { ReceiptChainPanel } from './components/ReceiptChainPanel';
import { ContainmentAuditModal } from './components/ContainmentAuditModal';
import { VultrInfraModal } from './components/VultrInfraModal';
import {
  EnterpriseOverviewView,
  type WorkspaceTab,
} from './components/enterprise/EnterpriseOverviewView';
import { SalesOpsView } from './components/enterprise/SalesOpsView';
import { FinanceOpsView } from './components/enterprise/FinanceOpsView';
import { SupportOpsView } from './components/enterprise/SupportOpsView';
import { ApprovalsView } from './components/enterprise/ApprovalsView';

type InspectorTab = 'browser' | 'artifacts' | 'receipts';

export function App() {
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('overview');
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [enterprise, setEnterprise] = useState<EnterpriseOverviewPayload | null>(null);
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [activeMission, setActiveMission] = useState<MissionRecord | null>(null);
  const [networkMode, setNetworkMode] = useState<NetworkPolicyMode>('standard');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('artifacts');
  const [selectedArtifactPath, setSelectedArtifactPath] = useState<string | undefined>();
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [vultrModalOpen, setVultrModalOpen] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await fetchSystemStatus();
      setStatus(s);
    } catch {
      // ignore transient startup poll
    }
  }, []);

  const refreshEnterprise = useCallback(async () => {
    try {
      const ov = await fetchEnterpriseOverview();
      setEnterprise(ov);
    } catch {
      // ignore
    }
  }, []);

  const refreshMissionList = useCallback(async () => {
    try {
      const list = await fetchMissions();
      setMissions(list);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    void refreshEnterprise();
    void refreshMissionList();
    const interval = setInterval(() => {
      void refreshStatus();
      void refreshEnterprise();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshStatus, refreshEnterprise, refreshMissionList]);

  useEffect(() => {
    if (!activeMission?.id) return;
    if (activeMission.status === 'completed' || activeMission.status === 'failed') return;

    const unsubscribe = subscribeToMissionEvents(activeMission.id, (ev) => {
      if (ev.type === 'browser_snapshot') {
        setInspectorTab('browser');
      } else if (ev.type === 'mission_completed' || ev.type === 'mission_failed') {
        void refreshMissionList();
        void refreshEnterprise();
      }
      void fetchMission(activeMission.id).then((updated) => {
        setActiveMission(updated);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [activeMission?.id, activeMission?.status, refreshMissionList, refreshEnterprise]);

  const handleLaunchMission = async (prompt: string, templateId?: string) => {
    const created = await createMission({
      prompt,
      templateId,
      policy: { networkMode },
    });
    setSelectedArtifactPath(undefined);
    setActiveMission(created);
    setWorkspaceTab('studio');
    void refreshMissionList();
  };

  const handleSelectMission = async (id: string) => {
    const m = await fetchMission(id);
    setSelectedArtifactPath(undefined);
    setActiveMission(m);
    setInspectorTab(m.browserSnapshots.length > 0 ? 'browser' : 'artifacts');
    setWorkspaceTab('studio');
  };

  const isRunning =
    activeMission?.status === 'planning' || activeMission?.status === 'executing';

  const runningStep = activeMission?.plan.find((s) => s.status === 'running');
  const pendingApprovals = enterprise?.stats.pendingApprovalsCount || 0;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#060911] text-slate-100">
      <TopNav
        status={status}
        networkMode={networkMode}
        onChangeNetworkMode={setNetworkMode}
        onOpenContainmentAudit={() => setAuditModalOpen(true)}
        onOpenVultrModal={() => setVultrModalOpen(true)}
      />

      {/* Unified Enterprise + Sandbox Studio Sub-Navigation */}
      <nav className="h-11 border-b border-slate-800/90 bg-[#070b15] px-4 flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWorkspaceTab('overview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              workspaceTab === 'overview'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/35'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('sales')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              workspaceTab === 'sales'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/35'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Sales Ops &amp; CRM</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('finance')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              workspaceTab === 'finance'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Finance &amp; AP</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('support')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              workspaceTab === 'support'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/35'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Customer Support</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('approvals')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              workspaceTab === 'approvals'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Approvals</span>
            {pendingApprovals > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-slate-950 font-bold">
                {pendingApprovals}
              </span>
            )}
          </button>

          <span className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => setWorkspaceTab('studio')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              workspaceTab === 'studio'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TerminalSquare className="w-3.5 h-3.5" />
            <span>Sandbox Studio</span>
          </button>
        </div>

        {/* Live Active Sandbox Telemetry Pill when running */}
        {isRunning && activeMission && (
          <button
            onClick={() => setWorkspaceTab('studio')}
            className="px-3 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-[11px] font-mono flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="truncate max-w-[280px]">
              {runningStep
                ? `Sandbox Step ${runningStep.index}: ${runningStep.title}`
                : 'Initializing Vultr Sandbox...'}
            </span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </nav>

      {/* Active Workspace Body */}
      {workspaceTab === 'overview' && (
        <EnterpriseOverviewView
          overview={enterprise}
          isBusy={Boolean(isRunning)}
          onNavigate={setWorkspaceTab}
          onResetDemo={async () => {
            const fresh = await resetEnterpriseDataset();
            setEnterprise(fresh);
          }}
          onQuickQualifyTopLead={async () => {
            const target =
              enterprise?.leads.find((l) => l.stage === 'new') || enterprise?.leads[0];
            if (!target) return;
            const res = await triggerSalesLeadQualification(target.id);
            setEnterprise(res.overview);
            setActiveMission(res.mission);
            setWorkspaceTab('studio');
          }}
          onQuickReconcileFinance={async () => {
            const res = await triggerFinanceReconciliation();
            setEnterprise(res.overview);
            setActiveMission(res.mission);
            setWorkspaceTab('studio');
          }}
          onQuickTriageTopTicket={async () => {
            const target =
              enterprise?.tickets.find((t) => t.status === 'open') || enterprise?.tickets[0];
            if (!target) return;
            const res = await triggerSupportInvestigation(target.id);
            setEnterprise(res.overview);
            setActiveMission(res.mission);
            setWorkspaceTab('studio');
          }}
        />
      )}

      {workspaceTab === 'sales' && (
        <SalesOpsView
          leads={enterprise?.leads || []}
          isBusy={Boolean(isRunning)}
          onAddLead={async (payload) => {
            const res = await createSalesLead(payload);
            setEnterprise(res.overview);
          }}
          onQualifyLead={async (leadId) => {
            const res = await triggerSalesLeadQualification(leadId);
            setEnterprise(res.overview);
            setActiveMission(res.mission);
          }}
          onInspectMission={(msnId) => void handleSelectMission(msnId)}
        />
      )}

      {workspaceTab === 'finance' && (
        <FinanceOpsView
          invoices={enterprise?.invoices || []}
          isBusy={Boolean(isRunning)}
          onAddInvoice={async (payload) => {
            const res = await createFinanceInvoice(payload);
            setEnterprise(res.overview);
          }}
          onRunReconciliation={async () => {
            const res = await triggerFinanceReconciliation();
            setEnterprise(res.overview);
            setActiveMission(res.mission);
          }}
          onInspectMission={(msnId) => void handleSelectMission(msnId)}
        />
      )}

      {workspaceTab === 'support' && (
        <SupportOpsView
          tickets={enterprise?.tickets || []}
          isBusy={Boolean(isRunning)}
          onAddTicket={async (payload) => {
            const res = await createSupportTicket(payload);
            setEnterprise(res.overview);
          }}
          onInvestigateTicket={async (ticketId) => {
            const res = await triggerSupportInvestigation(ticketId);
            setEnterprise(res.overview);
            setActiveMission(res.mission);
          }}
          onInspectMission={(msnId) => void handleSelectMission(msnId)}
        />
      )}

      {workspaceTab === 'approvals' && (
        <ApprovalsView
          approvals={enterprise?.approvals || []}
          onDecide={async (id, decision) => {
            const res = await decideApprovalItem(id, decision);
            setEnterprise(res.overview);
          }}
          onInspectMission={(msnId) => void handleSelectMission(msnId)}
        />
      )}

      {workspaceTab === 'studio' && (
        <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">
          {/* Left Pane: Mission Dispatch + Plan DAG */}
          <section className="lg:col-span-3 border-r border-slate-800/90 bg-[#070b14] flex flex-col min-h-0">
            <MissionComposer
              templates={status?.templates || []}
              isRunning={Boolean(isRunning)}
              onLaunchMission={handleLaunchMission}
            />
            <PlanTimeline
              plan={activeMission?.plan || []}
              missions={missions}
              activeMissionId={activeMission?.id}
              onSelectMission={handleSelectMission}
            />
          </section>

          {/* Center Pane: Live Execution Stream */}
          <section className="lg:col-span-5 border-r border-slate-800/90 bg-[#060911] flex flex-col min-h-0">
            <div className="h-10 px-4 border-b border-slate-800/90 bg-[#080c17] flex items-center justify-between text-xs shrink-0">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Control Plane → Sandbox Stream
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {activeMission ? `${activeMission.events.length} events` : 'Idle'}
              </span>
            </div>
            <ExecutionStream
              mission={activeMission}
              onJumpToBrowser={() => setInspectorTab('browser')}
              onJumpToArtifact={(relPath) => {
                setSelectedArtifactPath(relPath);
                setInspectorTab('artifacts');
              }}
              onJumpToReceipts={() => setInspectorTab('receipts')}
            />
          </section>

          {/* Right Pane: Sandbox Inspector (Browser / Artifacts / Signed Receipts) */}
          <section className="lg:col-span-4 bg-[#070b14] flex flex-col min-h-0">
            <div className="h-10 px-2 border-b border-slate-800/90 bg-[#080c17] flex items-center gap-1 shrink-0">
              <button
                onClick={() => setInspectorTab('browser')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  inspectorTab === 'browser'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/35'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Browser</span>
                {(activeMission?.browserSnapshots.length || 0) > 0 && (
                  <span className="text-[10px] font-mono px-1.5 rounded-full bg-sky-500/25 text-sky-200">
                    {activeMission?.browserSnapshots.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setInspectorTab('artifacts')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  inspectorTab === 'artifacts'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>/workspace</span>
                {(activeMission?.artifacts.length || 0) > 0 && (
                  <span className="text-[10px] font-mono px-1.5 rounded-full bg-emerald-500/25 text-emerald-200">
                    {activeMission?.artifacts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setInspectorTab('receipts')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  inspectorTab === 'receipts'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/35'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Receipts</span>
                {(activeMission?.receipts.length || 0) > 0 && (
                  <span className="text-[10px] font-mono px-1.5 rounded-full bg-purple-500/25 text-purple-200">
                    {activeMission?.receipts.length}
                  </span>
                )}
              </button>
            </div>

            {inspectorTab === 'browser' && (
              <BrowserViewport
                missionId={activeMission?.id}
                snapshots={activeMission?.browserSnapshots || []}
              />
            )}

            {inspectorTab === 'artifacts' && (
              <ArtifactExplorer
                missionId={activeMission?.id}
                artifacts={activeMission?.artifacts || []}
                selectedPath={selectedArtifactPath}
                onSelectPath={setSelectedArtifactPath}
              />
            )}

            {inspectorTab === 'receipts' && (
              <ReceiptChainPanel
                missionId={activeMission?.id}
                receipts={activeMission?.receipts || []}
              />
            )}
          </section>
        </main>
      )}

      <ContainmentAuditModal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
      />

      <VultrInfraModal
        open={vultrModalOpen}
        onClose={() => setVultrModalOpen(false)}
        status={status}
        onRefreshStatus={refreshStatus}
      />
    </div>
  );
}
