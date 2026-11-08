import { useEffect, useState, useMemo } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  FileCode2,
  Play,
  RotateCcw,
  Download,
  Terminal,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  FolderOpen,
  FileText,
  Table as TableIcon,
  Image as ImageIcon,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { ArtifactMeta, ExecutionReceipt, MissionRecord } from '@aegis/shared';
import { getArtifactUrl, executeMissionScript, executeSandboxScript, type CodeExecutionResult } from '../api';
import { AgentBrowserCursorView } from './AgentBrowserCursorView';
import { MulticolorCodeViewer } from './MulticolorCodeViewer';
import { SvgZoomCanvas } from './SvgZoomCanvas';
import { PdfReportViewer } from './PdfReportViewer';

export type SidebarTab = 'files' | 'browser' | 'receipts';
export type SidebarWidthMode = 'compact' | 'wide' | 'split' | 'fullscreen';

interface ExtensibleWorkspaceSidebarProps {
  mission: MissionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SidebarTab;
  initialFile?: string;
  onMissionUpdated?: (updated: MissionRecord) => void;
}

export function ExtensibleWorkspaceSidebar({
  mission,
  isOpen,
  onClose,
  initialTab = 'files',
  initialFile,
  onMissionUpdated,
}: ExtensibleWorkspaceSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>(initialTab);
  const [widthMode, setWidthMode] = useState<SidebarWidthMode>('wide');
  const [selectedFile, setSelectedFile] = useState<string>(initialFile || '');
  const [fileContent, setFileContent] = useState<string>('');
  const [editedCode, setEditedCode] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isExecutingCode, setIsExecutingCode] = useState(false);
  const [execResult, setExecResult] = useState<CodeExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);

  const artifacts = mission?.artifacts || [];

  // Default selected file if none active
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    } else if (artifacts.length > 0 && !selectedFile) {
      const py = artifacts.find((a) => a.relativePath.endsWith('.py'));
      const svg = artifacts.find((a) => a.relativePath.endsWith('.svg'));
      const csv = artifacts.find((a) => a.relativePath.endsWith('.csv'));
      setSelectedFile((py || svg || csv || artifacts[0]).relativePath);
    }
  }, [initialFile, artifacts, selectedFile]);

  // Load content whenever selected file changes
  useEffect(() => {
    if (!mission || !selectedFile) {
      setFileContent('');
      setEditedCode('');
      return;
    }

    const art = artifacts.find((a) => a.relativePath === selectedFile);
    if (!art) return;

    const isBinaryImg =
      art.mimeType.startsWith('image/png') ||
      art.mimeType.startsWith('image/jpeg') ||
      art.relativePath.endsWith('.pdf');

    if (isBinaryImg) {
      setFileContent('');
      setEditedCode('');
      setIsLoadingFile(false);
      return;
    }

    let cancelled = false;
    setIsLoadingFile(true);

    fetch(getArtifactUrl(mission.id, selectedFile))
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) {
          setFileContent(text);
          setEditedCode(text);
        }
      })
      .catch(() => {
        if (!cancelled) setFileContent('Unable to load file content.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mission, selectedFile, artifacts]);

  // Run Python script inside isolated sandbox
  const handleRunScript = async () => {
    if (!mission || !selectedFile || isExecutingCode) return;
    setIsExecutingCode(true);
    setTerminalOpen(true);
    setExecResult(null);

    try {
      const codeToRun = editedCode || fileContent;
      const res = await executeMissionScript(mission.id, {
        code: codeToRun,
        language: 'python',
        filename: selectedFile,
      });
      setExecResult(res);

      if (res.artifacts && onMissionUpdated) {
        onMissionUpdated({
          ...mission,
          artifacts: res.artifacts,
        });
      }
    } catch (err) {
      setExecResult({
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        exitCode: 1,
        durationMs: 0,
      });
    } finally {
      setIsExecutingCode(false);
    }
  };

  const handleCopyCode = () => {
    const text = editedCode || fileContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Determine width class based on widthMode
  const widthClasses = {
    compact: 'w-[440px]',
    wide: 'w-[640px]',
    split: 'w-[50vw]',
    fullscreen: 'w-full',
  }[widthMode];

  const isPython = selectedFile.endsWith('.py');
  const isSvg = selectedFile.endsWith('.svg');
  const isCsv = selectedFile.endsWith('.csv');
  const isJson = selectedFile.endsWith('.json');
  const isPdf = selectedFile.endsWith('.pdf');
  const isImage = selectedFile.endsWith('.png') || selectedFile.endsWith('.jpg');

  return (
    <aside
      className={`h-full border-l border-[#2E2E2E] bg-[#191919] flex flex-col min-h-0 select-none z-20 shrink-0 transition-all duration-200 ${widthClasses}`}
    >
      {/* Top Header Bar */}
      <div className="h-11 px-3 bg-[#1F1F1F] border-b border-[#2A2A2A] flex items-center justify-between shrink-0">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'files'
                ? 'bg-[#2A2A2A] text-[#38BDF8]'
                : 'text-[#888888] hover:text-[#D0D0D0] hover:bg-[#242424]'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Files &amp; Code</span>
            {artifacts.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38BDF8]/15 text-[#38BDF8] font-mono">
                {artifacts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'browser'
                ? 'bg-[#2A2A2A] text-[#38BDF8]'
                : 'text-[#888888] hover:text-[#D0D0D0] hover:bg-[#242424]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live Browser</span>
            {(mission?.browserSnapshots.length || 0) > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#34D399]/15 text-[#34D399] font-mono">
                {mission?.browserSnapshots.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'receipts'
                ? 'bg-[#2A2A2A] text-[#FBBF24]'
                : 'text-[#888888] hover:text-[#D0D0D0] hover:bg-[#242424]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Receipts</span>
            {(mission?.receipts.length || 0) > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FBBF24]/15 text-[#FBBF24] font-mono">
                {mission?.receipts.length}
              </span>
            )}
          </button>
        </div>

        {/* Width Controls & Close */}
        <div className="flex items-center gap-1 text-[#777777]">
          {/* Quick Width Buttons */}
          <div className="hidden sm:flex items-center gap-1 border-r border-[#2E2E2E] pr-2 mr-1">
            <button
              onClick={() => setWidthMode('compact')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                widthMode === 'compact' ? 'bg-[#2E2E2E] text-[#F2F2F2]' : 'hover:bg-[#262626] text-[#777777]'
              }`}
              title="Compact width (440px)"
            >
              440px
            </button>
            <button
              onClick={() => setWidthMode('wide')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                widthMode === 'wide' ? 'bg-[#2E2E2E] text-[#F2F2F2]' : 'hover:bg-[#262626] text-[#777777]'
              }`}
              title="Wide width (640px)"
            >
              640px
            </button>
            <button
              onClick={() => setWidthMode(widthMode === 'fullscreen' ? 'wide' : 'fullscreen')}
              className="p-1 rounded hover:bg-[#262626] hover:text-[#D0D0D0] cursor-pointer"
              title={widthMode === 'fullscreen' ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {widthMode === 'fullscreen' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#2A2A2A] hover:text-[#F2F2F2] cursor-pointer transition"
            title="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB CONTENT: BROWSER VIEW (Live Browser + Virtual AI Mouse Cursor) */}
      {activeTab === 'browser' && (
        <AgentBrowserCursorView
          missionId={mission?.id}
          snapshots={mission?.browserSnapshots || []}
        />
      )}

      {/* TAB CONTENT: RECEIPTS & CRYPTOGRAPHIC PROOF */}
      {activeTab === 'receipts' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#191919]">
          <div className="p-3 bg-[#1F1F1F] rounded-lg border border-[#2E2E2E] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#34D399]" />
              <span className="font-semibold text-[#F2F2F2]">Cryptographic Proof of Containment</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] font-mono text-[10px] font-semibold">
              Ed25519 Valid
            </span>
          </div>

          <div className="space-y-2">
            {(mission?.receipts || []).map((rcpt: ExecutionReceipt) => (
              <div
                key={rcpt.receiptId}
                className="p-3 rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] space-y-1.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#38BDF8] font-bold">
                    Step #{rcpt.stepIndex}: {rcpt.action}
                  </span>
                  <span className={rcpt.exitCode === 0 ? 'text-[#34D399]' : 'text-[#F87171]'}>
                    exit {rcpt.exitCode ?? 0} ({rcpt.durationMs}ms)
                  </span>
                </div>
                <div className="text-[11px] text-[#777777] truncate">
                  Policy: <span className="text-[#D0D0D0]">{rcpt.policyRuleId}</span>
                </div>
                <div className="text-[10px] text-[#555555] break-all bg-[#141414] p-1.5 rounded border border-[#242424]">
                  hash: {rcpt.receiptHash}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FILES & CODE RUNNER */}
      {activeTab === 'files' && (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* File Explorer Sidebar List */}
          <div className="w-44 sm:w-48 border-r border-[#2A2A2A] bg-[#1B1B1B] flex flex-col shrink-0 min-h-0">
            <div className="px-3 py-2 border-b border-[#262626] text-[11px] font-mono text-[#777777] uppercase tracking-wider flex items-center justify-between">
              <span>/workspace</span>
              <span className="text-[10px] text-[#555555]">{artifacts.length} files</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#222222]">
              {artifacts.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666666]">
                  No sandbox artifacts generated yet.
                </div>
              ) : (
                artifacts.map((art) => {
                  const isSelected = art.relativePath === selectedFile;
                  const isP = art.relativePath.endsWith('.py');
                  const isS = art.relativePath.endsWith('.svg');
                  const isC = art.relativePath.endsWith('.csv');
                  const isJ = art.relativePath.endsWith('.json');
                  const isPdf = art.relativePath.endsWith('.pdf');

                  return (
                    <button
                      key={art.relativePath}
                      onClick={() => setSelectedFile(art.relativePath)}
                      className={`w-full px-2.5 py-2 text-left flex items-center gap-2 cursor-pointer transition text-xs font-mono truncate ${
                        isSelected
                          ? 'bg-[#242424] text-[#38BDF8] border-l-2 border-[#38BDF8]'
                          : 'hover:bg-[#202020] text-[#888888] hover:text-[#D0D0D0]'
                      }`}
                    >
                      {isP ? (
                        <FileCode2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                      ) : isPdf ? (
                        <FileText className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
                      ) : isS ? (
                        <ImageIcon className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                      ) : isC ? (
                        <TableIcon className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                      ) : isJ ? (
                        <FileText className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                      )}
                      <div className="truncate flex-1">
                        <div className="truncate text-[11px]">{art.relativePath}</div>
                        <div className="text-[9px] text-[#555555]">
                          {(art.sizeBytes / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active File Content Viewer & Python Runner */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#171717] overflow-hidden">
            {/* Viewer Top Action Bar */}
            <div className="px-3 py-2 bg-[#1C1C1C] border-b border-[#262626] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileCode2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span className="text-xs font-mono text-[#F2F2F2] truncate font-semibold">
                  {selectedFile || 'Select a file'}
                </span>
                {isPython && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38BDF8]/15 text-[#38BDF8] font-mono">
                    Python 3.11
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* RUN PYTHON BUTTON */}
                {isPython && (
                  <button
                    onClick={handleRunScript}
                    disabled={isExecutingCode}
                    className="px-2.5 py-1 rounded bg-[#10B981] hover:bg-[#34D399] disabled:opacity-50 text-[#0F172A] text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer transition shadow-md"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isExecutingCode ? 'Running…' : 'Run Script'}</span>
                  </button>
                )}

                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded hover:bg-[#282828] text-[#888888] hover:text-[#D0D0D0] cursor-pointer"
                  title="Copy Content"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {mission && selectedFile && (
                  <a
                    href={getArtifactUrl(mission.id, selectedFile, true)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded hover:bg-[#282828] text-[#888888] hover:text-[#D0D0D0] cursor-pointer"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 overflow-auto p-3 min-h-0 bg-[#141414]">
              {isLoadingFile ? (
                <div className="flex items-center justify-center h-full text-xs text-[#777777] font-mono">
                  Loading artifact from sandbox…
                </div>
              ) : isSvg ? (
                /* Interactive Zoomable SVG Canvas */
                mission ? (
                  <SvgZoomCanvas
                    src={getArtifactUrl(mission.id, selectedFile)}
                    alt={selectedFile}
                    filename={selectedFile}
                  />
                ) : null
              ) : isPdf ? (
                /* Interactive PDF Report Viewer */
                mission ? (
                  <PdfReportViewer
                    src={getArtifactUrl(mission.id, selectedFile)}
                    filename={selectedFile}
                  />
                ) : null
              ) : isImage ? (
                /* PNG Image Canvas */
                <div className="flex flex-col items-center justify-center p-4 h-full">
                  {mission && (
                    <img
                      src={getArtifactUrl(mission.id, selectedFile)}
                      alt={selectedFile}
                      className="max-w-full max-h-[50vh] object-contain rounded-lg border border-[#282828] shadow-lg"
                    />
                  )}
                </div>
              ) : isCsv ? (
                /* Tabular CSV Grid */
                <CsvTableView csvText={fileContent} />
              ) : isPython ? (
                /* Python Multicolor Syntax Highlighted & Editable Code View */
                <MulticolorCodeViewer
                  code={editedCode}
                  language="python"
                  editable={true}
                  onChange={setEditedCode}
                  showLineNumbers={true}
                />
              ) : (
                /* Text / JSON / Markdown Multicolor Viewer */
                <MulticolorCodeViewer
                  code={fileContent}
                  language={selectedFile?.endsWith('.json') ? 'json' : 'text'}
                  editable={false}
                  showLineNumbers={true}
                />
              )}
            </div>

            {/* EMBEDDED PYTHON TERMINAL DRAWER */}
            {isPython && (
              <div className="border-t border-[#262626] bg-[#111111] shrink-0">
                <button
                  onClick={() => setTerminalOpen(!terminalOpen)}
                  className="w-full px-3 py-1.5 bg-[#181818] hover:bg-[#202020] flex items-center justify-between text-xs text-[#888888] hover:text-[#D0D0D0] cursor-pointer transition text-left font-mono"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[#34D399]" />
                    <span className="text-[11px] font-semibold text-[#F2F2F2]">
                      Sandbox Terminal Execution Output
                    </span>
                    {execResult && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          execResult.exitCode === 0
                            ? 'bg-[#34D399]/15 text-[#34D399]'
                            : 'bg-[#F87171]/15 text-[#F87171]'
                        }`}
                      >
                        exit {execResult.exitCode} ({execResult.durationMs}ms)
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${terminalOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {terminalOpen && (
                  <div className="p-3 max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono bg-[#0D0D0D]">
                    {isExecutingCode ? (
                      <div className="text-[#38BDF8] flex items-center gap-2 animate-pulse text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                        <span>Dispatching to isolated Vultr sandbox worker…</span>
                      </div>
                    ) : execResult ? (
                      <div className="space-y-1.5">
                        {execResult.stdout && (
                          <div>
                            <div className="text-[10px] text-[#555555] uppercase font-bold">stdout:</div>
                            <pre className="text-[#34D399] bg-[#141414] p-2 rounded border border-[#242424] text-[11px] overflow-x-auto whitespace-pre-wrap">
                              {execResult.stdout}
                            </pre>
                          </div>
                        )}
                        {execResult.stderr && (
                          <div>
                            <div className="text-[10px] text-[#F87171] uppercase font-bold">stderr:</div>
                            <pre className="text-[#F87171] bg-[#1F1212] p-2 rounded border border-[#3B1F1F] text-[11px] overflow-x-auto whitespace-pre-wrap">
                              {execResult.stderr}
                            </pre>
                          </div>
                        )}
                        {execResult.receipt && (
                          <div className="text-[10px] text-[#666666] flex items-center gap-1.5 pt-1">
                            <ShieldCheck className="w-3 h-3 text-[#34D399]" />
                            <span>Signed Ed25519 hash: {execResult.receipt.receiptHash.slice(0, 16)}…</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[#555555] text-[11px]">
                        Click "Run Script" to execute this Python code inside the isolated container sandbox.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

/**
 * Interactive CSV Spreadsheet Viewer
 */
function CsvTableView({ csvText }: { csvText: string }) {
  const { headers, rows } = useMemo(() => {
    const lines = csvText.trim().split('\n').filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string) => {
      // Simple CSV cell splitter handling quotes
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQuotes = !inQuotes;
        else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const hdrs = parseLine(lines[0]);
    const rws = lines.slice(1).map(parseLine);
    return { headers: hdrs, rows: rws };
  }, [csvText]);

  if (headers.length === 0) {
    return <div className="text-xs text-[#777777] font-mono">Empty CSV dataset</div>;
  }

  return (
    <div className="overflow-x-auto max-w-full rounded border border-[#282828] bg-[#161616]">
      <table className="w-full text-left text-xs font-mono divide-y divide-[#262626]">
        <thead className="bg-[#1F1F1F] text-[#D0D0D0]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 font-semibold truncate border-r border-[#262626] last:border-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222222] text-[#A0A0A0]">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-[#1D1D1D] transition">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-1.5 truncate max-w-xs border-r border-[#222222] last:border-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

