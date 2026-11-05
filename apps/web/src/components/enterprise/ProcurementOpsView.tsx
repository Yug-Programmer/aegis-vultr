import { useState } from 'react';
import {
  Layers,
  Plus,
  Play,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Trash2,
  X,
  Award,
} from 'lucide-react';
import type { ProcurementRequisition } from '@aegis/shared';

interface ProcurementOpsViewProps {
  procurements: ProcurementRequisition[];
  isBusy: boolean;
  onAddProcurement: (payload: {
    title: string;
    department: string;
    targetBudgetUsd: number;
    deliveryDeadline: string;
    vendorBids: Array<{
      vendorName: string;
      quoteAmountUsd: number;
      deliveryDays: number;
      slaGuaranteePercent: number;
      reliabilityScore: number;
    }>;
  }) => Promise<void>;
  onDeleteProcurement: (procurementId: string) => Promise<void>;
  onEvaluateProcurement: (procurementId: string) => Promise<void>;
  onInspectMission: (missionId: string) => void;
}

export function ProcurementOpsView({
  procurements,
  isBusy,
  onAddProcurement,
  onDeleteProcurement,
  onEvaluateProcurement,
  onInspectMission,
}: ProcurementOpsViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('AI Research & Platform Ops');
  const [targetBudgetUsd, setTargetBudgetUsd] = useState(35000);
  const [deliveryDeadline, setDeliveryDeadline] = useState('2026-12-01');

  // Vendor 1
  const [v1Name, setV1Name] = useState('Vultr Cloud Compute');
  const [v1Quote, setV1Quote] = useState(29500);
  const [v1Days, setV1Days] = useState(2);
  const [v1Sla, setV1Sla] = useState(99.99);

  // Vendor 2
  const [v2Name, setV2Name] = useState('Legacy Enterprise Metal');
  const [v2Quote, setV2Quote] = useState(38000);
  const [v2Days, setV2Days] = useState(7);
  const [v2Sla, setV2Sla] = useState(99.9);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !v1Name.trim()) return;

    const bids = [
      {
        vendorName: v1Name.trim(),
        quoteAmountUsd: Number(v1Quote) || 10000,
        deliveryDays: Number(v1Days) || 3,
        slaGuaranteePercent: Number(v1Sla) || 99.9,
        reliabilityScore: 5,
      },
    ];

    if (v2Name.trim()) {
      bids.push({
        vendorName: v2Name.trim(),
        quoteAmountUsd: Number(v2Quote) || 12000,
        deliveryDays: Number(v2Days) || 5,
        slaGuaranteePercent: Number(v2Sla) || 99.5,
        reliabilityScore: 4,
      });
    }

    await onAddProcurement({
      title: title.trim(),
      department: department.trim(),
      targetBudgetUsd: Number(targetBudgetUsd) || 30000,
      deliveryDeadline: deliveryDeadline || '2026-12-01',
      vendorBids: bids,
    });

    setTitle('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242830]">
        <div>
          <h1 className="text-2xl font-semibold text-[#F4F4F5] tracking-tight">
            Procurement &amp; Vendor Operations
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Autonomous multi-vendor RFP comparison, Multi-Criteria Decision Analysis (MCDA), cost optimization, and Purchase Order sign-offs.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm self-start sm:self-auto"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showAdd ? 'Cancel' : 'New Requisition RFP'}</span>
        </button>
      </div>

      {/* Add Requisition Form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
        >
          <div className="text-xs font-semibold text-[#F4F4F5]">
            Create Procurement Requisition &amp; Vendor RFP
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Requisition Item / Purpose</label>
              <input
                required
                placeholder="e.g. NVIDIA H100 Cloud GPU Cluster (8-Node High-Speed Interconnect)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Target Budget Cap ($)</label>
              <input
                type="number"
                step="1000"
                value={targetBudgetUsd}
                onChange={(e) => setTargetBudgetUsd(Number(e.target.value))}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#34D399] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Delivery Deadline</label>
              <input
                type="date"
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#242830] space-y-3">
            <div className="text-xs font-semibold text-[#38BDF8]">
              Vendor Bids to Compare
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-[#0D0F12] p-3 rounded border border-[#242830]">
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Vendor #1 Name</label>
                <input
                  value={v1Name}
                  onChange={(e) => setV1Name(e.target.value)}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[#F4F4F5] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Quote Amount ($)</label>
                <input
                  type="number"
                  value={v1Quote}
                  onChange={(e) => setV1Quote(Number(e.target.value))}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[#F4F4F5] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Delivery (Days)</label>
                <input
                  type="number"
                  value={v1Days}
                  onChange={(e) => setV1Days(Number(e.target.value))}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[#F4F4F5] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">SLA Guarantee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={v1Sla}
                  onChange={(e) => setV1Sla(Number(e.target.value))}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[#F4F4F5] outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-[#0D0F12] p-3 rounded border border-[#242830]">
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Vendor #2 Name (Optional)</label>
                <input
                  value={v2Name}
                  onChange={(e) => setV2Name(e.target.value)}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[#F4F4F5] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Quote Amount ($)</label>
                <input
                  type="number"
                  value={v2Quote}
                  onChange={(e) => setV2Quote(Number(e.target.value))}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[#F4F4F5] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Delivery (Days)</label>
                <input
                  type="number"
                  value={v2Days}
                  onChange={(e) => setV2Days(Number(e.target.value))}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[#F4F4F5] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">SLA Guarantee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={v2Sla}
                  onChange={(e) => setV2Sla(Number(e.target.value))}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] px-2.5 py-1.5 text-[#F4F4F5] outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] font-semibold text-xs cursor-pointer transition"
            >
              Save Requisition RFP
            </button>
          </div>
        </form>
      )}

      {/* Requisitions List */}
      <div className="space-y-4">
        {procurements.length === 0 ? (
          <div className="rounded-lg border border-[#242830] bg-[#111419] p-8 text-center text-[#9CA3AF] text-xs">
            No procurement requisitions yet. Click &ldquo;New Requisition RFP&rdquo; to create purchasing requirements, or reset sample data.
          </div>
        ) : (
          procurements.map((req) => {
            const isEvaluating = req.status === 'evaluating';
            return (
              <div
                key={req.id}
                className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
              >
                {/* Top Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-semibold text-[#F4F4F5]">
                        {req.title}
                      </span>
                      <span className="text-xs font-mono text-[#9CA3AF]">
                        {req.reqNumber}
                      </span>

                      {req.isUserCreated && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                          Custom Record
                        </span>
                      )}

                      {/* Status Pill */}
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#15181E] border border-[#242830] text-[#9CA3AF]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            req.status === 'po_approved'
                              ? 'bg-[#34D399]'
                              : req.status === 'vendor_selected'
                                ? 'bg-[#38BDF8]'
                                : req.status === 'evaluating'
                                  ? 'bg-[#FBBF24]'
                                  : 'bg-[#6B7280]'
                          }`}
                        />
                        <span className="capitalize">{req.status.replace('_', ' ')}</span>
                      </span>

                      {req.selectedVendor && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/20 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>Winner: {req.selectedVendor}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#9CA3AF] flex items-center gap-2 flex-wrap">
                      <span>{req.department}</span>
                      <span className="text-[#6B7280]">·</span>
                      <span>Target Budget Cap:</span>
                      <span className="font-mono text-[#34D399] font-medium">
                        ${req.targetBudgetUsd.toLocaleString()}
                      </span>
                      <span className="text-[#6B7280]">·</span>
                      <span>Deadline: {req.deliveryDeadline}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    {req.lastMissionId && (
                      <button
                        onClick={() => onInspectMission(req.lastMissionId!)}
                        className="px-3 py-1.5 rounded-md bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
                        title="Inspect Ed25519 Sandbox Execution Proof"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Sandbox Proof</span>
                      </button>
                    )}

                    <button
                      onClick={() => void onEvaluateProcurement(req.id)}
                      disabled={isBusy || isEvaluating}
                      className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluating RFP...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {req.selectedVendor ? 'Re-Run RFP Analysis' : 'Run Procurement Analysis'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => void onDeleteProcurement(req.id)}
                      className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F87171] hover:bg-[#242830] transition cursor-pointer"
                      title="Delete Requisition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bids Table */}
                <div className="overflow-x-auto rounded border border-[#242830] bg-[#0D0F12]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#242830] text-[11px] text-[#9CA3AF]">
                        <th className="py-2.5 px-4 font-medium">Vendor</th>
                        <th className="py-2.5 px-4 font-medium">Quoted Amount</th>
                        <th className="py-2.5 px-4 font-medium">Delivery Lead Time</th>
                        <th className="py-2.5 px-4 font-medium">SLA Guarantee</th>
                        <th className="py-2.5 px-4 font-medium">Vendor Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1E24]">
                      {req.vendorBids.map((b, idx) => {
                        const isWin = req.selectedVendor === b.vendorName;
                        return (
                          <tr
                            key={idx}
                            className={isWin ? 'bg-[#10B981]/5 font-medium' : ''}
                          >
                            <td className="py-2 px-4 flex items-center gap-1.5">
                              {isWin && <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />}
                              <span className={isWin ? 'text-[#34D399]' : 'text-[#F4F4F5]'}>
                                {b.vendorName}
                              </span>
                            </td>
                            <td className="py-2 px-4 font-mono text-[#F4F4F5]">
                              ${b.quoteAmountUsd.toLocaleString()}
                            </td>
                            <td className="py-2 px-4 text-[#9CA3AF]">
                              {b.deliveryDays} {b.deliveryDays === 1 ? 'day' : 'days'}
                            </td>
                            <td className="py-2 px-4 text-[#9CA3AF]">
                              {b.slaGuaranteePercent}%
                            </td>
                            <td className="py-2 px-4 text-[#FBBF24]">
                              {'★'.repeat(b.reliabilityScore)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Recommendation Notes */}
                {req.evaluationNotes && (
                  <div className="rounded-lg border border-[#242830] bg-[#0D0F12] p-4 text-xs space-y-1">
                    <div className="text-[#34D399] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Autonomous Procurement Findings:</span>
                    </div>
                    <div className="text-[#9CA3AF] leading-relaxed">
                      {req.evaluationNotes}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
