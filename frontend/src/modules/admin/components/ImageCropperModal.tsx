import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { X, ZoomIn, ZoomOut, Check, Move } from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onConfirm: (croppedBlob: Blob, croppedPreviewUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropperModal({ isOpen, imageSrc, onConfirm, onCancel }: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);

  // Reset cropper state when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen) return null;

  // Handle drag starts
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Handle drag movements
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleMouseMove = (e: any) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: any) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Stop dragging
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Canvas Crop & Save
  const handleCropConfirm = () => {
    const img = imgRef.current;
    const mask = maskRef.current;
    if (!img || !mask) return;

    // Get the current render dimensions and offsets of the image and mask frame
    const imgRect = img.getBoundingClientRect();
    const maskRect = mask.getBoundingClientRect();

    // Compute ratios of natural dimensions to layout dimensions
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    // Calculate crop rectangle relative to the image coordinates
    const cropX = (maskRect.left - imgRect.left) * scaleX;
    const cropY = (maskRect.top - imgRect.top) * scaleY;
    const cropWidth = maskRect.width * scaleX;
    const cropHeight = maskRect.height * scaleY;

    // Draw the selection onto an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = 400; // Standard avatar output resolution
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Clear canvas to white/transparent
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 400);

      // Perform crop
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        400,
        400
      );
    }

    // Convert canvas to Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedUrl = URL.createObjectURL(blob);
          onConfirm(blob, croppedUrl);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#241C1C", border: "1px solid #3A2A2A" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
          <div className="flex items-center gap-2">
            <Move size={16} color="#D84040" />
            <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Crop & Align Avatar</h3>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport container */}
        <div className="relative w-full aspect-square bg-[#120D0D] flex items-center justify-center overflow-hidden select-none">
          {/* Draggable Image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Source avatar"
            className="absolute max-w-none origin-center cursor-grab active:cursor-grabbing transition-transform duration-75"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              maxHeight: "100%",
              pointerEvents: "auto",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
            onDragStart={(e) => e.preventDefault()}
          />

          {/* Mask circle overlay - visually masks the viewport */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* The circular crop guide */}
            <div 
              ref={maskRef}
              className="w-64 h-64 rounded-full border-2 border-[#D84040] shadow-[0_0_0_9999px_rgba(18,13,13,0.7)]"
            />
          </div>

          <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-full text-[10px] text-white/50 tracking-wider uppercase font-medium pointer-events-none">
            Drag to reposition
          </div>
        </div>

        {/* Zoom Slider Controls */}
        <div className="px-6 py-5 space-y-4" style={{ background: "#1D1616", borderTop: "1px solid #2A1F1F" }}>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(1.0, prev - 0.1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-800 transition-colors border border-[#3A2A2A]"
              style={{ background: "#241C1C", color: "#EEEEEE" }}
            >
              <ZoomOut size={14} />
            </button>
            
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#D84040] cursor-pointer h-1.5 bg-[#3A2A2A] rounded-lg appearance-none"
            />

            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(3.0, prev + 0.1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-800 transition-colors border border-[#3A2A2A]"
              style={{ background: "#241C1C", color: "#EEEEEE" }}
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <span>Position: X: {position.x}px, Y: {position.y}px</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div 
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ background: "#241C1C", borderTop: "1px solid #2A1F1F" }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg transition-all border border-[#3A2A2A]"
            style={{ background: "#1D1616", color: "#888", fontSize: "13px" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleCropConfirm}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg transition-all font-semibold"
            style={{ background: "#D84040", color: "#fff", fontSize: "13px" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#c03030"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#D84040"; }}
          >
            <Check size={14} /> Crop & Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
