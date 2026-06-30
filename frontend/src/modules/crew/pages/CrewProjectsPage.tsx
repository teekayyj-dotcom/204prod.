// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  MonitorPlay,
} from "lucide-react";
import { fetchApi } from "../../admin/utils/apiClient";

// ─── Mock data ────────────────────────────────────────────────────────────────
type TaskStatus = "todo" | "inprogress" | "review" | "done";

interface KanbanTask {
  id: string;
  label: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  tag: string;
  createdBy?: string;
}

interface KanbanColumn {
  id: TaskStatus;
  label: string;
  color: string;
  tasks: KanbanTask[];
}

const initialColumnsByProject: Record<string, KanbanColumn[]> = {
  p1: [
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
  ],
  p2: [
    {
      id: "todo",
      label: "Cần làm",
      color: "#555",
      tasks: [
        { id: "t2_1", label: "Lọc source video các dự án nổi bật trong Q3", assignee: "Minh", priority: "medium", tag: "Asset" },
        { id: "t2_2", label: "Viết voiceover giới thiệu đội ngũ crew", assignee: "Tú", priority: "medium", tag: "Planning" },
      ],
    },
    {
      id: "inprogress",
      label: "Đang làm",
      color: "#D4A843",
      tasks: [
        { id: "t2_3", label: "Chọn beat nhạc tiết tấu nhanh, hiện đại", assignee: "Tú", priority: "high", tag: "Audio" },
        { id: "t2_4", label: "Dựng intro motion 204PROD", assignee: "Minh", priority: "high", tag: "Motion" },
      ],
    },
    {
      id: "review",
      label: "Chờ duyệt",
      color: "#8B5CF6",
      tasks: [
        { id: "t2_5", label: "Color correction toàn bộ reel", assignee: "Hà", priority: "medium", tag: "Color" },
      ],
    },
    {
      id: "done",
      label: "Hoàn thành",
      color: "#10B981",
      tasks: [
        { id: "t2_6", label: "Lên ý tưởng concept Agency Reel", assignee: "PM", priority: "low", tag: "Planning" },
        { id: "t2_7", label: "Duyệt kịch bản phân cảnh chi tiết", assignee: "PM", priority: "low", tag: "Planning" },
      ],
    },
  ],
};

const mockProjects = [
  {
    id: "p1",
    name: "Brand X — TVC Mùa Hè 2025",
    client: "Brand X Vietnam",
    status: "In Progress",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    progress: 60,
    brief: "Sản xuất TVC 60 giây quảng bá dòng sản phẩm Mùa Hè 2025. Tone & manner: tươi sáng, năng động, phù hợp đối tượng Gen Z 18–25 tuổi. Kết thúc bằng CTA rõ ràng.",
    timelineFiles: ["Script_v2.pdf", "Shotlist_Final.xlsx", "Storyboard.fig"],
    moodboard: [
      { label: "Scene 1", color: "from-orange-900 to-red-900" },
      { label: "Scene 2", color: "from-blue-900 to-purple-900" },
      { label: "Scene 3", color: "from-green-900 to-teal-900" },
      { label: "Scene 4", color: "from-yellow-900 to-orange-900" },
    ],
  },
  {
    id: "p2",
    name: "Agency Reel Q3 — 204PROD",
    client: "Internal",
    status: "Review",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    progress: 80,
    brief: "Sản xuất Agency Showreel Q3 2025 tổng hợp các dự án nổi bật của 204PROD. Tone & manner: chuyên nghiệp, hiện đại, nhịp điệu nhanh và bắt mắt nhằm thu hút khách hàng mới.",
    timelineFiles: ["Reel_Concept_v1.pdf", "Selected_Projects_List.xlsx", "Soundtrack_Reference.mp3"],
    moodboard: [
      { label: "Intro", color: "from-purple-950 to-pink-900" },
      { label: "Highlights", color: "from-zinc-900 to-stone-900" },
      { label: "Behind Scene", color: "from-amber-950 to-orange-900" },
      { label: "Outro CTA", color: "from-red-950 to-neutral-900" },
    ],
  },
];

const initialFeedbackByProject = {
  p1: [
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
  ],
  p2: [
    {
      id: "f2_1",
      timecode: "00:15",
      from: "Art Director",
      comment: "Đoạn intro transition cần nhanh và dứt khoát hơn. Nên dùng glitch effect.",
      resolved: false,
      urgent: true,
    },
    {
      id: "f2_2",
      timecode: "00:55",
      from: "PM — Tuấn",
      comment: "Chọn nhạc nền khác ở đoạn cao trào, beat này hơi đều chưa tạo cảm xúc mạnh.",
      resolved: false,
      urgent: false,
    },
  ],
};

