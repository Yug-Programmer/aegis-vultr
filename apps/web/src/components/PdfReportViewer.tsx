import React from 'react';
import { FileText, Download, ExternalLink, ShieldCheck } from 'lucide-react';

interface PdfReportViewerProps {
  src: string;
  filename: string;
  className?: string;
}

export const PdfReportViewer: React.FC<PdfReportViewerProps> = ({
  src,
  filename,
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full bg-[#141414] rounded-lg border border-[#282828] overflow-hidden ${className}`}>
      {/* Top PDF Info & Action Bar */}
      <div className="h-10 px-3 bg-[#1C1C1C] border-b border-[#282828] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded bg-[#F87171]/15 text-[#F87171] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-semibold text-[#F2F2F2] truncate">
            {filename}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F87171]/20 text-[#F87171] font-mono uppercase">
            PDF Document
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#34D399] font-mono">
            <ShieldCheck className="w-3 h-3" />
            <span>Ed25519 Verified</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={src}
            download={filename}
            className="px-2.5 py-1 rounded bg-[#242424] hover:bg-[#2E2E2E] border border-[#333333] text-xs font-mono text-[#D0D0D0] hover:text-[#FFFFFF] flex items-center gap-1.5 cursor-pointer transition"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Download</span>
          </a>

          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-[#282828] text-[#888888] hover:text-[#FFFFFF] cursor-pointer transition"
            title="Open PDF in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded PDF Viewport */}
      <div className="flex-1 w-full h-full min-h-0 bg-[#1E1E1E] relative">
        <iframe
          src={src}
          title={filename}
          className="w-full h-full border-0 select-auto"
        />
      </div>
    </div>
  );
};

