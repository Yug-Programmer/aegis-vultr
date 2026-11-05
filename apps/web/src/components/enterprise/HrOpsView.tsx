import { useState } from 'react';
import {
  UserCheck,
  Plus,
  Play,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Trash2,
  X,
  FileText,
} from 'lucide-react';
import type { HrCandidate } from '@aegis/shared';

interface HrOpsViewProps {
  candidates: HrCandidate[];
  isBusy: boolean;
  onAddCandidate: (payload: {
    candidateName: string;
    email: string;
    appliedRole: string;
    experienceYears: number;
    techStack: string[];
    desiredSalaryUsd: number;
    resumeSummary: string;
    portfolioUrl?: string;
  }) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onScreenCandidate: (candidateId: string) => Promise<void>;
  onInspectMission: (missionId: string) => void;
}

export function HrOpsView({
  candidates,
  isBusy,
  onAddCandidate,
  onDeleteCandidate,
  onScreenCandidate,
  onInspectMission,
}: HrOpsViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [email, setEmail] = useState('');
  const [appliedRole, setAppliedRole] = useState('Staff Distributed Systems Engineer');
  const [experienceYears, setExperienceYears] = useState(6);
  const [techStackInput, setTechStackInput] = useState('Go, Kubernetes, Docker, Rust, Linux, eBPF');
  const [desiredSalaryUsd, setDesiredSalaryUsd] = useState(175000);
  const [resumeSummary, setResumeSummary] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !appliedRole.trim()) return;
    const stack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await onAddCandidate({
      candidateName,
      email: email.trim() || `${candidateName.toLowerCase().replace(/\s+/g, '.')}@candidate-dev.io`,
      appliedRole,
      experienceYears,
      techStack: stack,
      desiredSalaryUsd,
      resumeSummary:
        resumeSummary.trim() ||
        `Senior engineer with ${experienceYears} years background in ${stack.slice(0, 3).join(', ')}.`,
      portfolioUrl: portfolioUrl.trim() || undefined,
    });

    setCandidateName('');
    setEmail('');
    setResumeSummary('');
    setPortfolioUrl('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242830]">
        <div>
          <h1 className="text-2xl font-semibold text-[#F4F4F5] tracking-tight">
            HR &amp; Recruitment Operations
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Automated resume parsing, sandbox skill-matrix scoring, tailored interview guide synthesis, and offer workflows.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm self-start sm:self-auto"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showAdd ? 'Cancel' : 'Add Candidate Profile'}</span>
        </button>
      </div>

      {/* Add Candidate Form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
        >
          <div className="text-xs font-semibold text-[#F4F4F5]">
            New Candidate Screening Application
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Candidate Full Name</label>
              <input
                required
                placeholder="e.g. Maya Lin"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Candidate Email</label>
              <input
                placeholder="maya.lin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Applied Target Role</label>
              <input
                required
                placeholder="Staff Systems Engineer"
                value={appliedRole}
                onChange={(e) => setAppliedRole(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Years of Relevant Experience</label>
              <input
                type="number"
                min="0"
                max="30"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Target Desired Salary ($/yr)</label>
              <input
                type="number"
                step="5000"
                value={desiredSalaryUsd}
                onChange={(e) => setDesiredSalaryUsd(Number(e.target.value))}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1">Portfolio or GitHub URL</label>
              <input
                placeholder="https://github.com/..."
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#38BDF8] font-mono outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] text-[#9CA3AF] mb-1">
                Tech Stack / Key Competencies (Comma-separated)
              </label>
              <input
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="Go, Kubernetes, Docker, Rust, eBPF, Distributed Systems"
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] text-[#9CA3AF] mb-1">
                Resume Overview / Technical Highlights
              </label>
              <textarea
                rows={2}
                value={resumeSummary}
                onChange={(e) => setResumeSummary(e.target.value)}
                placeholder="Key accomplishments, open source projects, architecture highlights, or past impact..."
                className="w-full rounded-md bg-[#0B0D10] border border-[#242830] focus:border-[#38BDF8] px-3 py-2 text-[#F4F4F5] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0B0D10] font-semibold text-xs cursor-pointer transition"
            >
              Save Candidate Profile
            </button>
          </div>
        </form>
      )}

      {/* Candidates List */}
      <div className="space-y-4">
        {candidates.length === 0 ? (
          <div className="rounded-lg border border-[#242830] bg-[#111419] p-8 text-center text-[#9CA3AF] text-xs">
            No candidates yet. Click &ldquo;Add Candidate Profile&rdquo; to input any applicant, or click the header menu to reset sample data.
          </div>
        ) : (
          candidates.map((cand) => {
            const isScreening = cand.status === 'screening';
            return (
              <div
                key={cand.id}
                className="rounded-lg border border-[#242830] bg-[#111419] p-5 space-y-4"
              >
                {/* Top Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-semibold text-[#F4F4F5]">
                        {cand.candidateName}
                      </span>
                      <span className="text-xs font-mono text-[#9CA3AF]">
                        {cand.email}
                      </span>

                      {cand.isUserCreated && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                          Custom Record
                        </span>
                      )}

                      {/* Status Pill */}
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#15181E] border border-[#242830] text-[#9CA3AF]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cand.status === 'interview_scheduled'
                              ? 'bg-[#34D399]'
                              : cand.status === 'screened'
                                ? 'bg-[#38BDF8]'
                                : cand.status === 'screening'
                                  ? 'bg-[#FBBF24]'
                                  : 'bg-[#6B7280]'
                          }`}
                        />
                        <span className="capitalize">{cand.status.replace('_', ' ')}</span>
                      </span>

                      {/* Match Fit Score */}
                      {cand.fitScore !== undefined && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/20">
                          Competency Fit: {cand.fitScore}/100
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#9CA3AF] flex items-center gap-2 flex-wrap">
                      <span className="text-[#F4F4F5] font-medium">{cand.appliedRole}</span>
                      <span className="text-[#6B7280]">·</span>
                      <span>{cand.experienceYears} Years Exp</span>
                      <span className="text-[#6B7280]">·</span>
                      <span>Target:</span>
                      <span className="font-mono text-[#34D399] font-medium">
                        ${cand.desiredSalaryUsd.toLocaleString()}
                      </span>
                      {cand.portfolioUrl && (
                        <>
                          <span className="text-[#6B7280]">·</span>
                          <a
                            href={cand.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#38BDF8] hover:underline font-mono"
                          >
                            Portfolio ↗
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    {cand.lastMissionId && (
                      <button
                        onClick={() => onInspectMission(cand.lastMissionId!)}
                        className="px-3 py-1.5 rounded-md bg-[#15181E] hover:bg-[#242830] border border-[#242830] text-[#9CA3AF] hover:text-[#F4F4F5] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
                        title="Inspect Ed25519 Sandbox Execution Proof"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Sandbox Proof</span>
                      </button>
                    )}

                    <button
                      onClick={() => void onScreenCandidate(cand.id)}
                      disabled={isBusy || isScreening}
                      className="px-3.5 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#0B0D10] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      {isScreening ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Screening in Sandbox...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {cand.fitScore !== undefined ? 'Re-Screen Candidate' : 'Screen Candidate'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => void onDeleteCandidate(cand.id)}
                      className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F87171] hover:bg-[#242830] transition cursor-pointer"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cand.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#15181E] border border-[#242830] text-[#9CA3AF]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Resume Summary */}
                <div className="text-xs text-[#9CA3AF] leading-relaxed bg-[#0D0F12] p-3 rounded border border-[#242830]">
                  <span className="font-semibold text-[#F4F4F5] mr-1.5">Resume Bio:</span>
                  {cand.resumeSummary}
                </div>

                {/* Evaluation Summary */}
                {cand.evaluationSummary && (
                  <div className="rounded-lg border border-[#242830] bg-[#0D0F12] p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#34D399] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sandbox Evaluation Findings:</span>
                    </div>
                    <div className="text-[#9CA3AF] leading-relaxed">
                      {cand.evaluationSummary}
                    </div>
                  </div>
                )}

                {/* Interview Guide Snippet */}
                {cand.interviewGuide && (
                  <div className="rounded-lg border border-[#242830] bg-[#0D0F12] p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#38BDF8] font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Synthesized Technical Interview Guide (Ready for Hiring Panel):</span>
                    </div>
                    <pre className="text-[11px] font-mono text-[#9CA3AF] whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {cand.interviewGuide}
                    </pre>
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
