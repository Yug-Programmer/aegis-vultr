import { useState } from 'react';
import {
  Receipt,
  Play,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
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
    <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-7xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Finance &amp; Accounting — 3-Way AP Ledger Reconciliation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Executes deterministic Python 3-way matching inside the Vultr sandbox to detect
            duplicate invoices, PO cap overcharges, and vendor bank IBAN tampering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {latestMissionId && (
            <button
              onClick={() => onInspectMission(latestMissionId)}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>View CFO SVG &amp; HTML Audit Pack</span>
            </button>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Invoice</span>
          </button>
          <button
            onClick={() => void onRunReconciliation()}
            disabled={isBusy || anyReconciling}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
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

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-emerald-500/35 bg-[#0a141d] p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
        >
          <input
            required
            placeholder="Vendor Name"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
          />
          <input
            placeholder="Invoice #"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-slate-100"
          />
          <input
            placeholder="Approved PO #"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-slate-100"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="PO Cap $"
              title="Approved Purchase Order Amount ($)"
              value={expectedPoAmountUsd}
              onChange={(e) => setExpectedPoAmountUsd(Number(e.target.value))}
              className="rounded-md bg-slate-950 border border-slate-700 px-2.5 py-2 font-mono text-slate-100"
            />
            <input
              type="number"
              placeholder="Billed $"
              title="Invoice Billed Amount ($)"
              value={billedAmountUsd}
              onChange={(e) => setBilledAmountUsd(Number(e.target.value))}
              className="rounded-md bg-slate-950 border border-slate-700 px-2.5 py-2 font-mono text-amber-300"
            />
          </div>
          <input
            placeholder="Invoice Remittance IBAN Last 4"
            value={ibanLast4}
            onChange={(e) => setIbanLast4(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-slate-100"
          />
          <input
            placeholder="Master Vendor IBAN Last 4"
            value={expectedIbanLast4}
            onChange={(e) => setExpectedIbanLast4(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-slate-100"
          />
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold cursor-pointer"
            >
              Add to AP Ledger
            </button>
          </div>
        </form>
      )}

      {/* AP Ledger Table */}
      <div className="rounded-xl border border-slate-800 bg-[#090e1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4">Invoice / PO</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Approved PO</th>
                <th className="py-3 px-4">Billed</th>
                <th className="py-3 px-4">IBAN Check</th>
                <th className="py-3 px-4">Status &amp; Control Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {invoices.map((inv) => {
                const flagged =
                  inv.status === 'anomaly_flagged' || inv.status === 'payment_held';
                const clean =
                  inv.status === 'reconciled' || inv.status === 'approved_for_payment';
                return (
                  <tr key={inv.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-white">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-500">
                        {inv.poNumber} • Due {inv.dueDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{inv.vendorName}</div>
                      <div className="text-[11px] text-slate-500">{inv.category}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      ${inv.expectedPoAmountUsd.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={
                          inv.billedAmountUsd > inv.expectedPoAmountUsd * 1.02
                            ? 'text-rose-300 font-semibold'
                            : 'text-white'
                        }
                      >
                        ${inv.billedAmountUsd.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span
                        className={
                          inv.ibanLast4 !== inv.expectedIbanLast4
                            ? 'text-rose-400 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        *{inv.ibanLast4} vs *{inv.expectedIbanLast4}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {flagged && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                        {clean && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                            flagged
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                              : clean
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {inv.anomalyType !== 'NONE' ? inv.anomalyType : inv.status}
                        </span>
                      </div>
                      {inv.auditNotes && (
                        <div className="text-[11px] text-slate-400 mt-1 max-w-md leading-snug">
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
