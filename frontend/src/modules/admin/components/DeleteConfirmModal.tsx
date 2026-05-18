import { useEffect } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Human-readable label, e.g. "category", "project", "client" */
  itemType: string;
  /** The specific name of the record being deleted */
  itemName: string;
  /** Called when the user clicks "Confirm Delete" */
  onConfirm: () => void;
  /** Called when the user clicks "Cancel" or presses Escape */
  onCancel: () => void;
  /** Shows spinner on the Confirm button while backend work runs */
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  itemType,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  const label =
    itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
      }}
      onClick={() => !isDeleting && onCancel()}
    >
      {/* Panel */}
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "#241C1C",
          border: "1px solid #3A2020",
          width: "440px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(216,64,64,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top bar: danger stripe ── */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(to right, #8E1616, #D84040, #FF6B6B)",
          }}
        />

        {/* ── Body ── */}
        <div className="px-7 pt-7 pb-5">
          {/* Warning icon + close row */}
          <div className="flex items-start justify-between mb-5">
            {/* Icon */}
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: "56px",
                height: "56px",
                background:
                  "radial-gradient(circle at 40% 40%, rgba(216,64,64,0.22), rgba(142,22,22,0.12))",
                border: "1px solid rgba(216,64,64,0.3)",
                boxShadow: "0 0 20px rgba(216,64,64,0.15)",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={26} color="#D84040" />
            </div>

            {/* Dismiss (X) */}
            <button
              onClick={() => !isDeleting && onCancel()}
              disabled={isDeleting}
              className="flex items-center justify-center rounded-lg transition-all"
              style={{
                width: "30px",
                height: "30px",
                background: "#2A1F1F",
                border: "1px solid #3A2A2A",
                color: "#666",
                cursor: isDeleting ? "not-allowed" : "pointer",
                opacity: isDeleting ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  (e.currentTarget as HTMLElement).style.color = "#EEEEEE";
                  (e.currentTarget as HTMLElement).style.borderColor = "#D84040";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#666";
                (e.currentTarget as HTMLElement).style.borderColor = "#3A2A2A";
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Title */}
          <h2
            style={{
              color: "#EEEEEE",
              fontSize: "18px",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "6px",
            }}
          >
            Delete {label}
          </h2>

          {/* Item name chip */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg mb-5"
            style={{
              background: "rgba(216,64,64,0.09)",
              border: "1px solid rgba(216,64,64,0.22)",
            }}
          >
            <Trash2 size={12} color="#D84040" />
            <span
              style={{
                color: "#D84040",
                fontSize: "13px",
                fontWeight: 600,
                maxWidth: "320px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {itemName}
            </span>
          </div>

          {/* Warning message */}
          <p
            style={{
              color: "#AAA",
              fontSize: "13px",
              lineHeight: "1.7",
              marginBottom: "16px",
            }}
          >
            Are you sure you want to delete this? This action will{" "}
            <span style={{ color: "#EEEEEE", fontWeight: 600 }}>
              permanently remove all associated data
            </span>{" "}
            from the system and may affect other related records.
          </p>

          {/* "Cannot be undone" badge */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(142,22,22,0.12)",
              border: "1px solid rgba(142,22,22,0.3)",
            }}
          >
            <AlertTriangle size={12} color="#8E1616" />
            <span
              style={{
                color: "#8E1616",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              This action cannot be undone
            </span>
          </div>
        </div>

        {/* ── Footer: action buttons ── */}
        <div
          className="flex items-center justify-end gap-3 px-7 py-4"
          style={{ borderTop: "1px solid #2A1F1F" }}
        >
          {/* Cancel */}
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl transition-all"
            style={{
              background: "#2A1F1F",
              color: isDeleting ? "#555" : "#EEEEEE",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid #3A2A2A",
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                (e.currentTarget as HTMLElement).style.background = "#332525";
                (e.currentTarget as HTMLElement).style.borderColor = "#4A3A3A";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#2A1F1F";
              (e.currentTarget as HTMLElement).style.borderColor = "#3A2A2A";
            }}
          >
            Cancel
          </button>

          {/* Confirm Delete */}
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
            style={{
              background: isDeleting ? "#8E1616" : "#D84040",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              boxShadow: isDeleting
                ? "none"
                : "0 0 16px rgba(216,64,64,0.35)",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                (e.currentTarget as HTMLElement).style.background = "#C03030";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 22px rgba(216,64,64,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                (e.currentTarget as HTMLElement).style.background = "#D84040";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 16px rgba(216,64,64,0.35)";
              }
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={13} />
                Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
