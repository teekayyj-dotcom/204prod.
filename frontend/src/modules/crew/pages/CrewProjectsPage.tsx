// @ts-nocheck
import { useState, useRef } from "react";
import {
  Clapperboard,
  Clock,
  Upload,
  MessageSquare,
  FileText,
  Image,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Star,
  Trophy,
  GripVertical,
  Pin,
  ArrowRight,
  Film,
  FolderOpen,
  Plus,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
type TaskStatus = "todo" | "inprogress" | "review" | "done";

interface KanbanTask {
  id: string;
  label: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  tag: string;
}

interface KanbanColumn {
  id: TaskStatus;
  label: string;
  color: string;
  tasks: KanbanTask[];
}

const initialColumns: KanbanColumn[] = [
  {
    id: "todo",
    label: "Cần làm",
    color: "#555",
    tasks: [
      { id: "t1", label: "Storyboard Scene 6 — Outdoor", assignee: "Minh", priority: "medium", tag: "Motion" },
      { id: "t2", label: "Chọn nhạc nền cho đoạn CTA", assignee: "Tú", priority: "low", tag: "Audio" },
    ],
  },
  {
    id: "inprogress",
    label: "Đang làm",
    color: "#D4A843",
    tasks: [
      { id: "t3", label: "Dựng Draft 1 — Full timeline", assignee: "Minh", priority: "high", tag: "Editing" },
      { id: "t4", label: "Color grade Scene 1–3", assignee: "Tú", priority: "medium", tag: "Color" },
    ],
  },
  {
    id: "review",
    label: "Chờ duyệt",
    color: "#8B5CF6",
    tasks: [
      { id: "t5", label: "Motion graphic logo intro", assignee: "Hà", priority: "high", tag: "Motion" },
    ],
  },
  {
    id: "done",
    label: "Hoàn thành",
    color: "#10B981",
    tasks: [
      { id: "t6", label: "Script & Shot list finalized", assignee: "PM", priority: "low", tag: "Planning" },
      { id: "t7", label: "Asset collection từ khách", assignee: "PM", priority: "low", tag: "Asset" },
    ],
  },
];

const mockProjects = [
  {
    id: "p1",
    name: "Brand X — TVC Mùa Hè 2025",
    client: "Brand X Vietnam",
    status: "In Progress",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    progress: 60,
  },
  {
    id: "p2",
    name: "Agency Reel Q3 — 204PROD",
    client: "Internal",
    status: "Review",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    progress: 80,
  },
];

const mockFeedback = [
  {
    id: "f1",
    timecode: "00:34",
    from: "Client ABC",
    comment: "Chỉnh màu nền cảnh này — quá sáng so với brief. Cần desaturate khoảng 20%.",
    resolved: false,
    urgent: true,
  },
  {
    id: "f2",
    timecode: "01:12",
    from: "PM — Tuấn",
    comment: "Cut cảnh này ngắn hơn 2 giây. Tempo nên bám sát nhịp nhạc.",
    resolved: false,
    urgent: false,
  },
  {
    id: "f3",
    timecode: "02:05",
    from: "Client ABC",
    comment: "Chữ title chạy quá nhanh. Kéo dài animation 0.5s.",
    resolved: true,
    urgent: false,
  },
];

// ─── Gold badge overlay ───────────────────────────────────────────────────────
function GoldBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        pointerEvents: "none",
        animation: "fadeInOut 2.5s ease forwards",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #D4A843, #F5D78E, #B8860B)",
          borderRadius: "24px",
          padding: "32px 48px",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(212,168,67,0.6), 0 0 120px rgba(212,168,67,0.3)",
          animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
      >
        <Trophy size={48} style={{ color: "#0A0707", marginBottom: "8px" }} />
        <p style={{ color: "#0A0707", fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Task Hoàn Thành!
        </p>
        <p style={{ color: "rgba(10,7,7,0.7)", fontSize: "13px", marginTop: "4px" }}>
          Xuất sắc lắm! 🎉
        </p>
      </div>
    </div>
  );
}

// ─── Countdown helper ─────────────────────────────────────────────────────────
function Countdown({ deadline }: { deadline: Date }) {
  const diff = deadline.getTime() - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isUrgent = days < 3;
  return (
    <span
      style={{
        color: isUrgent ? "#D84040" : "#D4A843",
        fontSize: "12px",
        fontWeight: 700,
        background: isUrgent ? "rgba(216,64,64,0.1)" : "rgba(212,168,67,0.1)",
        border: `1px solid ${isUrgent ? "rgba(216,64,64,0.3)" : "rgba(212,168,67,0.2)"}`,
        padding: "2px 8px",
        borderRadius: "6px",
      }}
    >
      {days}d {hours}h còn lại
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CrewProjectsPage() {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [selectedProject, setSelectedProject] = useState(mockProjects[0]);
  const [showBadge, setShowBadge] = useState(false);
  const [briefOpen, setBriefOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const [feedback, setFeedback] = useState(mockFeedback);
  const dragging = useRef<{ colId: TaskStatus; taskId: string } | null>(null);

  // ── Drag & Drop ──
  const onDragStart = (colId: TaskStatus, taskId: string) => {
    dragging.current = { colId, taskId };
  };

  const onDrop = (targetColId: TaskStatus) => {
    if (!dragging.current) return;
    const { colId: sourceColId, taskId } = dragging.current;
    if (sourceColId === targetColId) return;

    setColumns((prev) => {
      const src = prev.find((c) => c.id === sourceColId)!;
      const task = src.tasks.find((t) => t.id === taskId)!;
      const newCols = prev.map((c) => {
        if (c.id === sourceColId) return { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) };
        if (c.id === targetColId) return { ...c, tasks: [task, ...c.tasks] };
        return c;
      });
      if (targetColId === "done") {
        setShowBadge(true);
        setTimeout(() => setShowBadge(false), 2600);
      }
      return newCols;
    });
    dragging.current = null;
  };

  const priorityColor = (p: string) =>
    p === "high" ? "#D84040" : p === "medium" ? "#D4A843" : "#555";

  const statusColor = (s: string) =>
    s === "In Progress" ? "#D4A843" : s === "Review" ? "#8B5CF6" : s === "Done" ? "#10B981" : "#888";

  return (
    <div className="px-8 py-7">
      <GoldBadge visible={showBadge} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
            Dự án của tôi
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
            {mockProjects.length} dự án được phân công — Chỉ hiển thị dự án của bạn
          </p>
        </div>
      </div>

      {/* Project selector */}
      <div className="flex gap-3 mb-6">
        {mockProjects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => setSelectedProject(proj)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
            style={{
              background: selectedProject.id === proj.id ? "#1D1616" : "#141010",
              border: `1px solid ${selectedProject.id === proj.id ? "#D84040" : "#2A1F1F"}`,
            }}
          >
            <Clapperboard size={15} style={{ color: selectedProject.id === proj.id ? "#D84040" : "#555" }} />
            <div className="text-left">
              <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>{proj.name}</p>
              <p style={{ color: "#666", fontSize: "10px" }}>{proj.client}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Project Focus Card */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: "linear-gradient(135deg, #1D1616 0%, #141010 100%)",
          border: "1px solid #2A1F1F",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "#D84040", flexShrink: 0 }}
            >
              <Film size={22} style={{ color: "#EEEEEE" }} />
            </div>
            <div>
              <h2 style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 700, lineHeight: 1.2 }}>
                {selectedProject.name}
              </h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span style={{ color: "#888", fontSize: "12px" }}>{selectedProject.client}</span>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: `${statusColor(selectedProject.status)}18`,
                    border: `1px solid ${statusColor(selectedProject.status)}44`,
                    color: statusColor(selectedProject.status),
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {selectedProject.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p style={{ color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                Deadline
              </p>
              <Countdown deadline={selectedProject.deadline} />
            </div>
            <div className="text-right">
              <p style={{ color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                Tiến độ
              </p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedProject.progress}%`,
                      background: "linear-gradient(90deg, #8E1616, #D84040)",
                    }}
                  />
                </div>
                <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>
                  {selectedProject.progress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* LEFT: Kanban (2/3 width) */}
        <div className="col-span-2">
          <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>
            Bảng Công việc — Kanban
          </h3>

          <div className="grid grid-cols-4 gap-3">
            {columns.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col.id)}
                className="rounded-xl p-3 min-h-64"
                style={{
                  background: "#141010",
                  border: `1px solid ${col.id === "done" ? "rgba(16,185,129,0.2)" : "#2A1F1F"}`,
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: col.color }}
                    />
                    <span style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 700 }}>
                      {col.label}
                    </span>
                  </div>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#1D1616", color: "#666", fontSize: "10px", fontWeight: 700 }}
                  >
                    {col.tasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="space-y-2">
                  {col.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStart(col.id, task.id)}
                      className="rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-150"
                      style={{
                        background: col.id === "done" ? "#0D1A14" : "#1D1616",
                        border: `1px solid ${col.id === "done" ? "rgba(16,185,129,0.2)" : "#2A1F1F"}`,
                        opacity: col.id === "done" ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = col.color + "88";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          col.id === "done" ? "rgba(16,185,129,0.2)" : "#2A1F1F";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      }}
                    >
                      <div className="flex items-start gap-1.5 mb-2">
                        <GripVertical size={11} style={{ color: "#333", marginTop: "2px", flexShrink: 0 }} />
                        <p style={{ color: col.id === "done" ? "#555" : "#EEEEEE", fontSize: "11px", lineHeight: 1.4, fontWeight: 500 }}>
                          {task.label}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            background: "#0A0707",
                            color: "#666",
                            fontSize: "9px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          {task.tag}
                        </span>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: priorityColor(task.priority) }}
                        />
                      </div>

                      {/* Gold badge on done cards */}
                      {col.id === "done" && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star size={9} style={{ color: "#D4A843" }} />
                          <span style={{ color: "#D4A843", fontSize: "9px", fontWeight: 600 }}>
                            Hoàn thành
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {col.tasks.length === 0 && (
                    <div
                      className="h-16 rounded-lg flex items-center justify-center"
                      style={{ border: "1px dashed #2A1F1F" }}
                    >
                      <p style={{ color: "#333", fontSize: "10px" }}>Kéo task vào đây</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Creative Brief */}
          <div className="mt-5 rounded-2xl overflow-hidden" style={{ border: "1px solid #2A1F1F" }}>
            <button
              onClick={() => setBriefOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4"
              style={{ background: "#141010" }}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={15} style={{ color: "#D84040" }} />
                <span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>
                  Creative Brief & Assets
                </span>
              </div>
              {briefOpen ? <ChevronDown size={15} style={{ color: "#555" }} /> : <ChevronRight size={15} style={{ color: "#555" }} />}
            </button>

            {briefOpen && (
              <div className="px-5 pb-5" style={{ background: "#141010", borderTop: "1px solid #2A1F1F" }}>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="rounded-xl p-4" style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}>
                    <p style={{ color: "#D84040", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                      Đề bài sáng tạo
                    </p>
                    <p style={{ color: "#888", fontSize: "12px", lineHeight: 1.7 }}>
                      Sản xuất TVC 60 giây quảng bá dòng sản phẩm Mùa Hè 2025. Tone & manner: tươi sáng, năng động, phù hợp đối tượng Gen Z 18–25 tuổi. Kết thúc bằng CTA rõ ràng.
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}>
                    <p style={{ color: "#D4A843", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                      Kịch bản & Timeline
                    </p>
                    <div className="space-y-1.5">
                      {["Script_v2.pdf", "Shotlist_Final.xlsx", "Storyboard.fig"].map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <FolderOpen size={11} style={{ color: "#555" }} />
                          <span style={{ color: "#888", fontSize: "11px" }}>{f}</span>
                          <ArrowRight size={10} style={{ color: "#D84040", marginLeft: "auto" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Moodboard */}
                <div className="mt-4">
                  <p style={{ color: "#555", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                    Moodboard
                  </p>
                  <div className="flex gap-2">
                    {[
                      { label: "Scene 1", color: "from-orange-900 to-red-900" },
                      { label: "Scene 2", color: "from-blue-900 to-purple-900" },
                      { label: "Scene 3", color: "from-green-900 to-teal-900" },
                      { label: "Scene 4", color: "from-yellow-900 to-orange-900" },
                    ].map((mb) => (
                      <div
                        key={mb.label}
                        className={`flex-1 h-16 rounded-lg bg-gradient-to-br ${mb.color} flex items-end p-2`}
                        style={{ border: "1px solid #2A1F1F" }}
                      >
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "9px" }}>{mb.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deliverables */}
          <div
            className="mt-5 rounded-2xl p-5"
            style={{ background: "#141010", border: "1px solid #2A1F1F" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Upload size={15} style={{ color: "#10B981" }} />
              <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Bàn giao — Deliverables</h3>
            </div>
            <div
              className="rounded-xl flex flex-col items-center justify-center py-8 cursor-pointer transition-all"
              style={{ border: "2px dashed #2A1F1F" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D84040")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A1F1F")}
            >
              <Upload size={24} style={{ color: "#333", marginBottom: "8px" }} />
              <p style={{ color: "#555", fontSize: "13px" }}>Upload file kết quả</p>
              <p style={{ color: "#333", fontSize: "11px", marginTop: "4px" }}>
                Video Draft, Hình ảnh, File xuất
              </p>
              <button
                className="mt-4 px-5 py-2 rounded-lg flex items-center gap-1.5"
                style={{ background: "#D84040", color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}
              >
                <Plus size={13} /> Chọn file
              </button>
            </div>

            {/* Existing deliverables */}
            <div className="mt-3 space-y-2">
              {[
                { name: "draft_v1_4K.mp4", size: "2.4 GB", uploaded: "Hôm qua, 16:20", status: "Under Review" },
                { name: "thumbnail_variants.zip", size: "84 MB", uploaded: "Hôm qua, 09:00", status: "Approved" },
              ].map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}
                >
                  <Film size={15} style={{ color: "#D84040", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>{file.name}</p>
                    <p style={{ color: "#555", fontSize: "10px" }}>
                      {file.size} · {file.uploaded}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: file.status === "Approved" ? "rgba(16,185,129,0.1)" : "rgba(212,168,67,0.1)",
                      border: `1px solid ${file.status === "Approved" ? "rgba(16,185,129,0.3)" : "rgba(212,168,67,0.3)"}`,
                      color: file.status === "Approved" ? "#10B981" : "#D4A843",
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Feedback Sync */}
        <div>
          <div
            className="rounded-2xl overflow-hidden sticky top-4"
            style={{ border: "1px solid #2A1F1F" }}
          >
            <button
              onClick={() => setFeedbackOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4"
              style={{ background: "#141010" }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={14} style={{ color: "#8B5CF6" }} />
                <span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>
                  Feedback Sync
                </span>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#D84040", color: "#fff", fontSize: "10px", fontWeight: 700 }}
                >
                  {feedback.filter((f) => !f.resolved).length}
                </span>
              </div>
              {feedbackOpen ? <ChevronDown size={14} style={{ color: "#555" }} /> : <ChevronRight size={14} style={{ color: "#555" }} />}
            </button>

            {feedbackOpen && (
              <div className="px-4 pb-4" style={{ background: "#141010", borderTop: "1px solid #2A1F1F" }}>
                <p style={{ color: "#555", fontSize: "10px", marginTop: "12px", marginBottom: "10px" }}>
                  Phản hồi từ client được tự động đồng bộ từ Client Site
                </p>
                <div className="space-y-3">
                  {feedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-xl p-3.5"
                      style={{
                        background: fb.resolved ? "#0A0707" : "#1D1616",
                        border: `1px solid ${fb.urgent && !fb.resolved ? "rgba(216,64,64,0.4)" : "#2A1F1F"}`,
                        opacity: fb.resolved ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Pin size={10} style={{ color: fb.urgent ? "#D84040" : "#8B5CF6", flexShrink: 0 }} />
                        <span
                          style={{
                            background: "#0A0707",
                            color: "#D4A843",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                          }}
                        >
                          {fb.timecode}
                        </span>
                        <span style={{ color: "#555", fontSize: "10px" }}>{fb.from}</span>
                        {fb.urgent && !fb.resolved && (
                          <AlertCircle size={10} style={{ color: "#D84040", marginLeft: "auto" }} />
                        )}
                        {fb.resolved && (
                          <CheckCircle2 size={10} style={{ color: "#10B981", marginLeft: "auto" }} />
                        )}
                      </div>
                      <p style={{ color: fb.resolved ? "#444" : "#EEEEEE", fontSize: "11px", lineHeight: 1.6 }}>
                        {fb.comment}
                      </p>
                      {!fb.resolved && (
                        <button
                          onClick={() =>
                            setFeedback((prev) =>
                              prev.map((f) => (f.id === fb.id ? { ...f, resolved: true } : f))
                            )
                          }
                          className="mt-2.5 w-full py-1.5 rounded-lg flex items-center justify-center gap-1"
                          style={{
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            color: "#10B981",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,185,129,0.15)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,185,129,0.08)")}
                        >
                          <CheckCircle2 size={11} /> Đánh dấu đã xử lý
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          15% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
