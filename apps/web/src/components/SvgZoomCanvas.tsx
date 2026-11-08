import React, { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Download } from 'lucide-react';

interface SvgZoomCanvasProps {
  src: string;
  alt?: string;
  filename?: string;
  className?: string;
}

export const SvgZoomCanvas: React.FC<SvgZoomCanvasProps> = ({
  src,
  alt = 'SVG Canvas',
  filename = 'vector_graphic.svg',
  className = '',
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.25));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => {
      const next = prev + delta;
      return Math.min(Math.max(Number(next.toFixed(2)), 0.25), 4.0);
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-[#111111] overflow-hidden select-none ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Floating Zoom & Pan Control Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1A1A]/90 backdrop-blur-md border border-[#2E2E2E] shadow-xl text-xs font-mono">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="p-1 rounded-full hover:bg-[#282828] text-[#A0A0A0] hover:text-[#FFFFFF] cursor-pointer transition"
          title="Zoom Out (Scroll Down)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="px-2 py-0.5 rounded hover:bg-[#262626] text-[#38BDF8] font-bold text-[11px] cursor-pointer transition"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="p-1 rounded-full hover:bg-[#282828] text-[#A0A0A0] hover:text-[#FFFFFF] cursor-pointer transition"
          title="Zoom In (Scroll Up)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className="w-[1px] h-3 bg-[#333333] mx-0.5" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="p-1 rounded-full hover:bg-[#282828] text-[#A0A0A0] hover:text-[#FFFFFF] cursor-pointer transition"
          title="Reset Pan & Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <a
          href={src}
          download={filename}
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-full hover:bg-[#282828] text-[#A0A0A0] hover:text-[#38BDF8] cursor-pointer transition"
          title="Download Vector SVG"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Grid Pattern Viewport Container */}
      <div
        className="flex-1 w-full h-full flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle, #262626 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        onDoubleClick={handleReset}
      >
        <div
          className="transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg shadow-2xl border border-[#2A2A2A] bg-[#090D16]"
          />
        </div>
      </div>

      {/* Micro-hint Footer */}
      <div className="absolute bottom-2 right-3 z-10 text-[10px] text-[#666666] font-mono pointer-events-none">
        Scroll to zoom · Drag to pan · Double-click to reset
      </div>
    </div>
  );
};

