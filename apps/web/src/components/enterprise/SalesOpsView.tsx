import { useState } from 'react';
import {
  Globe,
  Plus,
  Play,
  Loader2,
  ExternalLink,
  Mail,
  CheckCircle2,
  X,
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
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242830]">
        <div>
          <h1 className="text-2xl font-semibold text-[#F4F4F5] tracking-tight">
            Sales Operations
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Autonomous prospect research, qualification, CRM updates, and outreach preparation.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm self-start sm:self-auto"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showAdd ? 'Cancel' : 'Add Prospect Account'}</span>
        </button>
      </div>

      {/* Add Lead Form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
        >
          <div className="text-xs font-semibold text-[#F4F4F5]">
            New Prospect Account Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Company Name</label>
              <input
                required
                placeholder="e.g. GitHub Enterprise"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Live Website URL</label>
              <input
                required
                placeholder="https://..."
                value={domainUrl}
                onChange={(e) => setDomainUrl(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#38BDF8] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Industry</label>
              <input
                placeholder="Cloud & SaaS"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Contact Name</label>
              <input
                placeholder="e.g. Elena Rostova"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Role / Job Title</label>
              <input
                placeholder="e.g. VP of Engineering"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Contact Email</label>
              <input
                placeholder="elena@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Estimated ARR ($)</label>
              <input
                type="number"
                placeholder="85000"
                value={estimatedArrUsd}
                onChange={(e) => setEstimatedArrUsd(Number(e.target.value))}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 font-mono text-[#F4F4F5] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] font-semibold text-xs cursor-pointer transition"
            >
              Save Prospect Account
            </button>
          </div>
        </form>
      )}

      {/* Prospect Accounts List */}
      <div className="space-y-4">
        {leads.map((lead) => {
          const isResearching = lead.stage === 'researching';
          return (
            <div
              key={lead.id}
              className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
            >
              {/* Account Card Top Section */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-semibold text-[#F4F4F5]">
                      {lead.company}
                    </span>
                    <a
                      href={lead.domainUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-[#38BDF8] hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3 text-[#6B7280]" />
                      <span>{lead.domainUrl}</span>
                    </a>

                    {/* Subtle Status Pill */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#15181E] border border-[#242830] text-[#9CA3AF]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          lead.stage === 'contacted'
                            ? 'bg-[#34D399]'
                            : lead.stage === 'outreach_queued'
                              ? 'bg-[#FBBF24]'
                              : lead.stage === 'researching'
                                ? 'bg-[#38BDF8]'
                                : 'bg-[#6B7280]'
                        }`}
                      />
                      <span className="capitalize">{lead.stage.replace('_', ' ')}</span>
                    </span>

                    {/* ICP Fit score if present */}
                    {lead.icpScore !== undefined && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                        ICP Fit: {lead.icpScore}/100
                      </span>
                    )}
                  </div>

                  {/* Clean Contact Metadata Row */}
                  <div className="text-xs text-[#9CA3AF] flex items-center gap-2 flex-wrap">
                    <span className="text-[#F4F4F5] font-medium">{lead.contactName}</span>
                    <span className="text-[#6B7280]">·</span>
                    <span>{lead.contactRole}</span>
                    <span className="text-[#6B7280]">·</span>
                    <span className="font-mono text-[#9CA3AF]">{lead.contactEmail}</span>
                    <span className="text-[#6B7280]">·</span>
                    <span>Est. ARR:</span>
                    <span className="font-mono text-[#34D399] font-medium">
                      ${lead.estimatedArrUsd.toLocaleString()}
                    </span>
                    <span className="text-[#6B7280]">·</span>
                    <span className="text-[#6B7280]">{lead.industry}</span>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  {lead.lastMissionId && (
                    <button
                      onClick={() => onInspectMission(lead.lastMissionId!)}
                      className="px-3 py-1.5 rounded-md bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
                      title="Inspect Ed25519 Sandbox Execution Proof"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Sandbox Proof</span>
                    </button>
                  )}

                  <button
                    onClick={() => void onQualifyLead(lead.id)}
                    disabled={isBusy || isResearching}
                    className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Researching Site...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {lead.icpScore !== undefined ? 'Re-Run Research' : 'Qualify in Sandbox'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Detected Signals Tag Row */}
              {lead.detectedSignals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lead.detectedSignals.map((sig, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#15181E] border border-[#242830] text-[#9CA3AF]"
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              )}

              {/* Redesigned Outreach Preview (Professional Email Style) */}
              {lead.draftOutreachBody && (
                <div className="rounded-lg border border-[#242830] bg-[#0D0F12] p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#242830] text-xs">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                      <span className="font-medium text-[#F4F4F5]">Subject:</span>
                      <span className="text-[#9CA3AF] truncate max-w-lg">
                        {lead.draftOutreachSubject}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
                      {lead.stage === 'contacted' ? (
                        <span className="text-[#34D399] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Dispatched ✓</span>
                        </span>
                      ) : (
                        <span className="text-[#FBBF24]">Awaiting Human Approval</span>
                      )}
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="text-xs text-[#9CA3AF] whitespace-pre-wrap leading-relaxed font-sans">
                    {lead.draftOutreachBody}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
