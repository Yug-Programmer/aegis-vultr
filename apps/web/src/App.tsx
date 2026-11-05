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
  clearEnterpriseDataset,
  createFinanceInvoice,
  createHrCandidate,
  createMission,
  createProcurementRequisition,
  createSalesLead,
  createSupportTicket,
  decideApprovalItem,
  deleteFinanceInvoice,
  deleteHrCandidate,
  deleteProcurementRequisition,
  deleteSalesLead,
  deleteSupportTicket,
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
import { HrOpsView } from './components/enterprise/HrOpsView';
import { SupportOpsView } from './components/enterprise/SupportOpsView';
import { ProcurementOpsView } from './components/enterprise/ProcurementOpsView';
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

  const navItems = [
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
      id: 'hr' as const,
      label: 'HR & Recruitment',
      icon: UserCheck,
    },
    {
      id: 'support' as const,
      label: 'Customer Support',
      icon: LifeBuoy,
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
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0B0D10] text-[#F4F4F5]">
      {/* Top Application Header */}
      <TopNav
        status={status}
        networkMode={networkMode}
        onChangeNetworkMode={setNetworkMode}
        onOpenContainmentAudit={() => setAuditModalOpen(true)}
        onOpenVultrModal={() => setVultrModalOpen(true)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Modern Vertical Application Sidebar */}
        <aside className="w-[215px] bg-[#0B0D10] border-r border-[#1E232B] flex flex-col justify-between shrink-0 select-none">
          {/* Navigation Section */}
          <div className="p-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = workspaceTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setWorkspaceTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#15181E] text-white'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#15181E]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#38BDF8]' : 'text-[#71717A]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#FBBF24]/15 text-[#FBBF24] font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2 border-t border-[#1E232B]">
            {isRunning && activeMission ? (
              <button
                onClick={() => setWorkspaceTab('studio')}
                className="w-full p-2 rounded-md bg-[#15181E] text-left cursor-pointer transition hover:bg-[#1A1E26] group"
              >
                <div className="flex items-center justify-between text-[11px] text-[#38BDF8] font-medium mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Executing</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[#6B7280] group-hover:text-[#38BDF8] transition" />
                </div>
                <div className="text-[10px] font-mono text-[#9CA3AF] truncate">
                  {runningStep ? runningStep.title : 'Sandbox active'}
                </div>
              </button>
            ) : (
              <div className="px-2 py-1 text-[11px] text-[#6B7280] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                <span>Sandbox Ready</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#0B0D10]">
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
                  enterprise?.procurements.find((p) => p.status === 'pending_rfp') || enterprise?.procurements[0];
                if (!target) return;
                const res = await triggerProcurementEvaluation(target.id);
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
              onDeleteLead={async (leadId) => {
                const res = await deleteSalesLead(leadId);
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
              onDeleteInvoice={async (invoiceId) => {
                const res = await deleteFinanceInvoice(invoiceId);
                setEnterprise(res.overview);
              }}
              onReconcileLedger={async () => {
                const res = await triggerFinanceReconciliation();
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

          {workspaceTab === 'support' && (
            <SupportOpsView
              tickets={enterprise?.tickets || []}
              isBusy={Boolean(isRunning)}
              onAddTicket={async (payload) => {
                const res = await createSupportTicket(payload);
                setEnterprise(res.overview);
              }}
              onDeleteTicket={async (ticketId) => {
                const res = await deleteSupportTicket(ticketId);
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
              <section className="lg:col-span-3 border-r border-[#1E232B] bg-[#0B0D10] flex flex-col min-h-0 overflow-hidden">
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
              <section className="lg:col-span-5 border-r border-[#1E232B] bg-[#0B0D10] flex flex-col min-h-0 overflow-hidden">
                <div className="h-10 px-4 border-b border-[#1E232B] bg-[#0B0D10] flex items-center justify-between text-xs shrink-0">
                  <span className="font-medium text-xs text-[#9CA3AF]">
                    Control Plane <span className="text-[#6B7280]">→</span> Sandbox Stream
                  </span>
                  <span className="text-[11px] font-mono text-[#6B7280]">
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
              <section className="lg:col-span-4 bg-[#0B0D10] flex flex-col min-h-0 overflow-hidden">
                {/* Segmented Inspector Bar */}
                <div className="h-10 px-3 border-b border-[#1E232B] bg-[#0B0D10] flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setInspectorTab('browser')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      inspectorTab === 'browser'
                        ? 'bg-[#15181E] text-[#38BDF8]'
                        : 'text-[#9CA3AF] hover:text-[#F4F4F5]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Browser</span>
                    {(activeMission?.browserSnapshots.length || 0) > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-[#38BDF8]/15 text-[#38BDF8]">
                        {activeMission?.browserSnapshots.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setInspectorTab('artifacts')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      inspectorTab === 'artifacts'
                        ? 'bg-[#15181E] text-[#34D399]'
                        : 'text-[#9CA3AF] hover:text-[#F4F4F5]'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>/workspace</span>
                    {(activeMission?.artifacts.length || 0) > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-[#34D399]/15 text-[#34D399]">
                        {activeMission?.artifacts.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setInspectorTab('receipts')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                      inspectorTab === 'receipts'
                        ? 'bg-[#15181E] text-[#FBBF24]'
                        : 'text-[#9CA3AF] hover:text-[#F4F4F5]'
                    }`}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Receipts</span>
                    {(activeMission?.receipts.length || 0) > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-[#FBBF24]/15 text-[#FBBF24]">
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
