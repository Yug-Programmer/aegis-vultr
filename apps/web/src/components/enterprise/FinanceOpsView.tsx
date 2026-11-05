import { useState } from 'react';
import {
  Play,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Trash2,
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
  onDeleteInvoice: (invoiceId: string) => Promise<void>;
  onReconcileLedger: () => Promise<void>;
  onInspectMission: (missionId: string) => void;
}

export function FinanceOpsView({
  invoices,
  isBusy,
  onAddInvoice,
  onDeleteInvoice,
  onReconcileLedger,
  onInspectMission,
}: FinanceOpsViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [poNumber, setPoNumber] = useState('PO-9100');
  const [category, setCategory] = useState('Cloud Infrastructure');
  const [expectedPoAmountUsd, setExpectedPoAmountUsd] = useState(12000);
  const [billedAmountUsd, setBilledAmountUsd] = useState(12000);
  const [dueDate, setDueDate] = useState('2026-11-25');
  const [ibanLast4, setIbanLast4] = useState('1122');
  const [expectedIbanLast4, setExpectedIbanLast4] = useState('1122');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;
    await onAddInvoice({
      invoiceNumber:
        invoiceNumber.trim() ||
        `INV-2026-${Math.floor(5000 + Math.random() * 4000)}`,
      vendorName,
      poNumber,
      category,
      expectedPoAmountUsd: Number(expectedPoAmountUsd),
      billedAmountUsd: Number(billedAmountUsd),
      dueDate,
      ibanLast4: ibanLast4.trim() || '1122',
      expectedIbanLast4: expectedIbanLast4.trim() || '1122',
    });
    setInvoiceNumber('');
    setVendorName('');
    setShowAdd(false);
  };

  const isReconciling = invoices.some((i) => i.status === 'reconciling');
  const lastMissionId = invoices.find((i) => i.lastMissionId)?.lastMissionId;

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242830]">
        <div>
          <h1 className="text-2xl font-semibold text-[#F4F4F5] tracking-tight">
            Finance &amp; Accounting
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Deterministic 3-way match, overbilling detection, duplicate suppression, and bank fraud prevention.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastMissionId && (
            <button
              onClick={() => onInspectMission(lastMissionId)}
              className="px-3 py-1.5 rounded-md bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
              title="Inspect Ed25519 Sandbox Execution Proof"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Sandbox Proof</span>
            </button>
          )}

          <button
            onClick={() => void onReconcileLedger()}
            disabled={isBusy || isReconciling}
            className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            {isReconciling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reconciling Ledger...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reconcile with Agent</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-1.5 rounded-md bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-[#F4F4F5] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAdd ? 'Cancel' : 'Submit Invoice'}</span>
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
            New Accounts Payable Invoice Entry
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Invoice Number</label>
              <input
                placeholder="INV-2026-XXXX"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Vendor Name</label>
              <input
                required
                placeholder="e.g. CloudScale Transit Inc."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Purchase Order (PO)</label>
              <input
                placeholder="PO-8810"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Category</label>
              <input
                placeholder="Backbone Bandwidth"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Approved PO Cap ($)</label>
              <input
                type="number"
                value={expectedPoAmountUsd}
                onChange={(e) => setExpectedPoAmountUsd(Number(e.target.value))}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Billed Invoice Amount ($)</label>
              <input
                type="number"
                value={billedAmountUsd}
                onChange={(e) => setBilledAmountUsd(Number(e.target.value))}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Submitted Remittance IBAN (Last 4)</label>
              <input
                maxLength={4}
                value={ibanLast4}
                onChange={(e) => setIbanLast4(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Authorized Master IBAN (Last 4)</label>
              <input
                maxLength={4}
                value={expectedIbanLast4}
                onChange={(e) => setExpectedIbanLast4(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] font-semibold text-xs cursor-pointer transition"
            >
              Submit Invoice to Ledger
            </button>
          </div>
        </form>
      )}

      {/* Invoices Table */}
      <div className="rounded-lg border border-[#242830] bg-[#111419] overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-[#9CA3AF] text-xs">
            No invoices in AP ledger. Click &ldquo;Submit Invoice&rdquo; to add custom bills, or reset sample data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242830] bg-[#15181E] text-[11px] text-[#9CA3AF]">
                  <th className="py-3 px-5 font-medium">Invoice / PO</th>
                  <th className="py-3 px-5 font-medium">Vendor</th>
                  <th className="py-3 px-5 font-medium">Approved PO</th>
                  <th className="py-3 px-5 font-medium">Billed</th>
                  <th className="py-3 px-5 font-medium">IBAN Check</th>
                  <th className="py-3 px-5 font-medium">Status &amp; Findings</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1E24]">
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
                    <tr key={inv.id} className="hover:bg-[#15181E] transition">
                      {/* Invoice / PO */}
                      <td className="py-3.5 px-5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#F4F4F5]">{inv.invoiceNumber}</span>
                          {inv.isUserCreated && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                              Custom
                            </span>
                          )}
                        </div>
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

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => void onDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F87171] hover:bg-[#242830] transition cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
