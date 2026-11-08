import { useCallback, useEffect, useState } from 'react';
import {
  Globe,
  FolderOpen,
  Fingerprint,
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Receipt,
  LifeBuoy,
  UserCheck,
  Users,
  Layers,
  TerminalSquare,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import type {
  EnterpriseOverviewPayload,
  MissionRecord,
  NetworkPolicyMode,
} from '@aegis/shared';
import {
  createFinanceInvoice,
  createHrCandidate,
  createMission,
  createProcurementRequisition,
  createSalesLead,
  createSupportTicket,
  clearEnterpriseDataset,
  decideApprovalItem,
  deleteHrCandidate,
  deleteProcurementRequisition,
  fetchEnterpriseOverview,
  fetchMission,
  fetchMissions,
  fetchSystemStatus,
  resetEnterpriseDataset,
  subscribeToMissionEvents,
  triggerCandidateScreening,
  triggerFinanceReconciliation,
  triggerProcurementEvaluation,
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
import { HrOpsView } from './components/enterprise/HrOpsView';
import { ProcurementOpsView } from './components/enterprise/ProcurementOpsView';
import { ApprovalsView } from './components/enterprise/ApprovalsView';
import { AgentChatView } from './components/AgentChatView';

type InspectorTab = 'browser' | 'artifacts' | 'receipts';

export function App() {
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('chat');
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

  const navItems = [
    {
      id: 'chat' as const,
      label: 'Agent Chat',
      icon: Sparkles,
    },
    {
      id: 'overview' as const,
      label: 'Executive Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'sales' as const,
      label: 'Sales Ops & CRM',
      icon: Briefcase,
    },
    {
      id: 'finance' as const,
      label: 'Finance & AP',
      icon: Receipt,
    },
    {
      id: 'support' as const,
      label: 'Customer Support',
      icon: LifeBuoy,
    },
    {
      id: 'hr' as const,
      label: 'HR & Talent',
      icon: Users,
    },
    {
      id: 'procurement' as const,
      label: 'Procurement & RFP',
      icon: Layers,
    },
    {
      id: 'approvals' as const,
      label: 'Approvals',
      icon: UserCheck,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
    {
      id: 'studio' as const,
      label: 'Sandbox Studio',
      icon: TerminalSquare,
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0F1014] text-[#F2F2F2] relative">
      {/* Ambient background glows for realistic glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[450px] h-96 bg-blue-600/[0.035] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-96 bg-sky-500/[0.035] rounded-full blur-3xl" />
      </div>

      {/* Top Application Header */}
      <TopNav
        status={status}
        networkMode={networkMode}
        onChangeNetworkMode={setNetworkMode}
        onOpenContainmentAudit={() => setAuditModalOpen(true)}
        onOpenVultrModal={() => setVultrModalOpen(true)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        {/* Glassmorphic Vertical Sidebar */}
        <aside className="w-[216px] bg-[#121317]/70 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between shrink-0 select-none shadow-[4px_0_24px_rgba(0,0,0,0.25)] z-10">
          {/* Navigation Section */}
          <div className="p-2 pt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = workspaceTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setWorkspaceTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-white/[0.09] border border-white/[0.14] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-md font-semibold'
                      : 'text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-white/[0.04] hover:border-white/[0.06] border border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-[15px] h-[15px] shrink-0 ${
                        isActive
                          ? 'text-[#38BDF8] drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                          : 'text-[#6B7280]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 font-semibold leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer (Active Execution Indicator) */}
          {isRunning && activeMission ? (
            <div className="p-2 pb-3 border-t border-white/[0.06]">
              <button
                onClick={() => setWorkspaceTab('studio')}
                className="w-full p-2.5 rounded-lg bg-white/[0.04] text-left cursor-pointer transition hover:bg-white/[0.08] group border border-white/[0.08] backdrop-blur-md shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] text-[#38BDF8] font-medium mb-1">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Executing</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[#71717A] group-hover:text-[#38BDF8] transition" />
                </div>
                <div className="text-[10px] font-mono text-[#A1A1AA] truncate">
                  {runningStep ? runningStep.title : 'Sandbox active'}
                </div>
              </button>
            </div>
          ) : null}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#191919]">
          {workspaceTab === 'overview' && (
            <EnterpriseOverviewView
              overview={enterprise}
              isBusy={Boolean(isRunning)}
              onNavigate={setWorkspaceTab}
              onResetDemo={async () => {
                const fresh = await resetEnterpriseDataset();
                setEnterprise(fresh);
              }}
              onClearData={async () => {
                const fresh = await clearEnterpriseDataset();
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
              onQuickScreenCandidate={async () => {
                const target =
                  enterprise?.candidates.find((c) => c.status === 'new') || enterprise?.candidates[0];
                if (!target) return;
                const res = await triggerCandidateScreening(target.id);
                setEnterprise(res.overview);
                setActiveMission(res.mission);
                setWorkspaceTab('studio');
              }}
              onQuickEvaluateProcurement={async () => {
                const target =
                  enterprise?.procurements.find((p) => p.status === 'pending_rfp') ||
                  enterprise?.procurements[0];
                if (!target) return;
                const res = await triggerProcurementEvaluation(target.id);
                setEnterprise(res.overview);
                setActiveMission(res.mission);
                setWorkspaceTab('studio');
              }}
            />
          )}

          {workspaceTab === 'chat' && (
            <AgentChatView
              networkMode={networkMode}
              onNavigateToStudio={() => setWorkspaceTab('studio')}
              onSelectMission={(msn) => {
                setActiveMission(msn);
                setInspectorTab(msn.browserSnapshots.length > 0 ? 'browser' : 'artifacts');
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

          {workspaceTab === 'hr' && (
            <HrOpsView
              candidates={enterprise?.candidates || []}
              isBusy={Boolean(isRunning)}
              onAddCandidate={async (payload) => {
                const res = await createHrCandidate(payload);
                setEnterprise(res.overview);
              }}
              onDeleteCandidate={async (candidateId) => {
                const res = await deleteHrCandidate(candidateId);
                setEnterprise(res.overview);
              }}
              onScreenCandidate={async (candidateId) => {
                const res = await triggerCandidateScreening(candidateId);
                setEnterprise(res.overview);
                setActiveMission(res.mission);
              }}
              onInspectMission={(msnId) => void handleSelectMission(msnId)}
            />
          )}

          {workspaceTab === 'procurement' && (
            <ProcurementOpsView
              procurements={enterprise?.procurements || []}
              isBusy={Boolean(isRunning)}
              onAddProcurement={async (payload) => {
                const res = await createProcurementRequisition(payload);
                setEnterprise(res.overview);
              }}
              onDeleteProcurement={async (procurementId) => {
                const res = await deleteProcurementRequisition(procurementId);
                setEnterprise(res.overview);
              }}
              onEvaluateProcurement={async (procurementId) => {
                const res = await triggerProcurementEvaluation(procurementId);
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
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left Column: Mission Dispatch + Execution Plan */}
              <section className="lg:col-span-3 border-r border-[#2E2E2E] bg-[#1D1D1D] flex flex-col min-h-0 overflow-hidden">
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

              {/* Center Column: Control Plane / Execution Stream */}
              <section className="lg:col-span-5 border-r border-[#2E2E2E] bg-[#191919] flex flex-col min-h-0 overflow-hidden">
                <div className="h-10 px-4 border-b border-[#2E2E2E] bg-[#1D1D1D] flex items-center justify-between text-xs shrink-0">
                  <span className="font-medium text-xs text-[#888888]">
                    Control Plane <span className="text-[#555555]">→</span> Sandbox Stream
                  </span>
                  <span className="text-[11px] font-mono text-[#555555]">
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

              {/* Right Column: Sandbox Inspector */}
              <section className="lg:col-span-4 bg-[#191919] flex flex-col min-h-0 overflow-hidden">
                {/* Segmented Inspector Bar */}
                <div className="h-10 px-3 border-b border-[#2E2E2E] bg-[#1D1D1D] flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => setInspectorTab('browser')}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      inspectorTab === 'browser'
                        ? 'bg-[#2A2A2A] text-[#38BDF8]'
                        : 'text-[#777777] hover:text-[#D0D0D0] hover:bg-[#242424]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Browser</span>
                    {(activeMission?.browserSnapshots.length || 0) > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-[#38BDF8]/12 text-[#38BDF8]">
                        {activeMission?.browserSnapshots.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setInspectorTab('artifacts')}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      inspectorTab === 'artifacts'
                        ? 'bg-[#2A2A2A] text-[#34D399]'
                        : 'text-[#777777] hover:text-[#D0D0D0] hover:bg-[#242424]'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>/workspace</span>
                    {(activeMission?.artifacts.length || 0) > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-[#34D399]/12 text-[#34D399]">
                        {activeMission?.artifacts.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setInspectorTab('receipts')}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      inspectorTab === 'receipts'
                        ? 'bg-[#2A2A2A] text-[#FBBF24]'
                        : 'text-[#777777] hover:text-[#D0D0D0] hover:bg-[#242424]'
                    }`}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Receipts</span>
                    {(activeMission?.receipts.length || 0) > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-[#FBBF24]/12 text-[#FBBF24]">
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
            </div>
          )}
        </main>
      </div>

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
