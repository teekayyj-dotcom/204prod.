// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Loader2,
} from "lucide-react";
import { fetchApi } from "../../admin/utils/apiClient";
import { uploadMediaPipeline } from "../../../utils/imagePipeline";


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
  const [searchParams] = useSearchParams();
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string, name: string, progress: number, type: string, previewUrl: string }[]>([]);

  const fetchProjects = async () => {
    try {
      const [projectsData, allTasks] = await Promise.all([
        fetchApi<any[]>("/projects/all"),
        fetchApi<any[]>("/projects/tasks/all").catch(() => [])
      ]);
      if (projectsData && projectsData.length > 0) {
        const mapped = projectsData.map((p: any) => {
          const pTasks = allTasks.filter((t: any) => t.project_slug === p.slug);
          const doneTasks = pTasks.filter((t: any) => t.status === "done").length;
          const progress = pTasks.length > 0 ? Math.round((doneTasks / pTasks.length) * 100) : 0;
          return {
            id: p.slug,
            name: p.title,
            client: p.client_slug || "Client",
            status: p.status === "draft" ? "Planning" : p.status === "published" ? "Completed" : "In Progress",
            deadline: p.dueDate || p.due_date ? new Date(p.dueDate || p.due_date) : new Date(p.created_at || Date.now() + 5 * 24 * 60 * 60 * 1000),
            progress: progress,
            brief: p.summary || "Chưa có brief cho dự án này.",
            timelineFiles: [],
            moodboard: [],
            gallery: p.gallery || [],
          };
        });
        setProjectsList(mapped);
        
        setSelectedProject((prev: any) => {
          const defaultSlug = searchParams.get("project");
          if (defaultSlug) {
            const found = mapped.find((p: any) => p.id === defaultSlug);
            if (found) return found;
          }
          if (!prev) return mapped[0];
          const updated = mapped.find((p: any) => p.id === prev.id);
          return updated || mapped[0];
        });
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
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

  const fetchFeedback = async () => {
    if (!selectedProject) return;
    try {
      const feedbackData = await fetchApi<any[]>(`/projects/${selectedProject.id}/feedback`);
      setProjectFeedback(prev => ({
        ...prev,
        [selectedProject.id]: feedbackData || []
      }));
    } catch (err) {
      console.error("Error fetching feedback:", err);
    }
  };

  const resolveFeedback = async (id: number, currentResolved: boolean) => {
    try {
      const nextStatus = currentResolved ? "Open" : "Resolved";
      await fetchApi(`/projects/feedback/${id}/status?status_val=${nextStatus}`, {
        method: "PUT"
      });
      fetchFeedback();
    } catch (err) {
      console.error("Error updating feedback status:", err);
    }
  };

  const handleFileUpload = () => {
    if (!selectedProject) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const cleanTitle = (selectedProject.name || selectedProject.id || "Project").replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      const existingDemos = (selectedProject.gallery || []).filter((f: any) => f.folder === "demo");
      const demoNumber = existingDemos.length + 1;
      const extension = file.name.split('.').pop() || 'mp4';
      const newFileName = `${cleanTitle} Demo ${demoNumber}.${extension}`;
      const renamedFile = new File([file], newFileName, { type: file.type });

      const uploadId = Math.random().toString(36).substring(7);
      const previewUrl = URL.createObjectURL(renamedFile);
      setUploadingFiles(prev => [...prev, { id: uploadId, name: renamedFile.name, progress: 0, type: renamedFile.type, previewUrl }]);
      
      try {
        await uploadMediaPipeline(
          renamedFile,
          "projects",
          fetchApi,
          (p) => {
            setUploadingFiles(prev => prev.map(f => f.id === uploadId ? { ...f, progress: p } : f));
          },
          null,
          selectedProject.id,
          "demo"
        );
        
        await fetchProjects();
      } catch (err) {
        console.error("Failed to upload demo:", err);
        alert("Upload file thất bại. Vui lòng thử lại!");
      } finally {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
        URL.revokeObjectURL(previewUrl);
      }
    };
    input.click();
  };

  useEffect(() => {
    fetchTasks();
    fetchFeedback();
  }, [selectedProject]);

  const [projectFeedback, setProjectFeedback] = useState<Record<string, any[]>>({});

  const brief = selectedProject ? (selectedProject.brief || "No brief available") : "";
  const feedback = selectedProject ? (projectFeedback[selectedProject.id] || []) : [];
  const deliverables = selectedProject ? [...(selectedProject.gallery || [])].filter((f: any) => f.folder === "demo").reverse() : [];
  const lastDemo = deliverables.find((f: any) => f.type === 'video');
  const playbackUrl = lastDemo 
    ? `/crew-dashboard/projects/${selectedProject?.id}/playback?video=${encodeURIComponent(lastDemo.url)}` 
    : `/crew-dashboard/projects/${selectedProject?.id}/playback`;

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
    <div className="px-4 md:px-8 py-7 w-full max-w-full overflow-x-hidden">
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
      {projectsList.length > 0 && (
        <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-2 snap-x">
          {projectsList.map((proj) => (
            <button
              key={proj.id}
              onClick={() => setSelectedProject(proj)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
              style={{
                background: selectedProject?.id === proj.id ? "#1D1616" : "#141010",
                border: `1px solid ${selectedProject?.id === proj.id ? "#D84040" : "#2A1F1F"}`,
              }}
            >
              <Clapperboard size={15} style={{ color: selectedProject?.id === proj.id ? "#D84040" : "#555" }} />
              <div className="text-left">
                <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>{proj.name}</p>
                <p style={{ color: "#666", fontSize: "10px" }}>{proj.client}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedProject ? (
        <>

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
            onClick={() => {
              if (lastDemo) navigate(playbackUrl);
              else alert("Chưa có bản demo video nào được upload.");
            }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 border text-xs font-bold transition-all ${lastDemo ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", borderColor: "#D84040", color: "#D84040" }}
            onMouseEnter={(e) => { if (lastDemo) { e.currentTarget.style.background = "#D84040"; e.currentTarget.style.color = "#EEEEEE"; } }}
            onMouseLeave={(e) => { if (lastDemo) { e.currentTarget.style.background = "rgba(29, 22, 22, 0.4)"; e.currentTarget.style.color = "#D84040"; } }}
          >
            <MonitorPlay size={14} />
            Mở phòng chiếu & Phản hồi (Cinema Review)
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* LEFT: Kanban (3/4 width) */}
        <div className="xl:col-span-3 min-w-0">
          <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
            Bảng Công việc — Kanban
          </h3>

          <div className="flex overflow-x-auto xl:grid xl:grid-cols-4 gap-3 pb-2 snap-x">
            {columns.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col.id)}
                className="rounded-xl p-3 min-h-64 min-w-[280px] xl:min-w-0 snap-start"
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
              <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Bàn giao — Demo</h3>
            </div>
            <div
              onClick={handleFileUpload}
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
              {uploadingFiles.map(upFile => (
                <div
                  key={upFile.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(29,22,22,0.3)", border: "1px solid rgba(216,64,64,0.3)" }}
                >
                  <div style={{ position: "relative", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="32" height="32" viewBox="0 0 32 32" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                          <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(216,64,64,0.2)" strokeWidth="3" />
                          <circle cx="16" cy="16" r="14" fill="none" stroke="#D84040" strokeWidth="3" strokeDasharray="88" strokeDashoffset={88 - (upFile.progress / 100) * 88} style={{ transition: "stroke-dashoffset 0.2s ease" }} />
                      </svg>
                      {upFile.type.startsWith("image/") ? (
                          <ImageIcon size={12} style={{ color: "#D84040" }} />
                      ) : (
                          <Film size={12} style={{ color: "#D84040" }} />
                      )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={upFile.name}>{upFile.name}</p>
                    <p style={{ color: "#D84040", fontSize: "10px" }}>Đang tải lên... {upFile.progress}%</p>
                  </div>
                </div>
              ))}
              
              {deliverables.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}
                >
                  <Film size={15} style={{ color: "#D84040", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    {file.type === "video" ? (
                      <button 
                        onClick={() => {
                            // Use embed URL for Bunny Stream (direct mp4 URL returns 403)
                            // thumbnail_url holds the iframe embed URL in DB
                            const videoUrlForReview = file.url;
                            navigate(`/crew-dashboard/projects/${selectedProject.id}/playback?video=${encodeURIComponent(videoUrlForReview)}`);
                        }}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                        className="hover:underline"
                      >
                        <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>{file.name}</p>
                      </button>
                    ) : (
                      <a href={file.url} target="_blank" rel="noreferrer" className="hover:underline">
                        <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>{file.name}</p>
                      </a>
                    )}
                    <p style={{ color: "#555", fontSize: "10px" }}>
                      {file.size} · {file.uploaded}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: file.published ? "rgba(16,185,129,0.1)" : "rgba(216,64,64,0.1)",
                      border: `1px solid ${file.published ? "rgba(16,185,129,0.3)" : "rgba(216,64,64,0.3)"}`,
                      color: file.published ? "#10B981" : "#D84040",
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {file.published ? "Published" : "Draft"}
                  </span>
                </div>
              ))}
              {deliverables.length === 0 && (
                <p style={{ color: "#444", fontSize: "11px", textAlign: "center" }} className="py-4">Chưa có tài liệu bàn giao nào được tải lên.</p>
              )}
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
                  {feedback.filter((f) => f.status !== "Resolved").length}
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
                  {feedback.map((fb: any) => {
                    const isResolved = fb.status === "Resolved";
                    const timecodeStr = fb.timecode >= 0 ? `${Math.floor(fb.timecode / 60)}:${String(Math.floor(fb.timecode % 60)).padStart(2, "0")}` : "General";
                    const displayFrom = fb.user_id === "Admin" ? "Admin" : "Khách hàng";
                    
                    return (
                      <div
                        key={fb.id}
                        className="rounded-xl p-3.5"
                        style={{
                          background: isResolved ? "#0A0707" : "#1D1616",
                          border: `1px solid ${!isResolved ? "rgba(139,92,246,0.2)" : "#2A1F1F"}`,
                          opacity: isResolved ? 0.5 : 1,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Pin size={10} style={{ color: "#8B5CF6", flexShrink: 0 }} />
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
                            {timecodeStr}
                          </span>
                          <span style={{ color: "#555", fontSize: "10px" }}>{displayFrom}</span>
                          {isResolved && (
                            <CheckCircle2 size={10} style={{ color: "#10B981", marginLeft: "auto" }} />
                          )}
                        </div>
                        <p style={{ color: isResolved ? "#444" : "#EEEEEE", fontSize: "11px", lineHeight: 1.6 }}>
                          {fb.content}
                        </p>
                        
                        {/* Reply content if present */}
                        {fb.reply_content && (
                          <div className="mt-2.5 p-2 rounded bg-black/40 border-l border-red-500/50">
                            <p style={{ fontSize: "9px", color: "#666", fontWeight: 600 }}>{fb.reply_author || "Admin"}:</p>
                            <p style={{ fontSize: "10px", color: "#ccc" }}>{fb.reply_content}</p>
                          </div>
                        )}
                        
                        {!isResolved && (
                          <button
                            onClick={() => resolveFeedback(fb.id, false)}
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
                    );
                  })}
                  {feedback.length === 0 && (
                    <p style={{ color: "#444", fontSize: "11px", textAlign: "center" }} className="py-4">Chưa có phản hồi nào.</p>
                  )}
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
      </>
      ) : (
        <div className="text-center py-20">
          <p style={{ color: "#666", fontSize: "14px" }}>
            {projectsList.length === 0 ? "Bạn chưa được phân công dự án nào, hoặc hệ thống đang tải dữ liệu..." : "Vui lòng chọn một dự án để xem chi tiết."}
          </p>
        </div>
      )}
    </div>
  );
}
