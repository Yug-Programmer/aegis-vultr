import { useState } from 'react';
import {
  Play,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  X,
} from 'lucide-react';
import type { FinanceInvoice } from '@aegis/shared';

interface FinanceOpsViewProps {
  invoices: FinanceInvoice[];
  isBusy: boolean;
  onAddInvoice: (payload: {
    invoiceNumber: string;
    vendorName: string;
    poNumber: string;
    category: string;
    expectedPoAmountUsd: number;
    billedAmountUsd: number;
    dueDate: string;
    ibanLast4: string;
    expectedIbanLast4: string;
  }) => Promise<void>;
  onRunReconciliation: () => Promise<void>;
  onInspectMission: (missionId: string) => void;
}

export function FinanceOpsView({
  invoices,
  isBusy,
  onAddInvoice,
  onRunReconciliation,
  onInspectMission,
}: FinanceOpsViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-4099');
  const [vendorName, setVendorName] = useState('');
  const [poNumber, setPoNumber] = useState('PO-9200');
  const [expectedPoAmountUsd, setExpectedPoAmountUsd] = useState(12000);
  const [billedAmountUsd, setBilledAmountUsd] = useState(15400);
  const [ibanLast4, setIbanLast4] = useState('9981');
  const [expectedIbanLast4, setExpectedIbanLast4] = useState('9981');

  const latestMissionId = invoices.find((i) => i.lastMissionId)?.lastMissionId;
  const anyReconciling = invoices.some((i) => i.status === 'reconciling');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;
    await onAddInvoice({
      invoiceNumber,
      vendorName,
      poNumber,
      category: 'Enterprise Vendor',
      expectedPoAmountUsd,
      billedAmountUsd,
      dueDate: '2026-11-28',
      ibanLast4,
      expectedIbanLast4,
    });
    setVendorName('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242830]">
        <div>
          <h1 className="text-2xl font-semibold text-[#F4F4F5] tracking-tight">
            Finance &amp; Accounting
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Three-way AP reconciliation, fraud detection, and invoice verification.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {latestMissionId && (
            <button
              onClick={() => onInspectMission(latestMissionId)}
              className="px-3 py-1.5 rounded-md bg-[#111419] hover:bg-[#15181E] border border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#34D399]" />
              <span>CFO Audit Pack</span>
            </button>
          )}

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-1.5 rounded-md bg-[#111419] hover:bg-[#15181E] border border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition"
          >
            {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAdd ? 'Cancel' : 'Submit Invoice'}</span>
          </button>

          <button
            onClick={() => void onRunReconciliation()}
            disabled={isBusy || anyReconciling}
            className="px-3.5 py-1.5 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            {anyReconciling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reconciling in Sandbox...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reconcile All AP Invoices in Sandbox</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Invoice Form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
        >
          <div className="text-xs font-semibold text-[#F4F4F5]">
            Submit Vendor AP Invoice
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Vendor Name</label>
              <input
                required
                placeholder="Vendor Name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Invoice #</label>
              <input
                placeholder="INV-2026-4099"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Approved PO #</label>
              <input
                placeholder="PO-9200"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">PO Cap ($)</label>
                <input
                  type="number"
                  placeholder="12000"
                  value={expectedPoAmountUsd}
                  onChange={(e) => setExpectedPoAmountUsd(Number(e.target.value))}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-2.5 py-2 font-mono text-[#F4F4F5] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Billed ($)</label>
                <input
                  type="number"
                  placeholder="15400"
                  value={billedAmountUsd}
                  onChange={(e) => setBilledAmountUsd(Number(e.target.value))}
                  className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-2.5 py-2 font-mono text-[#FBBF24] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Invoice IBAN Last 4</label>
              <input
                placeholder="9981"
                value={ibanLast4}
                onChange={(e) => setIbanLast4(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Expected Master IBAN Last 4</label>
              <input
                placeholder="9981"
                value={expectedIbanLast4}
                onChange={(e) => setExpectedIbanLast4(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#34D399] hover:bg-[#6EE7B7] text-[#0B0D10] font-semibold text-xs cursor-pointer transition"
            >
              Add to AP Ledger
            </button>
          </div>
        </form>
      )}

      {/* AP Ledger Table */}
      <div className="rounded-lg border border-[#242830] bg-[#111419] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#242830] bg-[#0D0F12] text-[11px] font-mono uppercase text-[#6B7280]">
                <th className="py-3 px-5 font-medium">Invoice / PO</th>
                <th className="py-3 px-5 font-medium">Vendor</th>
                <th className="py-3 px-5 font-medium">Approved PO</th>
                <th className="py-3 px-5 font-medium">Billed</th>
                <th className="py-3 px-5 font-medium">IBAN Check</th>
                <th className="py-3 px-5 font-medium">Status &amp; Control Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242830]">
              {invoices.map((inv) => {
                const flagged =
                  inv.status === 'anomaly_flagged' || inv.status === 'payment_held';
                const clean =
                  inv.status === 'reconciled' || inv.status === 'approved_for_payment';
                const isOvercharged =
                  inv.billedAmountUsd > inv.expectedPoAmountUsd * 1.02;
                const isIbanMismatch =
                  inv.ibanLast4 !== inv.expectedIbanLast4;

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#15181E] transition"
                  >
                    {/* Invoice / PO */}
                    <td className="py-3.5 px-5 font-mono">
                      <div className="font-medium text-[#F4F4F5]">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-[#6B7280]">
                        {inv.poNumber} · Due {inv.dueDate}
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-[#F4F4F5]">{inv.vendorName}</div>
                      <div className="text-[11px] text-[#6B7280]">{inv.category}</div>
                    </td>

                    {/* Approved PO */}
                    <td className="py-3.5 px-5 font-mono text-[#9CA3AF]">
                      ${inv.expectedPoAmountUsd.toLocaleString()}
                    </td>

                    {/* Billed */}
                    <td className="py-3.5 px-5 font-mono">
                      <span
                        className={
                          isOvercharged
                            ? 'text-[#F87171] font-semibold'
                            : 'text-[#F4F4F5]'
                        }
                      >
                        ${inv.billedAmountUsd.toLocaleString()}
                      </span>
                    </td>

                    {/* IBAN Check */}
                    <td className="py-3.5 px-5 font-mono text-[11px]">
                      <span
                        className={
                          isIbanMismatch
                            ? 'text-[#F87171] font-medium'
                            : 'text-[#6B7280]'
                        }
                      >
                        *{inv.ibanLast4} vs *{inv.expectedIbanLast4}
                      </span>
                    </td>

                    {/* Status & Control Verdict */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        {flagged && (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
                        )}
                        {clean && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                        )}
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                            flagged
                              ? 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/25'
                              : clean
                                ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/25'
                                : 'bg-[#15181E] text-[#9CA3AF] border border-[#242830]'
                          }`}
                        >
                          {inv.anomalyType !== 'NONE' ? inv.anomalyType : inv.status}
                        </span>
                      </div>
                      {inv.auditNotes && (
                        <div className="text-[11px] text-[#9CA3AF] mt-1 max-w-sm leading-snug">
                          {inv.auditNotes}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
