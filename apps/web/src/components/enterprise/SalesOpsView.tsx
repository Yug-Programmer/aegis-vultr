import { useState } from 'react';
import {
  Briefcase,
  Globe,
  Plus,
  Play,
  Loader2,
  ExternalLink,
  Mail,
} from 'lucide-react';
import type { SalesLead } from '@aegis/shared';

interface SalesOpsViewProps {
  leads: SalesLead[];
  isBusy: boolean;
  onAddLead: (payload: {
    company: string;
    domainUrl: string;
    contactName: string;
    contactRole: string;
    contactEmail: string;
    estimatedArrUsd: number;
    industry: string;
  }) => Promise<void>;
  onQualifyLead: (leadId: string) => Promise<void>;
  onInspectMission: (missionId: string) => void;
}

export function SalesOpsView({
  leads,
  isBusy,
  onAddLead,
  onQualifyLead,
  onInspectMission,
}: SalesOpsViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [company, setCompany] = useState('');
  const [domainUrl, setDomainUrl] = useState('https://');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('VP of Engineering');
  const [contactEmail, setContactEmail] = useState('');
  const [estimatedArrUsd, setEstimatedArrUsd] = useState(85000);
  const [industry, setIndustry] = useState('Cloud & SaaS');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !domainUrl.trim()) return;
    await onAddLead({
      company,
      domainUrl,
      contactName,
      contactRole,
      contactEmail,
      estimatedArrUsd,
      industry,
    });
    setCompany('');
    setDomainUrl('https://');
    setContactName('');
    setContactEmail('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-7xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sky-400" />
            Sales Operations &amp; Autonomous Prospect Qualification
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Researches live company domains in an isolated Chromium sandbox, scores ICP fit via
            Python, updates CRM stages, and queues executive outreach for approval.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Prospect Account</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-sky-500/35 bg-[#0b1222] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
        >
          <input
            required
            placeholder="Company Name (e.g. GitHub Enterprise)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
          />
          <input
            required
            placeholder="Live Website URL (https://...)"
            value={domainUrl}
            onChange={(e) => setDomainUrl(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-sky-300"
          />
          <input
            placeholder="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
          />
          <input
            placeholder="Decision Maker Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
          />
          <input
            placeholder="Title / Role"
            value={contactRole}
            onChange={(e) => setContactRole(e.target.value)}
            className="rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Est. ARR ($)"
              value={estimatedArrUsd}
              onChange={(e) => setEstimatedArrUsd(Number(e.target.value))}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-slate-100"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shrink-0 cursor-pointer"
            >
              Save Lead
            </button>
          </div>
        </form>
      )}

      {/* Leads Cards / Pipeline */}
      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-xl border border-slate-800 bg-[#090e1a] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-white">{lead.company}</span>
                  <a
                    href={lead.domainUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    {lead.domainUrl}
                  </a>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      lead.stage === 'contacted'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                        : lead.stage === 'outreach_queued'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                          : lead.stage === 'researching'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {lead.stage.replace('_', ' ')}
                  </span>
                  {lead.icpScore !== undefined && (
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      ICP Fit: {lead.icpScore}/100
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {lead.contactName} ({lead.contactRole}) •{' '}
                  <span className="font-mono text-slate-300">{lead.contactEmail}</span> • Est. ARR{' '}
                  <span className="font-mono text-emerald-400 font-semibold">
                    ${lead.estimatedArrUsd.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lead.lastMissionId && (
                  <button
                    onClick={() => onInspectMission(lead.lastMissionId!)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>Sandbox Proof</span>
                  </button>
                )}
                <button
                  onClick={() => void onQualifyLead(lead.id)}
                  disabled={isBusy || lead.stage === 'researching'}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
                >
                  {lead.stage === 'researching' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Researching Site...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {lead.icpScore !== undefined ? 'Re-Run Research' : 'Qualify & Research in Sandbox'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {lead.detectedSignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {lead.detectedSignals.map((sig, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {sig}
                  </span>
                ))}
              </div>
            )}

            {lead.draftOutreachBody && (
              <div className="rounded-lg border border-slate-800/90 bg-[#060911] p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-sky-300">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Drafted Outreach: {lead.draftOutreachSubject}
                  </span>
                  <span className="text-slate-500">
                    {lead.stage === 'contacted' ? 'Approved & Dispatched ✓' : 'Awaiting Approval'}
                  </span>
                </div>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {lead.draftOutreachBody}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