const initialDeliverablesByProject = {
  p1: [
    { name: "draft_v1_4K.mp4", size: "2.4 GB", uploaded: "Hôm qua, 16:20", status: "Under Review" },
    { name: "thumbnail_variants.zip", size: "84 MB", uploaded: "Hôm qua, 09:00", status: "Approved" },
  ],
  p2: [
    { name: "agency_reel_rough_cut.mp4", size: "1.8 GB", uploaded: "Hôm nay, 08:30", status: "Under Review" },
  ],
};

// ─── Gold badge overlay ───────────────────────────────────────────────────────
function GoldBadge({ visible, message }: { visible: boolean; message?: string }) {
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
          {message || "Task Hoàn Thành!"}
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
  const navigate = useNavigate();
  const [projectsList, setProjectsList] = useState<any[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<any>(mockProjects[0]);

  useEffect(() => {
    fetchApi<any[]>("/projects")
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.slug,
            name: p.title,
            client: p.client_slug || "Client",
            status: p.status === "draft" ? "Planning" : p.status === "published" ? "Completed" : "In Progress",
            deadline: new Date(p.created_at || Date.now() + 5 * 24 * 60 * 60 * 1000),
            progress: p.status === "published" ? 100 : p.status === "draft" ? 15 : 65,
            brief: p.summary || "Chưa có brief cho dự án này.",
            timelineFiles: ["Script_v2.pdf", "Shotlist_Final.xlsx", "Storyboard.fig"],
            moodboard: [
              { label: "Scene 1", color: "from-orange-900 to-red-900" },
              { label: "Scene 2", color: "from-blue-900 to-purple-900" },
              { label: "Scene 3", color: "from-green-900 to-teal-900" },
              { label: "Scene 4", color: "from-yellow-900 to-orange-900" },
            ],
          }));
          setProjectsList(mapped);
          setSelectedProject(mapped[0]);
        }
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
      });
  }, []);

  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: "todo", label: "Cần làm", color: "#888", tasks: [] },
    { id: "inprogress", label: "Đang làm", color: "#E09038", tasks: [] },
    { id: "review", label: "Đang duyệt", color: "#3B82F6", tasks: [] },
    { id: "done", label: "Hoàn thành", color: "#D84040", tasks: [] },
  ]);

  const fetchTasks = () => {
    if (!selectedProject) return;
    fetchApi<any[]>(`/projects/${selectedProject.id}/tasks`)
      .then(tasks => {
        const todoTasks = tasks.filter(t => t.status === "todo").map(t => ({
          id: t.id,
          label: t.title,
          assignee: t.assignee_initials || "",
          assigneeName: t.assignee_name || "",
          priority: t.priority || "medium",
          tag: t.tag || "Work",
          createdBy: t.created_by,
          deadline: t.deadline || ""
        }));
        const inprogressTasks = tasks.filter(t => t.status === "inprogress").map(t => ({
          id: t.id,
          label: t.title,
          assignee: t.assignee_initials || "",
          assigneeName: t.assignee_name || "",
          priority: t.priority || "medium",
          tag: t.tag || "Work",
          createdBy: t.created_by,
          deadline: t.deadline || ""
        }));
        const reviewTasks = tasks.filter(t => t.status === "review").map(t => ({
          id: t.id,
          label: t.title,
          assignee: t.assignee_initials || "",
          assigneeName: t.assignee_name || "",
          priority: t.priority || "medium",
          tag: t.tag || "Work",
          createdBy: t.created_by,
          deadline: t.deadline || ""
        }));
        const doneTasks = tasks.filter(t => t.status === "done").map(t => ({
          id: t.id,
          label: t.title,
          assignee: t.assignee_initials || "",
          assigneeName: t.assignee_name || "",
          priority: t.priority || "medium",
          tag: t.tag || "Work",
          createdBy: t.created_by,
          deadline: t.deadline || ""
        }));

        setColumns([
          { id: "todo", label: "Cần làm", color: "#888", tasks: todoTasks },
          { id: "inprogress", label: "Đang làm", color: "#E09038", tasks: inprogressTasks },
          { id: "review", label: "Đang duyệt", color: "#3B82F6", tasks: reviewTasks },
          { id: "done", label: "Hoàn thành", color: "#D84040", tasks: doneTasks },
        ]);
      })
      .catch(err => console.error("Error fetching tasks:", err));
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedProject]);

  const [projectFeedback, setProjectFeedback] = useState<Record<string, typeof initialFeedbackByProject.p1>>(initialFeedbackByProject);
  const [projectDeliverables, setProjectDeliverables] = useState<Record<string, Array<{ name: string; size: string; uploaded: string; status: string }>>>(initialDeliverablesByProject);

  const brief = selectedProject ? (selectedProject.brief || "No brief available") : "";
  const feedback = selectedProject ? (projectFeedback[selectedProject.id] || []) : [];
  const deliverables = selectedProject ? (projectDeliverables[selectedProject.id] || []) : [];

  const [showBadge, setShowBadge] = useState(false);
  const [briefOpen, setBriefOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(true);
  const dragging = useRef<{ colId: TaskStatus; taskId: string } | null>(null);

  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserName = userObj.display_name || userObj.username || "Crew Member";

  const [showAddTask, setShowAddTask] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("");
  const [newTaskCreator, setNewTaskCreator] = useState(currentUserName);
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  const [crewList, setCrewList] = useState<any[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [searchAssigneeQuery, setSearchAssigneeQuery] = useState("");

  useEffect(() => {
    fetchApi<any[]>("/crew")
      .then((data) => {
        setCrewList(data || []);
      })
      .catch((err) => {
        console.error("Error fetching crew list:", err);
      });
  }, []);

  const addTask = (colId: TaskStatus) => {
    if (!newTaskTitle.trim()) return;
    const newTaskId = `t_${Date.now()}`;
    const initials = newTaskAssignee ? newTaskAssignee.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "";
    const taskData = {
      id: newTaskId,
      title: newTaskTitle.trim(),
      assignee_name: newTaskAssignee.trim() || null,
      assignee_initials: initials || null,
      tag: newTaskTag.trim() || "Work",
      created_by: newTaskCreator.trim() || currentUserName,
      deadline: newTaskDeadline || null,
      status: colId,
      priority: "medium"
    };

    fetchApi(`/projects/${selectedProject.id}/tasks`, {
      method: "POST",
      body: JSON.stringify(taskData)
    })
      .then(() => {
        fetchTasks();
      })
      .catch(err => console.error("Error creating task:", err));

    setNewTaskTitle("");
    setNewTaskAssignee("");
    setNewTaskTag("");
    setNewTaskCreator(currentUserName);
    setNewTaskDeadline("");
    setShowAddTask(null);
  };

  const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{ colId: TaskStatus; task: any } | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskAssignee, setEditTaskAssignee] = useState("");
  const [editTaskTag, setEditTaskTag] = useState("");
  const [editTaskCreator, setEditTaskCreator] = useState("");
  const [editTaskDeadline, setEditTaskDeadline] = useState("");
  const [showEditAssigneeDropdown, setShowEditAssigneeDropdown] = useState(false);
  const [searchEditAssigneeQuery, setSearchEditAssigneeQuery] = useState("");

  const handleEditTaskClick = (colId: TaskStatus, task: any) => {
    setEditingTask({ colId, task });
    setEditTaskTitle(task.label);
    setEditTaskAssignee(task.assigneeName || "");
    setEditTaskTag(task.tag || "");
    setEditTaskCreator(task.createdBy || "");
    setEditTaskDeadline(task.deadline || "");
  };

  const saveEditedTask = () => {
    if (!editingTask || !editTaskTitle.trim()) return;
    const initials = editTaskAssignee ? editTaskAssignee.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "";
    const taskUpdate = {
      title: editTaskTitle.trim(),
      assignee_name: editTaskAssignee.trim() || null,
      assignee_initials: initials || null,
      tag: editTaskTag.trim() || "Work",
      created_by: editTaskCreator.trim() || currentUserName,
      deadline: editTaskDeadline || null,
    };

    fetchApi(`/projects/tasks/${editingTask.task.id}`, {
      method: "PUT",
      body: JSON.stringify(taskUpdate)
    })
      .then(() => {
        fetchTasks();
      })
      .catch(err => console.error("Error updating task:", err));

    setEditingTask(null);
  };

  const handleDeleteTask = (colId: TaskStatus, taskId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;
    fetchApi(`/projects/tasks/${taskId}`, {
      method: "DELETE"
    })
      .then(() => {
        fetchTasks();
      })
      .catch(err => console.error("Error deleting task:", err));
  };

  const onDragStart = (colId: TaskStatus, taskId: string) => {
    dragging.current = { colId, taskId };
  };

  const onDrop = (targetColId: TaskStatus) => {
    if (!dragging.current) return;
    const { colId: sourceColId, taskId } = dragging.current;
    if (sourceColId === targetColId) return;

    if (targetColId === "done") {
      alert("Crew không có quyền chuyển trạng thái task sang Hoàn thành! Vui lòng gửi yêu cầu duyệt bằng cách kéo sang 'Chờ duyệt'!");
      dragging.current = null;
      return;
    }

    fetchApi(`/projects/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ status: targetColId })
    })
      .then(() => {
        if (sourceColId === "inprogress" && targetColId === "review") {
          const reqData = {
            id: `req_${Date.now()}`,
            task_id: taskId,
            crew_name: currentUserName,
            status: "pending",
            timestamp: new Date().toLocaleString("vi-VN")
          };
          return fetchApi(`/projects/${selectedProject.id}/approval-requests`, {
            method: "POST",
            body: JSON.stringify(reqData)
          }).then(() => {
            setShowBadge(true);
            setTimeout(() => setShowBadge(false), 2600);
          });
        }
      })
      .then(() => {
        fetchTasks();
      })
      .catch(err => console.error("Error updating task status:", err));

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
            {projectsList.length} dự án được phân công — Chỉ hiển thị dự án của bạn
          </p>
        </div>
      </div>

      {/* Project selector */}
      <div className="flex gap-3 mb-6">
        {projectsList.map((proj) => (
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
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4 pb-4" style={{ borderBottom: "1px dashed rgba(42,31,31,0.5)" }}>
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
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/crew-dashboard/projects/${selectedProject.id}/playback`)}
            className="px-4 py-2 rounded-lg flex items-center gap-2 border text-xs font-bold transition-all cursor-pointer"
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", borderColor: "#D84040", color: "#D84040" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#D84040"; e.currentTarget.style.color = "#EEEEEE"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(29, 22, 22, 0.4)"; e.currentTarget.style.color = "#D84040"; }}
          >
            <MonitorPlay size={14} />
            Mở phòng chiếu & Phản hồi (Cinema Review)
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-4 gap-6">
        {/* LEFT: Kanban (3/4 width) */}
        <div className="col-span-3">
          <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
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
                    <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTaskMenu(activeTaskMenu === task.id ? null : task.id);
                      }}
                      className="rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-150 relative"
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
                      {activeTaskMenu === task.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTaskMenu(null);
                            }}
                          />
                          <div
                            className="absolute right-2 top-8 w-28 rounded-lg border border-[#2A1F1F] z-40 p-1 shadow-2xl"
                            style={{ background: "#141010" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                handleEditTaskClick(col.id, task);
                                setActiveTaskMenu(null);
                              }}
                              className="w-full text-left px-2 py-1 rounded text-[10px] hover:bg-white/5 transition-colors text-white font-medium cursor-pointer"
                            >
                              Sửa công việc
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteTask(col.id, task.id);
                                setActiveTaskMenu(null);
                              }}
                              className="w-full text-left px-2 py-1 rounded text-[10px] hover:bg-[#D84040]/10 text-[#D84040] transition-colors font-medium cursor-pointer"
                            >
                              Xóa công việc
                            </button>
                          </div>
                        </>
                      )}
                      <div className="flex items-start gap-1.5 mb-2">
                        <GripVertical size={11} style={{ color: "#333", marginTop: "2px", flexShrink: 0 }} />
                        <div className="flex-1">
                          <p style={{ color: col.id === "done" ? "#555" : "#EEEEEE", fontSize: "13px", lineHeight: 1.4, fontWeight: 500 }}>
                            {task.label}
                          </p>
                          {task.deadline && (
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-[#888]" style={{ fontWeight: 400 }}>
                              <Clock size={9} />
                              <span>Hạn: {new Date(task.deadline).toLocaleDateString("vi-VN")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: "1px dashed rgba(42,31,31,0.5)" }}>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            background: "#0A0707",
                            color: "#666",
                            fontSize: "10px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          {task.tag}
                        </span>
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                              style={{
                                background: "#3A2A2A",
                                fontSize: "9px",
                                fontWeight: 700,
                                border: "1px solid #D84040",
                              }}
                            >
                              {task.assignee.substring(0, 1).toUpperCase()}
                            </div>
                            <span style={{ color: "#888", fontSize: "11px", fontWeight: 500 }}>{task.assignee}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white/50"
                              style={{
                                background: "#1D1616",
                                fontSize: "9px",
                                fontWeight: 700,
                                border: "1px dashed #2A1F1F",
                              }}
                            >
                              ?
                            </div>
                            <span style={{ color: "#555", fontSize: "11px", fontWeight: 500, fontStyle: "italic" }}>Chưa giao việc</span>
                          </div>
                        )}
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

                {/* Add Task Form / Button */}
                {showAddTask === col.id ? (
                  <div className="rounded-lg p-2.5 mt-2 space-y-2" style={{ background: "#1D1616", border: "1px solid #D84040" }}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Tên công việc..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTask(col.id);
                        if (e.key === "Escape") {
                          setShowAddTask(null);
                          setNewTaskTitle("");
                        }
                      }}
                      className="w-full bg-transparent text-[11px] p-1 outline-none"
                      style={{ borderBottom: "1px solid #2A1F1F", color: "#EEEEEE" }}
                    />
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Chọn người thực hiện..."
                        value={newTaskAssignee}
                        onChange={(e) => {
                          setNewTaskAssignee(e.target.value);
                          setSearchAssigneeQuery(e.target.value);
                          setShowAssigneeDropdown(true);
                        }}
                        onFocus={() => {
                          setShowAssigneeDropdown(true);
                          setSearchAssigneeQuery(newTaskAssignee);
                        }}
                        className="w-full bg-transparent text-[11px] p-1 outline-none"
                        style={{ borderBottom: "1px solid #2A1F1F", color: "#EEEEEE" }}
                      />
                      {showAssigneeDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowAssigneeDropdown(false)} 
                          />
                          <div
                            className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-lg border border-[#2A1F1F] z-20 space-y-0.5 p-1 shadow-xl"
                            style={{ background: "#141010" }}
                          >
                            {crewList
                              .filter((c) =>
                                c.name.toLowerCase().includes(searchAssigneeQuery.toLowerCase())
                              )
                              .map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setNewTaskAssignee(c.name);
                                    setShowAssigneeDropdown(false);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded text-[10px] hover:bg-[#D84040]/10 hover:text-[#D84040] transition-colors flex items-center gap-1.5 cursor-pointer"
                                  style={{ color: "#EEEEEE" }}
                                >
                                  {c.avatar ? (
                                    <img src={c.avatar} alt={c.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold bg-[#2A1F1F] text-white">
                                      {c.name.substring(0, 1).toUpperCase()}
                                    </div>
                                  )}
                                  <span>{c.name}</span>
                                </button>
                              ))}
                            {crewList.filter((c) =>
                              c.name.toLowerCase().includes(searchAssigneeQuery.toLowerCase())
                            ).length === 0 && (
                              <p className="text-[9px] text-[#555] px-2 py-1.5 italic text-center">
                                Không tìm thấy thành viên
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Tag (ví dụ: Motion)..."
                      value={newTaskTag}
                      onChange={(e) => setNewTaskTag(e.target.value)}
                      className="w-full bg-transparent text-[11px] p-1 outline-none"
                      style={{ borderBottom: "1px solid #2A1F1F", color: "#EEEEEE" }}
                    />
                    <input
                      type="text"
                      placeholder="Người tạo..."
                      value={newTaskCreator}
                      onChange={(e) => setNewTaskCreator(e.target.value)}
                      className="w-full bg-transparent text-[11px] p-1 outline-none"
                      style={{ borderBottom: "1px solid #2A1F1F", color: "#EEEEEE" }}
                    />
                    <input
                      type="date"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      className="w-full bg-transparent text-[11px] p-1 outline-none"
                      style={{ borderBottom: "1px solid #2A1F1F", color: "#666" }}
                    />
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => addTask(col.id)}
                        className="flex-1 py-1 rounded text-[10px] font-semibold cursor-pointer"
                        style={{ background: "#D84040", color: "#EEEEEE" }}
                      >
                        Thêm
                      </button>
                      <button
                        onClick={() => {
                          setShowAddTask(null);
                          setNewTaskTitle("");
                          setNewTaskAssignee("");
                          setNewTaskTag("");
                          setNewTaskCreator(currentUserName);
                          setNewTaskDeadline("");
                        }}
                        className="px-2.5 py-1 rounded text-[10px] cursor-pointer"
                        style={{ background: "#2A1F1F", color: "#666" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowAddTask(col.id);
                      setNewTaskTitle("");
                      setNewTaskAssignee("");
                      setNewTaskTag("");
                      setNewTaskCreator(currentUserName);
                      setNewTaskDeadline("");
                    }}
                    className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-[#2A1F1F] text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    style={{ background: "transparent", color: "#555" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = col.color + "55"; e.currentTarget.style.color = col.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A1F1F"; e.currentTarget.style.color = "#555"; }}
                  >
                    <Plus size={11} /> Thêm task
                  </button>
                )}
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
                      {selectedProject.brief}
                    </p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}>
                    <p style={{ color: "#D4A843", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                      Kịch bản & Timeline
                    </p>
                    <div className="space-y-1.5">
                      {(selectedProject.timelineFiles || []).map((f) => (
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
                    {(selectedProject.moodboard || []).map((mb) => (
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
              {deliverables.map((file) => (
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
                            setProjectFeedback((prev) => ({
                              ...prev,
                              [selectedProject.id]: (prev[selectedProject.id] || []).map((f) =>
                                f.id === fb.id ? { ...f, resolved: true } : f
                              ),
                            }))
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
      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-xl p-5 space-y-4 shadow-2xl border border-[#2A1F1F]" style={{ background: "#141010" }}>
            <h3 className="text-white text-sm font-semibold border-b border-[#2A1F1F] pb-2">Chỉnh sửa công việc</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Tên công việc</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full bg-[#1D1616] border border-[#2A1F1F] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D84040]"
                />
              </div>
              
              <div className="relative">
                <label className="block text-[10px] text-gray-500 mb-1">Người thực hiện</label>
                <input
                  type="text"
                  value={editTaskAssignee}
                  onChange={(e) => {
                    setEditTaskAssignee(e.target.value);
                    setSearchEditAssigneeQuery(e.target.value);
                    setShowEditAssigneeDropdown(true);
                  }}
                  onFocus={() => {
                    setShowEditAssigneeDropdown(true);
                    setSearchEditAssigneeQuery(editTaskAssignee);
                  }}
                  className="w-full bg-[#1D1616] border border-[#2A1F1F] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D84040]"
                />
                {showEditAssigneeDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowEditAssigneeDropdown(false)} />
                    <div className="absolute left-0 right-0 mt-1 max-h-32 overflow-y-auto rounded border border-[#2A1F1F] z-20 space-y-0.5 p-1 shadow-xl" style={{ background: "#141010" }}>
                      {crewList
                        .filter((c) => c.name.toLowerCase().includes(searchEditAssigneeQuery.toLowerCase()))
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setEditTaskAssignee(c.name);
                              setShowEditAssigneeDropdown(false);
                            }}
                            className="w-full text-left px-2 py-1 rounded text-[10px] hover:bg-[#D84040]/10 hover:text-[#D84040] transition-colors flex items-center gap-1.5 cursor-pointer text-white"
                          >
                            {c.avatar ? (
                              <img src={c.avatar} alt={c.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold bg-[#2A1F1F] text-white">
                                {c.name.substring(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span>{c.name}</span>
                          </button>
                        ))}
                      {crewList.filter((c) => c.name.toLowerCase().includes(searchEditAssigneeQuery.toLowerCase())).length === 0 && (
                        <p className="text-[9px] text-[#555] px-2 py-1 italic text-center">Không tìm thấy thành viên</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Tag (Nhãn)</label>
                <input
                  type="text"
                  value={editTaskTag}
                  onChange={(e) => setEditTaskTag(e.target.value)}
                  className="w-full bg-[#1D1616] border border-[#2A1F1F] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D84040]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Người tạo</label>
                <input
                  type="text"
                  value={editTaskCreator}
                  onChange={(e) => setEditTaskCreator(e.target.value)}
                  className="w-full bg-[#1D1616] border border-[#2A1F1F] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D84040]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1">Dự kiến hoàn thành</label>
                <input
                  type="date"
                  value={editTaskDeadline}
                  onChange={(e) => setEditTaskDeadline(e.target.value)}
                  className="w-full bg-[#1D1616] border border-[#2A1F1F] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D84040]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#2A1F1F] justify-end">
              <button
                onClick={() => setEditingTask(null)}
                className="px-3 py-1.5 rounded text-[11px] font-medium cursor-pointer"
                style={{ background: "#2A1F1F", color: "#888" }}
              >
                Hủy
              </button>
              <button
                onClick={saveEditedTask}
                className="px-3 py-1.5 rounded text-[11px] font-semibold cursor-pointer text-white"
                style={{ background: "#D84040" }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
