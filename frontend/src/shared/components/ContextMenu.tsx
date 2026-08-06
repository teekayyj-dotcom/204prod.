import React, { useEffect, useRef } from "react";

export interface ContextMenuItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Slight delay to avoid immediate closure from the right click event if it propagates
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
    }, 10);
    
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
    };
  }, [onClose]);

  // Ensure menu doesn't go off-screen
  const safeX = Math.min(x, window.innerWidth - 220);
  const safeY = Math.min(y, window.innerHeight - (items.length * 40 + 20));

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] rounded-xl shadow-2xl py-2 flex flex-col min-w-[200px]"
      style={{
        left: safeX,
        top: safeY,
        background: "rgba(36, 28, 28, 0.95)",
        border: "1px solid rgba(46, 32, 32, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left w-full"
          style={{ 
            color: item.danger ? "#f87171" : "#EEEEEE",
            fontSize: "13px",
            fontWeight: 500
          }}
        >
          {item.icon && <span className="opacity-70">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}
