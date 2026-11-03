import { useEffect, useState } from 'react';
import { FolderOpen, Download, FileText, Image as ImageIcon, Eye } from 'lucide-react';
import type { ArtifactMeta } from '@aegis/shared';
import { getArtifactUrl } from '../api';

interface ArtifactExplorerProps {
  missionId?: string;
  artifacts: ArtifactMeta[];
  selectedPath?: string;
  onSelectPath: (path: string) => void;
}

export function ArtifactExplorer({
  missionId,
  artifacts,
  selectedPath,
  onSelectPath,
}: ArtifactExplorerProps) {
  const [textContent, setTextContent] = useState<string>('');
  const [loadingText, setLoadingText] = useState(false);

  const preferredDefault =
    artifacts.find((a) => a.relativePath.endsWith('.svg'))?.relativePath ||
    artifacts.find((a) => a.relativePath.endsWith('.html'))?.relativePath ||
    artifacts[0]?.relativePath;

  const activePath =
    selectedPath && artifacts.some((a) => a.relativePath === selectedPath)
      ? selectedPath
      : preferredDefault;

  const activeArtifact = artifacts.find((a) => a.relativePath === activePath);

  useEffect(() => {
    if (!missionId || !activeArtifact) {
      setTextContent('');
      return;
    }
    const isImage =
      activeArtifact.mimeType.startsWith('image/png') ||
      activeArtifact.mimeType.startsWith('image/jpeg') ||
      activeArtifact.mimeType === 'image/svg+xml';

    if (isImage) {
      setTextContent('');
      return;
    }

    let cancelled = false;
    setLoadingText(true);
    fetch(getArtifactUrl(missionId, activeArtifact.relativePath))
      .then((r) => r.text())
      .then((txt) => {
        if (!cancelled) setTextContent(txt);
      })
      .catch(() => {
        if (!cancelled) setTextContent('Unable to load preview.');
      })
      .finally(() => {
        if (!cancelled) setLoadingText(false);
      });

    return () => {
      cancelled = true;
    };
  }, [missionId, activeArtifact]);

  if (!missionId || artifacts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[#6B7280]">
        <FolderOpen className="w-8 h-8 text-[#242830] mb-2" />
        <p className="font-medium text-[#9CA3AF] mb-1">/workspace is Empty</p>
        <p className="max-w-xs leading-relaxed text-[#6B7280]">
          Files, SVG charts, CSV datasets, and reports created inside the sandbox will appear here
          with live previews and SHA-256 integrity digests.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* File List */}
      <div className="rounded-lg border border-[#242830] bg-[#111419] divide-y divide-[#242830] max-h-48 overflow-y-auto">
        {artifacts.map((art) => {
          const isImg = art.mimeType.startsWith('image/');
          const selected = art.relativePath === activePath;
          return (
            <div
              key={art.relativePath}
              onClick={() => onSelectPath(art.relativePath)}
              className={`px-3 py-2 flex items-center justify-between gap-2 text-xs cursor-pointer transition ${
                selected
                  ? 'bg-[#15181E] text-[#F4F4F5]'
                  : 'hover:bg-[#15181E] text-[#9CA3AF]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isImg ? (
                  <ImageIcon className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                )}
                <span className="font-mono text-[11px] truncate">{art.relativePath}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-[#6B7280]">
                  {(art.sizeBytes / 1024).toFixed(1)} KB
                </span>
                <a
                  href={getArtifactUrl(missionId, art.relativePath, true)}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-[#242830] text-[#6B7280] hover:text-[#F4F4F5] transition"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Preview Panel */}
      {activeArtifact && (
        <div className="rounded-lg border border-[#242830] bg-[#111419] overflow-hidden">
          <div className="px-3 py-2 bg-[#0D0F12] border-b border-[#242830] flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-[#F4F4F5] truncate">
              <Eye className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span className="truncate">{activeArtifact.relativePath}</span>
            </div>
            <span className="text-[#6B7280] shrink-0">
              sha256:{activeArtifact.sha256.slice(0, 14)}...
            </span>
          </div>

          <div className="p-3">
            {activeArtifact.mimeType.startsWith('image/') ? (
              <img
                src={`${getArtifactUrl(missionId, activeArtifact.relativePath)}&v=${activeArtifact.sha256.slice(0, 8)}`}
                alt={activeArtifact.name}
                className="w-full h-auto rounded border border-[#242830] bg-[#0B0D10]"
              />
            ) : activeArtifact.relativePath.endsWith('.html') ? (
              <iframe
                title={activeArtifact.name}
                sandbox=""
                srcDoc={textContent}
                className="w-full h-80 rounded border border-[#242830] bg-[#0B0D10]"
              />
            ) : loadingText ? (
              <div className="text-xs text-[#6B7280] py-6 text-center">Loading artifact...</div>
            ) : (
              <pre className="text-[11px] font-mono text-[#F4F4F5] whitespace-pre-wrap break-words max-h-96 overflow-y-auto leading-relaxed bg-[#0B0D10] p-3 rounded border border-[#242830]">
                {textContent}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
