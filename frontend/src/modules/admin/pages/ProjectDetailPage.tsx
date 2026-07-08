// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
    ArrowLeft, Edit3, Save, X, Calendar, DollarSign, Tag, User, Briefcase,
    Clock, CheckCircle2, Loader2, Trash2, MessageSquare, Activity, ExternalLink,
    AlertCircle, Star, Video, Link2, UploadCloud, Play, Camera, MonitorPlay,
    Kanban, TrendingUp, Image, FileText, Plus, AlertTriangle, CheckCheck,
    FileCheck, Receipt, FilePlus, Banknote, TrendingDown, Target, Shield,
    Lock, Unlock, PlayCircle, ImageIcon, Upload, Eye, ArrowRight, Zap, Globe, Film, Coins
} from "lucide-react";
import { crewMembers } from "../data/mockData";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { fetchApi } from "../utils/apiClient";
import { uploadMediaPipeline } from "../../../utils/imagePipeline";

// ─── Constants ────────────────────────────────────────────────────────────────

const statusColors = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040", border: "rgba(216,64,64,0.3)" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50", border: "rgba(76,175,80,0.3)" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6", border: "rgba(107,143,214,0.3)" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838", border: "rgba(232,168,56,0.3)" },
};

const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};

// ─── Mock data for admin tabs ──────────────────────────────────────────────────

const MOCK_KANBAN_TASKS: any[] = [];

const KANBAN_COLUMNS = [
    { id: "todo", label: "To-do", color: "#888" },
    { id: "inprogress", label: "In Progress", color: "#E8A838" },
    { id: "review", label: "Internal Review", color: "#6B8FD6" },
    { id: "clientreview", label: "Client Review", color: "#C084FC" },
    { id: "done", label: "Done", color: "#4CAF50" },
];

const MOCK_MEDIA: any[] = [];

const MOCK_FEEDBACK: any[] = [];

const MOCK_VAULT_DOCS: any[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysLeft(dateStr: string): number | null {
    if (!dateStr) return null;
    const due = new Date(dateStr);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(dateStr: string): boolean {
    const d = getDaysLeft(dateStr);
    return d !== null && d < 0;
}

function fmtVND(n: number) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B ₫`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M ₫`;
    return `${n.toLocaleString()} ₫`;
}

const AVATAR_COLORS = ["#8E1616", "#1E3A5F", "#1A4731", "#4A1A6B", "#7A3A00", "#1A4A4A"];
function avatarColor(str: string) {
    let hash = 0;
    for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[hash];
}

function AvatarBubble({ initials, imgUrl, size = 28, color = "#8E1616" }: { initials: string; imgUrl?: string; size?: number; color?: string }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: color, color: "#EEEEEE",
            fontSize: size * 0.38, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, border: "2px solid #1D1616", overflow: "hidden"
        }}>
            {imgUrl ? <img src={imgUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </div>
    );
}

// ─── Admin Tab: Kanban Board ───────────────────────────────────────────────────

function KanbanTab() {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserName = userObj.display_name || userObj.username || "Admin User";

    const { id } = useParams();
    const [tasks, setTasks] = useState<any[]>([]);

    const fetchTasks = () => {
        if (!id) return;
        fetchApi<any[]>(`/projects/${id}/tasks`)
            .then(data => {
                const mapped = data.map(t => ({
                    id: t.id,
                    col: t.status,
                    title: t.title,
                    assignee: t.assignee_initials || "",
                    assigneeName: t.assignee_name || "",
                    tag: t.tag || "",
                    createdBy: t.created_by,
                    deadline: t.deadline || "",
                    priority: t.priority || "medium"
                }));
                setTasks(mapped);
            })
            .catch(err => console.error("Error fetching tasks:", err));
    };

    useEffect(() => {
        fetchTasks();
    }, [id]);

    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [showAddTask, setShowAddTask] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskAssigneeName, setNewTaskAssigneeName] = useState("");
    const [newTaskAssigneeInitials, setNewTaskAssigneeInitials] = useState("");
    const [newTaskTag, setNewTaskTag] = useState("");
    const [newTaskCreator, setNewTaskCreator] = useState(currentUserName);
    const [newTaskDeadline, setNewTaskDeadline] = useState("");

    // Searchable Assignee Dropdown states
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
    const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);
    const [approvalRequests, setApprovalRequests] = useState<any[]>([]);

    const loadApprovalRequests = () => {
        if (!id) return;
        fetchApi<any[]>(`/projects/${id}/approval-requests`)
            .then(data => {
                setApprovalRequests(data);
            })
            .catch(err => console.error("Error fetching approval requests:", err));
    };

    useEffect(() => {
        loadApprovalRequests();
        const interval = setInterval(loadApprovalRequests, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const handleApproveRequest = (req: any) => {
        fetchApi(`/projects/approval-requests/${req.id}/approve`, {
            method: "PUT"
        })
            .then(() => {
                fetchTasks();
                loadApprovalRequests();
            })
            .catch(err => console.error("Error approving request:", err));
    };

    const handleRejectRequest = (reqId: string) => {
        fetchApi(`/projects/approval-requests/${reqId}/reject`, {
            method: "PUT"
        })
            .then(() => {
                loadApprovalRequests();
            })
            .catch(err => console.error("Error rejecting request:", err));
    };
    const [editingTask, setEditingTask] = useState<{ colId: string; task: any } | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [editTaskAssigneeName, setEditTaskAssigneeName] = useState("");
    const [editTaskAssigneeInitials, setEditTaskAssigneeInitials] = useState("");
    const [editTaskTag, setEditTaskTag] = useState("");
    const [editTaskCreator, setEditTaskCreator] = useState("");
    const [editTaskDeadline, setEditTaskDeadline] = useState("");
    const [showEditAssigneeDropdown, setShowEditAssigneeDropdown] = useState(false);
    const [searchEditAssigneeQuery, setSearchEditAssigneeQuery] = useState("");

    const handleEditTaskClick = (colId: string, task: any) => {
        setEditingTask({ colId, task });
        setEditTaskTitle(task.title);
        setEditTaskAssigneeName(task.assigneeName || "");
        setEditTaskAssigneeInitials(task.assignee || "");
        setEditTaskTag(task.tag || "");
        setEditTaskCreator(task.createdBy || "");
        setEditTaskDeadline(task.deadline || "");
    };

    const saveEditedTask = () => {
        if (!editingTask || !editTaskTitle.trim()) return;
        const taskUpdate = {
            title: editTaskTitle.trim(),
            assignee_name: editTaskAssigneeName.trim() || null,
            assignee_initials: editTaskAssigneeInitials.trim() || null,
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

    const handleDeleteTask = (taskId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;
        fetchApi(`/projects/tasks/${taskId}`, {
            method: "DELETE"
        })
            .then(() => {
                fetchTasks();
            })
            .catch(err => console.error("Error deleting task:", err));
    };
    const onDragStart = (e: React.DragEvent, taskId: string) => {
        setDragging(taskId);
        e.dataTransfer.effectAllowed = "move";
    };
    const onDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(colId);
    };
    const onDrop = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        if (!dragging) return;
        fetchApi(`/projects/tasks/${dragging}`, {
            method: "PUT",
            body: JSON.stringify({ status: colId })
        })
            .then(() => {
                fetchTasks();
            })
            .catch(err => console.error("Error updating task status:", err));
        setDragging(null);
        setDragOver(null);
    };
    const onDragEnd = () => { setDragging(null); setDragOver(null); };

    const addTask = (colId: string) => {
        if (!newTaskTitle.trim()) return;
        const newTaskId = `t${Date.now()}`;
        const initials = newTaskAssigneeInitials.trim() || "AY";
        const taskData = {
            id: newTaskId,
            title: newTaskTitle.trim(),
            assignee_name: newTaskAssigneeName.trim() || "Alex (Admin)",
            assignee_initials: initials,
            tag: newTaskTag.trim() || "Work",
            created_by: newTaskCreator.trim() || currentUserName,
            deadline: newTaskDeadline || null,
            status: colId,
            priority: "medium"
        };

        fetchApi(`/projects/${id}/tasks`, {
            method: "POST",
            body: JSON.stringify(taskData)
        })
            .then(() => {
                fetchTasks();
            })
            .catch(err => console.error("Error creating task:", err));

        setNewTaskTitle("");
        setNewTaskAssigneeName("");
        setNewTaskAssigneeInitials("");
        setNewTaskTag("");
        setNewTaskCreator(currentUserName);
        setNewTaskDeadline("");
        setShowAddTask(null);
    };

    return (
        <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
            {/* Approval Requests list */}
            {approvalRequests.length > 0 && (
                <div style={{ background: "rgba(212,168,67,0.08)", border: "1px solid #D4A843", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D4A843" }} />
                        <span style={{ color: "#D4A843", fontSize: "12px", fontWeight: 700 }}>YÊU CẦU DUYỆT CÔNG VIỆC ({approvalRequests.length})</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {approvalRequests.map((req) => (
                            <div key={req.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(20,16,16,0.6)", borderRadius: "8px", padding: "8px 12px", border: "1px solid #2A1F1F" }}>
                                <div style={{ textAlign: "left" }}>
                                    <p style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 600, margin: 0 }}>{req.taskLabel}</p>
                                    <p style={{ color: "#666", fontSize: "9px", margin: "2px 0 0" }}>Gửi bởi: <strong style={{ color: "#888" }}>{req.crewName}</strong> • {req.timestamp}</p>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                        onClick={() => handleRejectRequest(req.id)}
                                        style={{ background: "#2A1F1F", color: "#888", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "10px", cursor: "pointer" }}
                                    >
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => handleApproveRequest(req)}
                                        style={{ background: "#D4A843", color: "#0A0707", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}
                                    >
                                        Duyệt hoàn thành
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div style={{ display: "flex", gap: "12px", minWidth: "860px" }}>
                {KANBAN_COLUMNS.map(col => {
                    const colTasks = tasks.filter(t => t.col === col.id);
                    const isOver = dragOver === col.id;
                    return (
                        <div
                            key={col.id}
                            onDragOver={e => onDragOver(e, col.id)}
                            onDrop={e => onDrop(e, col.id)}
                            onDragLeave={() => setDragOver(null)}
                            style={{
                                flex: "1", minWidth: "160px",
                                borderRadius: "14px",
                                background: isOver ? `${col.color}0F` : "rgba(29,22,22,0.4)",
                                border: `1.5px solid ${isOver ? col.color + "55" : "rgba(46,32,32,0.5)"}`,
                                backdropFilter: "blur(12px)",
                                transition: "all 0.18s ease",
                            }}
                        >
                            {/* Column Header */}
                            <div style={{ padding: "12px 12px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: col.color }} />
                                    <span style={{ color: col.color, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        {col.label}
                                    </span>
                                </div>
                                <span style={{ background: col.color + "22", color: col.color, borderRadius: "20px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>
                                    {colTasks.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: "7px", minHeight: "60px" }}>
                                {colTasks.map(task => {
                                    const overdue = isOverdue(task.deadline);
                                    const daysLeft = getDaysLeft(task.deadline);
                                    const isDragging = dragging === task.id;
                                    return (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={e => onDragStart(e, task.id)}
                                            onDragEnd={onDragEnd}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveTaskMenu(activeTaskMenu === task.id ? null : task.id);
                                            }}
                                            style={{
                                                position: "relative",
                                                background: isDragging ? "rgba(216,64,64,0.1)" : "rgba(29,22,22,0.85)",
                                                border: `1px solid ${overdue ? "rgba(216,64,64,0.4)" : isDragging ? "#D84040" : "rgba(46,32,32,0.7)"}`,
                                                borderRadius: "10px", padding: "9px 11px",
                                                cursor: "grab", opacity: isDragging ? 0.5 : 1,
                                                transition: "all 0.15s",
                                                boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.2)",
                                            }}
                                            onMouseEnter={e => { if (!isDragging) e.currentTarget.style.borderColor = col.color + "55"; }}
                                            onMouseLeave={e => { if (!isDragging) e.currentTarget.style.borderColor = overdue ? "rgba(216,64,64,0.4)" : "rgba(46,32,32,0.7)"; }}
                                        >
                                            {activeTaskMenu === task.id && (
                                                <>
                                                    <div 
                                                        style={{ position: "fixed", inset: 0, zIndex: 30 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveTaskMenu(null);
                                                        }}
                                                    />
                                                    <div style={{
                                                        position: "absolute", right: "8px", top: "28px", width: "110px",
                                                        borderRadius: "8px", border: "1px solid #2A1F1F", zIndex: 40,
                                                        padding: "4px", background: "#141010", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                                                    }} onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => {
                                                                handleEditTaskClick(col.id, task);
                                                                setActiveTaskMenu(null);
                                                            }}
                                                            style={{
                                                                width: "100%", textAlign: "left", padding: "5px 8px",
                                                                borderRadius: "4px", fontSize: "10px", display: "block",
                                                                background: "transparent", border: "none", color: "#EEEEEE",
                                                                fontWeight: 500, cursor: "pointer"
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                                        >
                                                            Sửa công việc
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleDeleteTask(task.id);
                                                                setActiveTaskMenu(null);
                                                            }}
                                                            style={{
                                                                width: "100%", textAlign: "left", padding: "5px 8px",
                                                                borderRadius: "4px", fontSize: "10px", display: "block",
                                                                background: "transparent", border: "none", color: "#D84040",
                                                                fontWeight: 500, cursor: "pointer"
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(216,64,64,0.1)"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                                        >
                                                            Xóa công việc
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    {task.tag && (
                                                        <span style={{
                                                            background: "#0A0707",
                                                            color: "#666",
                                                            fontSize: "9px",
                                                            fontWeight: 600,
                                                            textTransform: "uppercase",
                                                            padding: "1px 5px",
                                                            borderRadius: "4px"
                                                        }}>
                                                            {task.tag}
                                                        </span>
                                                    )}
                                                    <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: task.priority === "high" ? "#D84040" : task.priority === "medium" ? "#E8A838" : "#555" }} />
                                                </div>
                                                {overdue && (
                                                    <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#f87171", fontSize: "9px", fontWeight: 700 }}>
                                                        <AlertTriangle size={8} /> TRỄHẠN
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500, lineHeight: 1.4, marginBottom: "8px" }}>{task.title}</p>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <AvatarBubble initials={task.assignee} size={22} color={avatarColor(task.assigneeName)} />
                                                    <span style={{ color: "#888", fontSize: "11px", fontWeight: 500 }}>{task.assigneeName}</span>
                                                </div>
                                                {task.deadline && (
                                                    <span style={{ fontSize: "9px", color: overdue ? "#f87171" : daysLeft !== null && daysLeft <= 2 ? "#E8A838" : "#555", fontWeight: overdue ? 700 : 400 }}>
                                                        {overdue ? `${Math.abs(daysLeft!)}d trễ` : daysLeft === 0 ? "Hôm nay" : `${daysLeft}d`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add Task */}
                                {showAddTask === col.id ? (
                                    <div style={{ background: "rgba(29,22,22,0.9)", border: "1px solid #D84040", borderRadius: "10px", padding: "9px 11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <input
                                            autoFocus value={newTaskTitle}
                                            onChange={e => setNewTaskTitle(e.target.value)}
                                            placeholder="Nội dung task..."
                                            style={{ background: "transparent", border: "none", borderBottom: "1px solid #2A1F1F", outline: "none", color: "#EEEEEE", fontSize: "12px", width: "100%", paddingBottom: "3px" }}
                                        />
                                        <div style={{ position: "relative" }}>
                                            <input
                                                value={newTaskAssigneeName}
                                                onChange={e => {
                                                    setNewTaskAssigneeName(e.target.value);
                                                    setSearchAssigneeQuery(e.target.value);
                                                    setShowAssigneeDropdown(true);
                                                }}
                                                onFocus={() => {
                                                    setShowAssigneeDropdown(true);
                                                    setSearchAssigneeQuery(newTaskAssigneeName);
                                                }}
                                                placeholder="Chọn người thực hiện..."
                                                style={{ background: "transparent", border: "none", borderBottom: "1px solid #2A1F1F", outline: "none", color: "#EEEEEE", fontSize: "11px", width: "100%", paddingBottom: "3px" }}
                                            />
                                            {showAssigneeDropdown && (
                                                <>
                                                    <div 
                                                        style={{ position: "fixed", inset: 0, zIndex: 10 }}
                                                        onClick={() => setShowAssigneeDropdown(false)}
                                                    />
                                                    <div style={{
                                                        position: "absolute", left: 0, right: 0, marginTop: "4px",
                                                        maxHeight: "160px", overflowY: "auto", borderRadius: "8px",
                                                        border: "1px solid #2A1F1F", zIndex: 20, padding: "4px",
                                                        background: "#141010", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                                                    }}>
                                                        {crewList
                                                            .filter(c => c.name.toLowerCase().includes(searchAssigneeQuery.toLowerCase()))
                                                            .map(c => {
                                                                const initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                                                                return (
                                                                    <button
                                                                        key={c.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setNewTaskAssigneeName(c.name);
                                                                            setNewTaskAssigneeInitials(initials);
                                                                            setShowAssigneeDropdown(false);
                                                                        }}
                                                                        style={{
                                                                            width: "100%", textAlign: "left", padding: "6px 10px",
                                                                            borderRadius: "4px", fontSize: "11px", display: "flex",
                                                                            alignItems: "center", gap: "6px", background: "transparent",
                                                                            border: "none", color: "#EEEEEE", cursor: "pointer"
                                                                        }}
                                                                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(216, 64, 64, 0.1)"; e.currentTarget.style.color = "#D84040"; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#EEEEEE"; }}
                                                                    >
                                                                        {c.avatar ? (
                                                                            <img src={c.avatar} alt={c.name} style={{ width: "14px", height: "14px", borderRadius: "50%", objectFit: "cover" }} />
                                                                        ) : (
                                                                            <div style={{ width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "bold", color: "white", background: "#2A1F1F" }}>
                                                                                {c.name.substring(0, 1).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                        <span>{c.name}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        {crewList.filter(c => c.name.toLowerCase().includes(searchAssigneeQuery.toLowerCase())).length === 0 && (
                                                            <p style={{ fontSize: "10px", color: "#555", padding: "6px", fontStyle: "italic", textAlign: "center", margin: 0 }}>
                                                                Không tìm thấy thành viên
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            value={newTaskTag}
                                            onChange={e => setNewTaskTag(e.target.value)}
                                            placeholder="Tag (ví dụ: Motion)..."
                                            style={{ background: "transparent", border: "none", borderBottom: "1px solid #2A1F1F", outline: "none", color: "#EEEEEE", fontSize: "11px", width: "100%", paddingBottom: "3px" }}
                                        />
                                        <input
                                            value={newTaskCreator}
                                            onChange={e => setNewTaskCreator(e.target.value)}
                                            placeholder="Người tạo..."
                                            style={{ background: "transparent", border: "none", borderBottom: "1px solid #2A1F1F", outline: "none", color: "#EEEEEE", fontSize: "11px", width: "100%", paddingBottom: "3px" }}
                                        />
                                        <input
                                            type="date"
                                            value={newTaskDeadline}
                                            onChange={e => setNewTaskDeadline(e.target.value)}
                                            style={{ background: "transparent", border: "none", borderBottom: "1px solid #2A1F1F", outline: "none", color: "#666", fontSize: "11px", width: "100%", paddingBottom: "3px" }}
                                        />
                                        <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
                                            <button onClick={() => addTask(col.id)} style={{ flex: 1, background: "#D84040", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 0", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>Thêm</button>
                                            <button onClick={() => { setShowAddTask(null); setNewTaskTitle(""); setNewTaskAssigneeName(""); setNewTaskAssigneeInitials(""); setNewTaskTag(""); setNewTaskCreator(currentUserName); setNewTaskDeadline(""); }} style={{ background: "#2A1F1F", color: "#888", border: "none", borderRadius: "6px", padding: "5px 8px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowAddTask(col.id);
                                            setNewTaskTitle("");
                                            setNewTaskAssigneeName("");
                                            setNewTaskAssigneeInitials("");
                                            setNewTaskTag("");
                                            setNewTaskCreator(currentUserName);
                                            setNewTaskDeadline("");
                                        }}
                                        style={{ width: "100%", background: "transparent", border: "1px dashed #2A1F1F", borderRadius: "10px", padding: "7px", color: "#555", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.15s" }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = col.color + "55"; e.currentTarget.style.color = col.color; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A1F1F"; e.currentTarget.style.color = "#555"; }}
                                    >
                                        <Plus size={11} /> Thêm task
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Edit Task Modal */}
            {editingTask && (
                <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                    <div style={{ width: "100%", maxWidth: "360px", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid #2A1F1F", background: "#141010", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
                        <h3 style={{ color: "#fff", fontSize: "14px", fontWeight: 600, borderBottom: "1px solid #2A1F1F", paddingBottom: "8px", margin: 0 }}>Chỉnh sửa công việc</h3>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#888", marginBottom: "4px" }}>Tên công việc</label>
                                <input
                                    type="text"
                                    value={editTaskTitle}
                                    onChange={e => setEditTaskTitle(e.target.value)}
                                    style={{ width: "100%", boxSizing: "border-box", background: "#1D1616", border: "1px solid #2A1F1F", borderRadius: "4px", padding: "6px 10px", fontSize: "12px", color: "#fff", outline: "none" }}
                                />
                            </div>
                            
                            <div style={{ position: "relative" }}>
                                <label style={{ display: "block", fontSize: "10px", color: "#888", marginBottom: "4px" }}>Người thực hiện</label>
                                <input
                                    type="text"
                                    value={editTaskAssigneeName}
                                    onChange={e => {
                                        setEditTaskAssigneeName(e.target.value);
                                        setSearchEditAssigneeQuery(e.target.value);
                                        setShowEditAssigneeDropdown(true);
                                    }}
                                    onFocus={() => {
                                        setShowEditAssigneeDropdown(true);
                                        setSearchEditAssigneeQuery(editTaskAssigneeName);
                                    }}
                                    style={{ width: "100%", boxSizing: "border-box", background: "#1D1616", border: "1px solid #2A1F1F", borderRadius: "4px", padding: "6px 10px", fontSize: "12px", color: "#fff", outline: "none" }}
                                />
                                {showEditAssigneeDropdown && (
                                    <>
                                        <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowEditAssigneeDropdown(false)} />
                                        <div style={{
                                            position: "absolute", left: 0, right: 0, marginTop: "4px",
                                            maxHeight: "120px", overflowY: "auto", borderRadius: "4px",
                                            border: "1px solid #2A1F1F", zIndex: 20, padding: "4px",
                                            background: "#141010", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                                        }}>
                                            {crewList
                                                .filter(c => c.name.toLowerCase().includes(searchEditAssigneeQuery.toLowerCase()))
                                                .map(c => {
                                                    const initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                                                    return (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setEditTaskAssigneeName(c.name);
                                                                setEditTaskAssigneeInitials(initials);
                                                                setShowEditAssigneeDropdown(false);
                                                            }}
                                                            style={{
                                                                width: "100%", textAlign: "left", padding: "6px 10px",
                                                                borderRadius: "4px", fontSize: "11px", display: "flex",
                                                                alignItems: "center", gap: "6px", background: "transparent",
                                                                border: "none", color: "#EEEEEE", cursor: "pointer"
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(216, 64, 64, 0.1)"; e.currentTarget.style.color = "#D84040"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#EEEEEE"; }}
                                                        >
                                                            {c.avatar ? (
                                                                <img src={c.avatar} alt={c.name} style={{ width: "14px", height: "14px", borderRadius: "50%", objectFit: "cover" }} />
                                                            ) : (
                                                                <div style={{ width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "bold", color: "white", background: "#2A1F1F" }}>
                                                                    {c.name.substring(0, 1).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <span>{c.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            {crewList.filter(c => c.name.toLowerCase().includes(searchEditAssigneeQuery.toLowerCase())).length === 0 && (
                                                <p style={{ fontSize: "10px", color: "#555", padding: "6px", fontStyle: "italic", textAlign: "center", margin: 0 }}>
                                                    Không tìm thấy thành viên
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#888", marginBottom: "4px" }}>Tag (Nhãn)</label>
                                <input
                                    type="text"
                                    value={editTaskTag}
                                    onChange={e => setEditTaskTag(e.target.value)}
                                    style={{ width: "100%", boxSizing: "border-box", background: "#1D1616", border: "1px solid #2A1F1F", borderRadius: "4px", padding: "6px 10px", fontSize: "12px", color: "#fff", outline: "none" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#888", marginBottom: "4px" }}>Người tạo</label>
                                <input
                                    type="text"
                                    value={editTaskCreator}
                                    onChange={e => setEditTaskCreator(e.target.value)}
                                    style={{ width: "100%", boxSizing: "border-box", background: "#1D1616", border: "1px solid #2A1F1F", borderRadius: "4px", padding: "6px 10px", fontSize: "12px", color: "#fff", outline: "none" }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #2A1F1F", paddingTop: "12px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setEditingTask(null)}
                                style={{ background: "#2A1F1F", color: "#888", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={saveEditedTask}
                                style={{ background: "#D84040", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
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

// ─── Admin Tab: Overview ──────────────────────────────────────────────────────

function OverviewAdminTab({ project, navigate }: { project: any; navigate: any }) {
    const isWaiting = !project.dueDate;
    const daysLeft = project.dueDate ? getDaysLeft(project.dueDate) : null;
    const isLate = daysLeft !== null && daysLeft < 0;
    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

    const [tasks, setTasks] = useState<any[]>([]);
    const [docs, setDocs] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);

    useEffect(() => {
        if (!project?.id && !project?.slug) return;
        
        // Fetch tasks
        if (project.id) {
            fetchApi<any[]>(`/projects/${project.id}/tasks`)
                .then(data => setTasks(data))
                .catch(() => {});
                
            fetchApi<any[]>(`/projects/${project.id}/feedback`)
                .then(data => setFeedbacks(data))
                .catch(() => {});
        }
        
        // Fetch docs
        if (project.slug) {
            fetchApi<any[]>("/media")
                .then(data => {
                    const filtered = data.filter(d => d.project_slug === project.slug && ["creative brief", "tài liệu hợp đồng", "báo giá", "hoá đơn"].includes(d.folder));
                    setDocs(filtered);
                })
                .catch(() => {});
        }
    }, [project?.id, project?.slug]);

    const projectStages = [
        { id: "Sản xuất", done: project.progress >= 30 },
        { id: "Hậu kỳ", done: project.progress >= 70 },
        { id: "Bàn giao", done: project.progress >= 95 },
    ];

    const completedTasks = tasks.filter(t => t.status === "done").length;
    const totalTasks = tasks.length;
    const crewCount = project.credits?.length || 0;
    const fileCount = (project.gallery?.filter((g: any) => g.type === "video")?.length || 0) + docs.length;
    const commentCount = feedbacks.length;

    const stats = [
        { label: "Tasks hoàn thành", value: `${completedTasks} / ${totalTasks}`, icon: CheckCheck, color: "#4CAF50" },
        { label: "Thành viên", value: `${crewCount} người`, icon: User, color: "#6B8FD6" },
        { label: "Files đã upload", value: `${fileCount} files`, icon: ImageIcon, color: "#C084FC" },
        { label: "Phản hồi KH", value: `${commentCount} comments`, icon: MessageSquare, color: "#E8A838" },
    ];

    const activeStage = projectStages.filter(s => s.done).pop()?.id;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Hero status strip */}
            <div style={{
                borderRadius: "14px", padding: "18px 22px",
                background: "linear-gradient(135deg, rgba(142,22,22,0.18) 0%, rgba(29,22,22,0.5) 100%)",
                border: "1px solid rgba(216,64,64,0.2)", backdropFilter: "blur(16px)",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px",
            }}>
                <div>
                    <span style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>Trạng thái hiện tại</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                            padding: "4px 12px", borderRadius: "20px",
                            background: statusColors[project.status]?.bg || "#333",
                            color: statusColors[project.status]?.text || "#fff",
                            fontSize: "12px", fontWeight: 700,
                            border: `1px solid ${statusColors[project.status]?.text || "#555"}33`,
                        }}>{project.status}</span>
                        {activeStage && (
                            <span style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(107,143,214,0.15)", color: "#6B8FD6", fontSize: "11px", fontWeight: 600, border: "1px solid rgba(107,143,214,0.3)" }}>
                                📍 {activeStage}
                            </span>
                        )}
                        {project.published ? (
                            <span style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(76,175,80,0.15)", color: "#4CAF50", fontSize: "11px", fontWeight: 600, border: "1px solid rgba(76,175,80,0.3)" }}>
                                🌐 Published
                            </span>
                        ) : (
                            <span style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(136,136,136,0.15)", color: "#888", fontSize: "11px", fontWeight: 600, border: "1px solid rgba(136,136,136,0.3)" }}>
                                🔒 Draft
                            </span>
                        )}
                        {project.locked && (
                            <span style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(216,64,64,0.15)", color: "#D84040", fontSize: "11px", fontWeight: 600, border: "1px solid rgba(216,64,64,0.3)" }}>
                                ⛔ Locked
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <p style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>Deadline</p>
                    <p style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: isWaiting ? "#888" : isLate ? "#f87171" : "#E8A838", fontVariantNumeric: "tabular-nums" }}>
                        {isWaiting ? "Chờ" : daysLeft === null ? "—" : isLate ? `${Math.abs(daysLeft)} ngày trễ` : daysLeft === 0 ? "Hôm nay!" : `${daysLeft} ngày`}
                    </p>
                    {!isWaiting && project.dueDate && <p style={{ color: "#555", fontSize: "10px", marginTop: "2px" }}>{new Date(project.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>}
                </div>
            </div>

            {/* Progress bar + stages */}
            <div style={{ borderRadius: "14px", padding: "18px", background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#888", fontSize: "12px" }}>Tiến độ tổng thể</span>
                    <span style={{ color: "#D84040", fontSize: "15px", fontWeight: 800 }}>{project.progress}%</span>
                </div>
                <div style={{ height: "8px", borderRadius: "99px", background: "#2A1F1F", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ height: "100%", borderRadius: "99px", width: `${project.progress}%`, background: project.progress === 100 ? "#4CAF50" : "linear-gradient(90deg, #8E1616, #D84040, #E8A838)", transition: "width 0.6s ease", boxShadow: "0 0 10px rgba(216,64,64,0.3)" }} />
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {projectStages.map((stage, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: stage.done ? "#4CAF50" : "#2A1F1F", border: `2px solid ${stage.done ? "#4CAF50" : "#3A2A2A"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {stage.done && <CheckCircle2 size={9} color="#fff" />}
                            </div>
                            <span style={{ color: stage.done ? "#4CAF50" : "#444", fontSize: "11px" }}>{stage.id}</span>
                            {i < projectStages.length - 1 && <ArrowRight size={9} color="#333" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* KPI mini grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{ borderRadius: "12px", padding: "14px 16px", background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: stat.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <stat.icon size={14} color={stat.color} />
                        </div>
                        <div>
                            <p style={{ color: stat.color, fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>{stat.value}</p>
                            <p style={{ color: "#666", fontSize: "10px", marginTop: "3px" }}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Linked client */}
            <div style={{ borderRadius: "12px", padding: "14px 18px", background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AvatarBubble initials={project.client?.slice(0, 2).toUpperCase() || "CL"} imgUrl={project.client_logo} size={36} color="#1E3A5F" />
                    <div>
                        <p style={{ color: "#888", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Khách hàng</p>
                        <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>{project.client}</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate("/admin/clients")}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "8px", background: "rgba(107,143,214,0.15)", color: "#6B8FD6", border: "1px solid rgba(107,143,214,0.3)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(107,143,214,0.25)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(107,143,214,0.15)"}
                >
                    <ExternalLink size={11} /> Mở hồ sơ CRM
                </button>
            </div>
        </div>
    );
}

// ─── Admin Tab: Financials ─────────────────────────────────────────────────────

function FinancialsTab({ project, expenses, invoices, dbClients, setInvoices }: { project: any, expenses: any[], invoices: any[], dbClients: any[], setInvoices?: React.Dispatch<React.SetStateAction<any[]>> }) {
    const navigate = useNavigate();
    const [showAddInvoice, setShowAddInvoice] = useState(false);
    const [submittingInvoice, setSubmittingInvoice] = useState(false);
    const [newInvoice, setNewInvoice] = useState({
        term: "",
        amount: "",
        dueDate: new Date().toISOString().split('T')[0],
        status: "pending"
    });

    const handleSaveInvoice = async () => {
        if (!newInvoice.term || !newInvoice.amount) return;
        setSubmittingInvoice(true);
        try {
            const payload = {
                client_slug: project.client_slug || "",
                client_name: project.client || "",
                project: project.title,
                term: newInvoice.term,
                amount: parseFloat(newInvoice.amount) || 0,
                due_date: newInvoice.dueDate,
                status: newInvoice.status,
                note: ""
            };
            const created = await fetchApi("/finance/invoices", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            if (setInvoices) {
                setInvoices(prev => [created, ...prev]);
            }
            setShowAddInvoice(false);
            setNewInvoice({
                term: "",
                amount: "",
                dueDate: new Date().toISOString().split('T')[0],
                status: "pending"
            });
        } catch (e) {
            console.error("Failed to save invoice:", e);
            alert("Không thể lưu hóa đơn, vui lòng thử lại!");
        } finally {
            setSubmittingInvoice(false);
        }
    };

    const contractValue = project?.budget ? parseInt(String(project.budget).replace(/[^\d]/g, "")) || 0 : 0;
    
    // Filter expenses for this project
    const projExpenses = expenses.filter((e: any) => 
        e.project && (e.project.toLowerCase() === project?.title?.toLowerCase() || 
                      e.project.toLowerCase().includes(project?.title?.toLowerCase() + " —") ||
                      e.project.toLowerCase() === project?.slug?.toLowerCase())
    );
    const actualCosts = projExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const profit = contractValue - actualCosts;
    const margin = contractValue > 0 ? (profit / contractValue) * 100 : 0;
    const isDanger = margin < 15 && contractValue > 0;
    const isWarning = margin >= 15 && margin < 30 && contractValue > 0;
    const marginColor = contractValue === 0 ? "#888" : isDanger ? "#f87171" : isWarning ? "#E8A838" : "#4CAF50";

    // Build dynamic cost breakdown from expenses
    const categoryGroups = projExpenses.reduce((groups: any, e: any) => {
        const cat = e.category || "Khác";
        groups[cat] = (groups[cat] || 0) + (e.amount || 0);
        return groups;
    }, {});

    const colors = ["#D84040", "#fbbf24", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];
    const costBreakdown = Object.entries(categoryGroups).map(([label, amount]: [string, any], idx) => {
        const pct = contractValue > 0 ? Math.round((amount / contractValue) * 100) : 0;
        return {
            label,
            amount,
            pct,
            color: colors[idx % colors.length]
        };
    }).sort((a, b) => b.amount - a.amount);

    // Filter project invoices (from both client_invoices table and client notes CRM data)
    const projInvoices = invoices.filter((inv: any) => 
        inv.project && (inv.project.toLowerCase() === project?.title?.toLowerCase() ||
                        inv.project.toLowerCase() === project?.slug?.toLowerCase())
    );

    const currentClient = dbClients.find((c: any) => c.slug === project?.client_slug);
    let crmInvoices: any[] = [];
    if (currentClient && currentClient.notes) {
        try {
            const parsedNotes = JSON.parse(currentClient.notes);
            if (parsedNotes && Array.isArray(parsedNotes.invoices)) {
                crmInvoices = parsedNotes.invoices;
            }
        } catch (e) {
            console.warn("Error parsing client notes in FinancialsTab:", e);
        }
    }

    const cleanProjectSlug = project?.slug?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || "";
    const cleanProjectTitle = project?.title?.toLowerCase() || "";
    
    const matchedCrmInvoices = crmInvoices.filter((inv: any) => {
        const desc = (inv.description || "").toLowerCase();
        const code = (inv.code || "").toLowerCase();
        if (desc.includes(cleanProjectTitle) || code.includes(cleanProjectSlug)) return true;
        const initials = cleanProjectTitle.split(' ').map(w => w[0]).join('');
        if (initials && initials.length >= 2 && code.includes(initials)) return true;
        if (cleanProjectSlug === "l-l" && code.includes("ll")) return true;
        if (cleanProjectSlug === "l-l" && desc.includes("quay chụp")) return true;
        return false;
    });

    const allInvoices = projInvoices.map((inv: any) => ({
        id: inv.id,
        name: inv.term || inv.description || "Thanh toán đợt",
        date: inv.due_date || inv.date || "",
        amount: parseFloat(inv.amount) || 0,
        status: (inv.status || "").toLowerCase()
    }));
    
    matchedCrmInvoices.forEach((inv: any) => {
        if (!allInvoices.some(existing => existing.id === inv.id || existing.name === inv.description)) {
            allInvoices.push({
                id: inv.id,
                name: inv.description || `Hóa đơn ${inv.code}`,
                date: inv.date || "",
                amount: parseFloat(inv.amount) || 0,
                status: (inv.status || "").toLowerCase()
            });
        }
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {[
                    { label: "Tổng giá trị HĐ", value: fmtVND(contractValue), icon: Banknote, color: "#4CAF50", sub: "Hợp đồng đã ký (Xem CRM)" },
                    { label: "Chi phí thực tế", value: fmtVND(actualCosts), icon: TrendingDown, color: "#E8A838", sub: `${contractValue > 0 ? Math.round((actualCosts / contractValue) * 100) : 0}% giá trị HĐ (Xem chi phí)` },
                    { label: "Biên lợi nhuận", value: `${margin.toFixed(0)}%`, icon: Target, color: marginColor, sub: fmtVND(profit) + " lợi nhuận ròng (Xem tổng quan)" },
                ].map((kpi, i) => (
                    <div 
                        key={i} 
                        onClick={() => {
                            if (i === 0) navigate(`/admin/clients/${project.client_slug}`);
                            if (i === 1) navigate(`/admin/finance/expenses?tab=cogs&project=${encodeURIComponent(project.title)}`);
                            if (i === 2) navigate(`/admin/finance/overview`);
                        }}
                        style={{ 
                            borderRadius: "12px", 
                            padding: "16px", 
                            background: i === 2 ? `${marginColor}10` : "rgba(29,22,22,0.4)", 
                            border: `1px solid ${i === 2 ? marginColor + "33" : "rgba(46,32,32,0.6)"}`, 
                            backdropFilter: "blur(8px)",
                            cursor: "pointer",
                            transition: "border-color 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#D84040"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = i === 2 ? marginColor + "33" : "rgba(46,32,32,0.6)"}
                        title="Click để chuyển sang trang Tài chính tương ứng"
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <span style={{ color: "#888", fontSize: "11px" }}>{kpi.label}</span>
                            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: kpi.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <kpi.icon size={13} color={kpi.color} />
                            </div>
                        </div>
                        <p style={{ color: kpi.color, fontSize: "20px", fontWeight: 800, lineHeight: 1, marginBottom: "4px" }}>{kpi.value}</p>
                        <p style={{ color: "#555", fontSize: "10px" }}>{kpi.sub}</p>
                        {i === 2 && isDanger && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "7px", padding: "3px 7px", borderRadius: "5px", background: "rgba(248,113,113,0.15)" }}>
                                <AlertTriangle size={9} color="#f87171" />
                                <span style={{ color: "#f87171", fontSize: "9px", fontWeight: 600 }}>Chi phí đang ăn lẹm vào lợi nhuận!</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Cost breakdown */}
            <div style={{ borderRadius: "12px", padding: "18px", background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)" }}>
                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>Chi phí thực tế vs Ngân sách</p>
                <div style={{ height: "20px", borderRadius: "6px", background: "#2A1F1F", overflow: "hidden", position: "relative", marginBottom: "4px" }}>
                    <div style={{ height: "100%", width: `${contractValue > 0 ? Math.min((actualCosts / contractValue) * 100, 100) : 0}%`, background: "linear-gradient(90deg, #8E1616, #D84040)", borderRadius: "6px", transition: "width 0.6s ease" }} />
                    <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#EEEEEE", fontSize: "10px", fontWeight: 600 }}>{fmtVND(contractValue)}</span>
                </div>
                <p style={{ color: "#D84040", fontSize: "10px", marginBottom: "14px" }}>{fmtVND(actualCosts)} đã chi ({contractValue > 0 ? Math.round((actualCosts / contractValue) * 100) : 0}%)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    {costBreakdown.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: item.color, flexShrink: 0 }} />
                            <span style={{ color: "#888", fontSize: "11px", flex: 1 }}>{item.label}</span>
                            <div style={{ width: "80px", height: "4px", borderRadius: "2px", background: "#2A1F1F" }}>
                                <div style={{ height: "100%", width: `${item.pct}%`, borderRadius: "2px", background: item.color }} />
                            </div>
                            <span style={{ color: item.color, fontSize: "11px", fontWeight: 600, minWidth: "65px", textAlign: "right" }}>{fmtVND(item.amount)}</span>
                        </div>
                    ))}
                    {costBreakdown.length === 0 && (
                        <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-4">Chưa có chi phí thực tế phát sinh cho dự án này.</p>
                    )}
                </div>
            </div>

            {/* Invoices */}
            <div style={{ borderRadius: "12px", background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)", overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #2A1F1F", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Receipt size={13} color="#D84040" />
                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Hóa đơn thanh toán</p>
                    </div>
                    <button 
                        onClick={() => setShowAddInvoice(!showAddInvoice)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold hover:opacity-80 transition-opacity"
                        style={{ background: "rgba(216, 64, 64, 0.15)", color: "#D84040", border: "1px solid rgba(216, 64, 64, 0.3)" }}
                    >
                        <Plus size={11} /> Thêm hóa đơn
                    </button>
                </div>

                {showAddInvoice && (
                    <div className="px-5 py-4 border-b border-[#2A1F1F] space-y-3" style={{ background: "rgba(20, 15, 15, 0.2)" }}>
                        <p className="text-[11px] font-semibold uppercase text-white/50">Tạo hóa đơn mới cho dự án này</p>
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                placeholder="Tên đợt thanh toán (Mô tả)" 
                                value={newInvoice.term}
                                onChange={e => setNewInvoice(p => ({ ...p, term: e.target.value }))}
                                className="px-2 py-1.5 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }}
                            />
                            <input 
                                type="number"
                                placeholder="Số tiền (₫)" 
                                value={newInvoice.amount}
                                onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))}
                                className="px-2 py-1.5 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                type="date"
                                value={newInvoice.dueDate}
                                onChange={e => setNewInvoice(p => ({ ...p, dueDate: e.target.value }))}
                                className="px-2 py-1.5 rounded outline-none text-[#EEEEEE]" style={{ ...inputStyle, fontSize: "12px", colorScheme: "dark" }}
                            />
                            <select
                                value={newInvoice.status}
                                onChange={e => setNewInvoice(p => ({ ...p, status: e.target.value }))}
                                className="px-2 py-1.5 rounded outline-none cursor-pointer" style={{ ...inputStyle, fontSize: "12px" }}
                            >
                                <option value="pending">Chờ thu (Pending)</option>
                                <option value="paid">Đã thu (Paid)</option>
                                <option value="overdue">Quá hạn (Overdue)</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-1.5">
                            <button
                                onClick={() => {
                                    setShowAddInvoice(false);
                                    setNewInvoice({ term: "", amount: "", dueDate: new Date().toISOString().split('T')[0], status: "pending" });
                                }}
                                className="px-3 py-1 rounded text-xs font-medium text-white/60 hover:text-white/90"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveInvoice}
                                disabled={submittingInvoice}
                                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold text-white transition-all disabled:opacity-50"
                                style={{ background: "#D84040" }}
                            >
                                {submittingInvoice ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Lưu hóa đơn
                            </button>
                        </div>
                    </div>
                )}

                {allInvoices.map((inv, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: i < allInvoices.length - 1 ? "1px solid #2A1F1F" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: inv.status === "paid" ? "rgba(76,175,80,0.15)" : "rgba(232,168,56,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {inv.status === "paid" ? <CheckCircle2 size={14} color="#4CAF50" /> : <Clock size={14} color="#E8A838" />}
                            </div>
                            <div>
                                <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>{inv.name}</p>
                                <p style={{ color: "#555", fontSize: "10px" }}>{inv.date || "Chưa phát sinh"}</p>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ color: inv.status === "paid" ? "#4CAF50" : "#E8A838", fontSize: "13px", fontWeight: 700 }}>{fmtVND(inv.amount)}</span>
                            <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, background: inv.status === "paid" ? "rgba(76,175,80,0.15)" : "rgba(232,168,56,0.15)", color: inv.status === "paid" ? "#4CAF50" : "#E8A838" }}>
                                {inv.status === "paid" ? "Đã thu" : "Chờ thu"}
                            </span>
                        </div>
                    </div>
                ))}
                {allInvoices.length === 0 && (
                    <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-8">Chưa có hóa đơn thanh toán nào được tạo.</p>
                )}
            </div>
        </div>
    );
}

// ─── Admin Tab: Media ──────────────────────────────────────────────────────────

function MediaAdminTab({ project, feedbacks, setFeedbacks, setProject }: { project: any, feedbacks: any[], setFeedbacks: React.Dispatch<React.SetStateAction<any[]>>, setProject: React.Dispatch<React.SetStateAction<any>> }) {
    const navigate = useNavigate();
    const media = [...(project?.gallery || [])].filter((item: any) => item.type === 'video').reverse();
    const [mediaView, setMediaView] = useState<"grid" | "feedback">("grid");
    const [uploadingFiles, setUploadingFiles] = useState<{ id: string, name: string, progress: number, type: string, previewUrl: string }[]>([]);
    const [replyText, setReplyText] = useState<Record<number, string>>({});

    const formattedFeedbacks = feedbacks.map(fb => ({
        id: fb.id,
        user: fb.user_id === "Admin" ? "Admin" : "Đối tác (Client)",
        text: fb.content,
        file: "Video Review",
        timestamp: fb.timecode >= 0 ? `${Math.floor(fb.timecode / 60)}:${String(Math.floor(fb.timecode % 60)).padStart(2, "0")}` : "General",
        time: new Date(fb.created_at).toLocaleDateString("vi-VN") + " " + new Date(fb.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
        resolved: fb.status === "Resolved",
        reply_content: fb.reply_content,
        reply_author: fb.reply_author
    }));

    const togglePublish = async (mediaAssetId: string, currentPublished: boolean) => {
        try {
            const nextPublished = !currentPublished;
            await fetchApi(`/projects/gallery/${mediaAssetId}/publish?published=${nextPublished}`, {
                method: "PUT"
            });
            setProject((prev: any) => {
                if (!prev) return null;
                return {
                    ...prev,
                    gallery: (prev.gallery || []).map((g: any) => 
                        g.id === mediaAssetId ? { ...g, published: nextPublished } : g
                    )
                };
            });
        } catch (e) {
            console.error("Failed to toggle publish status:", e);
        }
    };

    const handleDeleteMedia = async (mediaAssetId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa file này khỏi dự án?")) return;
        try {
            await fetchApi(`/projects/gallery/${mediaAssetId}`, {
                method: "DELETE"
            });
            setProject((prev: any) => {
                if (!prev) return null;
                return {
                    ...prev,
                    gallery: (prev.gallery || []).filter((g: any) => g.id !== mediaAssetId)
                };
            });
        } catch (e) {
            console.error("Failed to delete media asset:", e);
        }
    };

    const resolveFeedback = async (id: number, currentStatus: boolean) => {
        try {
            const nextStatus = currentStatus ? "Open" : "Resolved";
            await fetchApi(`/projects/feedback/${id}/status?status_val=${nextStatus}`, {
                method: "PUT"
            });
            setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: nextStatus } : f));
        } catch (e) {
            console.error("Failed to update feedback status:", e);
        }
    };

    const handleSendReply = async (id: number) => {
        const text = replyText[id]?.trim();
        if (!text) return;
        try {
            await fetchApi<any>(`/projects/feedback/${id}/reply`, {
                method: "PUT",
                body: JSON.stringify({
                    reply_content: text,
                    reply_author: "Admin"
                })
            });
            setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, reply_content: text, reply_author: "Admin" } : f));
            setReplyText(prev => ({ ...prev, [id]: "" }));
        } catch (e) {
            console.error("Failed to reply to feedback:", e);
        }
    };

    const handleFileUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            // Rename file: [Tên dự án] Demo [Version bản demo]
            const demoNumber = media.length + 1;
            const cleanTitle = (project.title || "Project").replace(/[^a-zA-Z0-9\s]/g, '').trim();
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
                    project.slug,
                    "demo"
                );
                
                const updatedProj = await fetchApi<any>(`/projects/${project.slug}`);
                setProject(updatedProj);
            } catch (err) {
                console.error("Failed to upload project media:", err);
                alert("Upload file thất bại. Vui lòng thử lại!");
            } finally {
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
                URL.revokeObjectURL(previewUrl);
            }
        };
        input.click();
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Sub-tab */}
            <div style={{ display: "flex", gap: "4px", background: "rgba(29,22,22,0.4)", borderRadius: "10px", padding: "4px", border: "1px solid rgba(46,32,32,0.5)" }}>
                {[
                    { id: "grid", label: "📁 Thư viện Media" },
                    { id: "feedback", label: `💬 Phản hồi KH (${formattedFeedbacks.filter(f => !f.resolved).length} chưa xử lý)` },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setMediaView(tab.id as any)} style={{ flex: 1, padding: "7px 10px", borderRadius: "7px", border: "none", cursor: "pointer", background: mediaView === tab.id ? "#D84040" : "transparent", color: mediaView === tab.id ? "#fff" : "#666", fontSize: "12px", fontWeight: mediaView === tab.id ? 600 : 400, transition: "all 0.15s" }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {mediaView === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    {media.map(file => {
                        const videoThumb = file.type === "video"
                            ? (file.bunny_video_id 
                                ? `https://vz-f1a07f87-b02.b-cdn.net/${file.bunny_video_id}/thumbnail.jpg`
                                : (file.thumbnail_url && !file.thumbnail_url.includes("iframe") ? file.thumbnail_url : null))
                            : null;
                        const embedUrlForReview = file.url;
                        return (
                            <div key={file.id} style={{ borderRadius: "10px", overflow: "hidden", background: "rgba(29,22,22,0.5)", border: `1px solid ${file.published ? "rgba(76,175,80,0.3)" : "rgba(46,32,32,0.6)"}`, backdropFilter: "blur(8px)", position: "relative" }}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMedia(file.id); }}
                                    style={{ position: "absolute", top: "5px", right: "5px", padding: "4px", background: "rgba(0,0,0,0.6)", borderRadius: "50%", border: "none", cursor: "pointer", color: "#f87171", zIndex: 10 }}
                                    title="Xóa khỏi dự án"
                                >
                                    <Trash2 size={11} />
                                </button>
                                <div 
                                    className="group/thumb"
                                    onClick={() => {
                                        if (file.type === "video") {
                                            navigate(`/admin/projects/${project.slug}/playback?video=${encodeURIComponent(embedUrlForReview)}`);
                                        }
                                    }}
                                    title={file.type === "video" ? "Mở phòng chiếu Cinema Review" : undefined}
                                    style={{ height: "150px", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(46,32,32,0.5)", overflow: "hidden", position: "relative", cursor: file.type === "video" ? "pointer" : "default" }}
                                >
                                    {file.type === "video" ? (
                                        <>
                                            {videoThumb ? (
                                                <img src={videoThumb} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={file.name} />
                                            ) : (
                                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                                                    <Film size={28} color="#D84040" style={{ opacity: 0.7 }} />
                                                </div>
                                            )}
                                            {/* Hover overlay with Cinema Review label */}
                                            <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", gap: "4px" }}>
                                                <PlayCircle size={22} color="#D84040" />
                                                <span style={{ color: "#EEEEEE", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cinema Review</span>
                                            </div>
                                        </>
                                    ) : file.type === "image" ? (
                                        <img src={file.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={file.name} />
                                    ) : (
                                        <ImageIcon size={26} color="#6B8FD6" style={{ opacity: 0.6 }} />
                                    )}
                                </div>
                                <div style={{ padding: "8px 10px" }}>
                                    <p style={{ color: "#EEEEEE", fontSize: "10px", fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>{file.name}</p>
                                    <p style={{ color: "#555", fontSize: "9px", marginBottom: "6px" }}>{file.size} · {file.uploaded}</p>
                                    {file.type === "video" && (
                                        <button 
                                            onClick={() => navigate(`/admin/projects/${project.slug}/playback?video=${encodeURIComponent(embedUrlForReview)}`)}
                                            style={{ width: "100%", padding: "5px 0", borderRadius: "6px", border: "none", background: "rgba(216,64,64,0.15)", color: "#D84040", fontSize: "9px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "5px" }}
                                        >
                                            <MonitorPlay size={9} /> Mở Cinema Review
                                        </button>
                                    )}
                                    <button onClick={() => togglePublish(file.id, file.published)} style={{ width: "100%", padding: "5px 0", borderRadius: "6px", border: "none", background: file.published ? "rgba(76,175,80,0.15)" : "rgba(216,64,64,0.15)", color: file.published ? "#4CAF50" : "#D84040", fontSize: "9px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                        {file.published ? <><Unlock size={9} /> Published</> : <><Lock size={9} /> Publish to Client</>}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {/* Uploading files */}
                    {uploadingFiles.map(upFile => (
                        <div key={upFile.id} style={{ borderRadius: "10px", border: "1px solid rgba(46,32,32,0.5)", background: "rgba(29,22,22,0.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            <div style={{ height: "150px", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                {upFile.type.startsWith("image/") ? (
                                    <img src={upFile.previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} alt="preview" />
                                ) : (
                                    <Film size={26} color="#6B8FD6" style={{ opacity: 0.5 }} />
                                )}
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
                                    <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
                                        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(216,64,64,0.2)" strokeWidth="4" />
                                        <circle cx="22" cy="22" r="18" fill="none" stroke="#D84040" strokeWidth="4" strokeDasharray="113" strokeDashoffset={113 - (upFile.progress / 100) * 113} style={{ transition: "stroke-dashoffset 0.2s ease" }} />
                                    </svg>
                                    <span style={{ position: "absolute", color: "#EEEEEE", fontSize: "10px", fontWeight: "bold" }}>{upFile.progress}%</span>
                                </div>
                            </div>
                            <div style={{ padding: "8px 10px" }}>
                                <p style={{ color: "#EEEEEE", fontSize: "10px", fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={upFile.name}>{upFile.name}</p>
                                <p style={{ color: "#D84040", fontSize: "9px" }}>Đang tải lên...</p>
                            </div>
                        </div>
                    ))}

                    <div 
                        onClick={handleFileUpload}
                        style={{ borderRadius: "10px", border: "2px dashed #2A1F1F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "240px", cursor: "pointer", gap: "6px", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.background = "rgba(216,64,64,0.05)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A1F1F"; e.currentTarget.style.background = "transparent"; }}
                    >
                        <Upload size={18} color="#555" />
                        <span style={{ color: "#555", fontSize: "10px" }}>Upload file</span>
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {formattedFeedbacks.map(fb => (
                        <div key={fb.id} style={{ borderRadius: "10px", padding: "12px 14px", background: fb.resolved ? "rgba(29,22,22,0.3)" : "rgba(232,168,56,0.06)", border: `1px solid ${fb.resolved ? "rgba(46,32,32,0.4)" : "rgba(232,168,56,0.25)"}`, backdropFilter: "blur(8px)", opacity: fb.resolved ? 0.6 : 1, transition: "all 0.2s" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                <AvatarBubble initials={fb.user === "Admin" ? "AD" : "KH"} size={28} color={fb.user === "Admin" ? "#8E1616" : "#1E3A5F"} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                                        <span style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 600 }}>{fb.user}</span>
                                        <span style={{ padding: "2px 6px", borderRadius: "20px", background: "rgba(107,143,214,0.15)", color: "#6B8FD6", fontSize: "9px" }}>{fb.file}{fb.timestamp ? ` @ ${fb.timestamp}` : ""}</span>
                                        <span style={{ color: "#555", fontSize: "9px" }}>{fb.time}</span>
                                    </div>
                                    <p style={{ color: fb.resolved ? "#555" : "#EEEEEE", fontSize: "11px", lineHeight: 1.5 }}>{fb.text}</p>
                                    
                                    {/* Existing reply display */}
                                    {fb.reply_content && (
                                        <div style={{ marginTop: "10px", padding: "8px 10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", borderLeft: "2px solid #D84040" }}>
                                            <p style={{ fontSize: "9px", color: "#888", fontWeight: 600, marginBottom: "2px" }}>{fb.reply_author || "Admin"} phản hồi:</p>
                                            <p style={{ fontSize: "10.5px", color: "#ddd" }}>{fb.reply_content}</p>
                                        </div>
                                    )}
                                    
                                    {/* Inline reply form */}
                                    {!fb.reply_content && !fb.resolved && (
                                        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                                            <input 
                                                placeholder="Viết phản hồi..." 
                                                value={replyText[fb.id] || ""}
                                                onChange={e => setReplyText(p => ({ ...p, [fb.id]: e.target.value }))}
                                                className="px-2 py-1 rounded outline-none flex-1 text-xs"
                                                style={{ background: "#241C1C", border: "1px solid #3E2F2F", color: "#EEEEEE" }}
                                            />
                                            <button 
                                                onClick={() => handleSendReply(fb.id)}
                                                className="px-3 py-1 rounded text-[10px] font-bold text-white transition-opacity hover:opacity-85"
                                                style={{ background: "#D84040" }}
                                            >
                                                Gửi
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => resolveFeedback(fb.id, fb.resolved)} style={{ flexShrink: 0, padding: "4px 8px", borderRadius: "6px", border: "none", background: fb.resolved ? "rgba(76,175,80,0.15)" : "rgba(29,22,22,0.6)", color: fb.resolved ? "#4CAF50" : "#666", fontSize: "9px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                                    <CheckCheck size={9} /> {fb.resolved ? "Xong" : "Đánh dấu"}
                                </button>
                            </div>
                        </div>
                    ))}
                    {formattedFeedbacks.length === 0 && (
                        <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-8">Chưa có phản hồi nào từ khách hàng.</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Admin Tab: Vault ──────────────────────────────────────────────────────────

function VaultTab({ project }: { project: any }) {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingType, setUploadingType] = useState<string | null>(null);

    const docTypeConfig = {
        brief: { label: "Creative Brief", icon: FileCheck, color: "#6B8FD6" },
        contract: { label: "Hợp đồng", icon: Shield, color: "#4CAF50" },
        quotation: { label: "Báo giá", icon: Coins, color: "#E8A838" },
        invoice: { label: "Hóa đơn", icon: Receipt, color: "#D84040" },
    };

    const fetchDocs = () => {
        setLoading(true);
        fetchApi("/media")
            .then((data: any[]) => {
                const filtered = data.filter(d => d.project_slug === project?.slug && ["creative brief", "tài liệu hợp đồng", "báo giá", "hoá đơn"].includes(d.folder));
                setDocs(filtered);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch project docs:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (project?.slug) {
            fetchDocs();
        }
    }, [project?.slug]);

    const handleUploadClick = (type: string) => {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            setUploadingType(type);
            try {
                const clientSlug = project?.client_slug || project?.client;
                const folderMap: Record<string, string> = {
                    brief: "creative brief",
                    contract: "tài liệu hợp đồng",
                    quotation: "báo giá",
                    invoice: "hoá đơn"
                };
                const targetFolder = folderMap[type] || type;
                await uploadMediaPipeline(
                    file, 
                    "projects", 
                    fetchApi, 
                    undefined, 
                    clientSlug, 
                    project.slug, 
                    targetFolder
                );
                fetchDocs();
            } catch (err) {
                console.error("Failed to upload document:", err);
                alert("Upload thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"));
            } finally {
                setUploadingType(null);
            }
        };
        input.click();
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
        try {
            await fetchApi(`/media/${docId}`, { method: "DELETE" });
            fetchDocs();
        } catch (err) {
            console.error("Failed to delete document:", err);
            alert("Xóa thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"));
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "9px", background: "rgba(107,143,214,0.08)", border: "1px solid rgba(107,143,214,0.2)", display: "flex", alignItems: "center", gap: "7px" }}>
                <Lock size={12} color="#6B8FD6" />
                <span style={{ color: "#6B8FD6", fontSize: "11px" }}>Project Vault — Khu vực lưu trữ nội bộ. Chỉ Admin mới có quyền truy cập.</span>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                    <Loader2 className="animate-spin" size={24} color="#6B8FD6" />
                </div>
            ) : (
                (["brief", "contract", "quotation", "invoice"] as const).map(type => {
                    const cfg = docTypeConfig[type];
                    const folderMap: Record<string, string> = {
                        brief: "creative brief",
                        contract: "tài liệu hợp đồng",
                        quotation: "báo giá",
                        invoice: "hoá đơn"
                    };
                    const targetFolder = folderMap[type];
                    const typeDocs = docs.filter(d => d.folder === targetFolder);
                    const isUploading = uploadingType === type;

                    return (
                        <div key={type} style={{ borderRadius: "12px", overflow: "hidden", background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)" }}>
                            <div style={{ padding: "12px 16px", borderBottom: "1px solid #2A1F1F", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                    <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: cfg.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <cfg.icon size={12} color={cfg.color} />
                                    </div>
                                    <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>{cfg.label}</span>
                                </div>
                                <button 
                                    onClick={() => handleUploadClick(type)}
                                    disabled={isUploading}
                                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", border: "1px dashed #3A2A2A", background: "transparent", color: "#666", fontSize: "10px", cursor: isUploading ? "not-allowed" : "pointer" }}
                                    onMouseEnter={e => { if (!isUploading) { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color; } }}
                                    onMouseLeave={e => { if (!isUploading) { e.currentTarget.style.borderColor = "#3A2A2A"; e.currentTarget.style.color = "#666"; } }}
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={10} /> : <FilePlus size={10} />}
                                    {isUploading ? "Uploading..." : "Upload"}
                                </button>
                            </div>
                            {typeDocs.length === 0 ? (
                                <div style={{ padding: "16px", textAlign: "center", color: "#444", fontSize: "11px" }}>Chưa có tài liệu</div>
                            ) : (
                                typeDocs.map((doc, i) => (
                                    <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < typeDocs.length - 1 ? "1px solid #2A1F1F" : "none" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <FileText size={13} color="#555" />
                                            <div>
                                                <p style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 500 }}>{doc.caption?.replace("Uploaded: ", "") || doc.url.split("/").pop() || doc.id}</p>
                                                <p style={{ color: "#555", fontSize: "9px" }}>
                                                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Chưa rõ ngày"}
                                                    {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(1)} KB` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                            <a 
                                                href={doc.url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                style={{ textDecoration: "none", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(46,32,32,0.6)", background: "transparent", color: "#666", fontSize: "9px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                                                onMouseEnter={e => e.currentTarget.style.color = "#EEEEEE"}
                                                onMouseLeave={e => e.currentTarget.style.color = "#666"}
                                            >
                                                <Eye size={9} /> Xem / Tải
                                            </a>
                                            <button 
                                                onClick={() => handleDeleteDoc(doc.id)}
                                                style={{ padding: "4.5px", borderRadius: "6px", border: "1px solid rgba(216,64,64,0.2)", background: "rgba(216,64,64,0.05)", color: "#D84040", cursor: "pointer" }}
                                            >
                                                <Trash2 size={9} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

// ─── VideoViewMode (helper component) ─────────────────────────────────────────────

function VideoViewMode({ project, uploadedVideo }: { project: any; uploadedVideo: any }) {
    const url = project?.video_url || project?.videoUrl || "";
    const ytMatch = url ? url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/) : null;
    const vmMatch = url ? url.match(/vimeo\.com\/(\d+)/) : null;
    const embedUrl = ytMatch
        ? `https://www.youtube.com/embed/${ytMatch[1]}`
        : vmMatch ? `https://player.vimeo.com/video/${vmMatch[1]}` : null;

    const isDirectVideo = !!url && !embedUrl && (
        url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".webm") || 
        url.includes("play_1080p.mp4") || url.includes("mediadelivery.net") || url.includes("r2.dev")
    );

    if (embedUrl) {
        return (
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid #2E2020" }}>
                <iframe src={embedUrl} className="w-full" style={{ height: "220px", border: "none", display: "block" }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Project video" />
            </div>
        );
    }
    if (isDirectVideo) {
        return (
            <div className="mt-3 rounded-xl overflow-hidden bg-black" style={{ border: "1px solid #2E2020", height: "220px" }}>
                <video src={url} controls className="w-full h-full object-contain" />
            </div>
        );
    }
    if (url) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 mt-3 px-4 py-3 rounded-xl transition-all" style={{ background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; }}
            >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(216,64,64,0.12)" }}>
                    <Video size={14} color="#D84040" />
                </div>
                <div className="flex-1 min-w-0">
                    <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>Video Link</p>
                    <p style={{ color: "#D84040", fontSize: "11px" }} className="truncate">{url}</p>
                </div>
                <ExternalLink size={13} color="#555" />
            </a>
        );
    }
    if (uploadedVideo) {
        return (
            <div className="flex items-center gap-3 mt-3 px-4 py-3 rounded-xl" style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.25)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(76,175,80,0.15)" }}>
                    <Play size={14} color="#4CAF50" fill="#4CAF50" />
                </div>
                <div>
                    <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="truncate">{uploadedVideo.name}</p>
                    <p style={{ color: "#666", fontSize: "11px" }}>{(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB uploaded</p>
                </div>
            </div>
        );
    }
    return (
        <p style={{ color: "#444", fontSize: "13px", fontStyle: "italic" }} className="mt-2">
            No video attached — click <span style={{ color: "#D84040" }}>Edit Project</span> to add one.
        </p>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────────────

const mockActivity = [
    { id: 1, user: "Sarah Kim", action: "updated project status to In Progress", time: "2 hours ago", avatar: "SK" },
    { id: 2, user: "Jake Torres", action: "pushed a new build — v0.4.1", time: "5 hours ago", avatar: "JT" },
    { id: 3, user: "Maya Chen", action: "uploaded revised wireframes", time: "1 day ago", avatar: "MC" },
    { id: 4, user: "Alex (You)", action: "created this project", time: "3 days ago", avatar: "AY" },
];
const mockComments = [
    { id: 1, user: "Sarah Kim", text: "Client approved the direction — moving into production phase now.", time: "2 hours ago", avatar: "SK" },
    { id: 2, user: "Jake Torres", text: "Main components are all wired up. Need final copy from Emma before we can close the homepage.", time: "1 day ago", avatar: "JT" },
];

export function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dbClients, setDbClients] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState("activity");
    const [isFeatured, setIsFeatured] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeletingProject, setIsDeletingProject] = useState(false);
    const [activities, setActivities] = useState([]);
    const [comments, setComments] = useState([]);
    const [assignedCrew, setAssignedCrew] = useState([]);
    const [dbCrew, setDbCrew] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);

    // Admin command center tab
    const [adminTab, setAdminTab] = useState<"overview" | "kanban" | "financials" | "media" | "vault">("overview");
    const [feedbacks, setFeedbacks] = useState<any[]>([]);

    const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({});

    useEffect(() => {
        Promise.all([
            fetchApi(`/projects/${id}`),
            fetchApi('/projects/clients/all'),
            fetchApi('/categories'),
            fetchApi('/crew'),
            fetchApi('/finance/expenses').catch(() => []),
            fetchApi('/finance/invoices').catch(() => []),
            fetchApi(`/projects/${id}/feedback`).catch(() => [])
        ]).then(([projData, clientsData, categoriesData, crewData, expensesData, invoicesData, feedbackData]) => {
            setProject(projData);
            setIsFeatured(!!projData.featured);
            setIsPublished(!!projData.published);
            setIsLocked(!!projData.locked);
            setDbClients(clientsData);
            setDbCategories(categoriesData);
            setDbCrew(crewData);
            setExpenses(expensesData || []);
            setInvoices(invoicesData || []);
            setFeedbacks(feedbackData || []);
            setGalleryImages(projData.gallery || []);
            reset({
                title: projData.title,
                client: projData.client_slug || projData.client,
                category: projData.format_slug || projData.format,
                status: projData.status,
                dueDate: projData.dueDate || `${projData.year}-01-01`,
                budget: projData.budget,
                description: projData.summary || "",
                progress: projData.progress,
                videoUrl: projData.videoUrl || "",
            });

            const isMockProject = [
                "proj-aurora-rebrand", "proj-slate-site", "proj-pulse-campaign", "proj-nova-ecom", "proj-aurora-motion", "proj-slate-photo",
                "aurora-platform-rebrand", "slate-house-portfolio", "pulse-summer-campaign", "nova-goods-product-launch", "aurora-motion-toolkit", "slate-editorial-shoot"
            ].includes(id.toLowerCase());

            const loadedCredits = projData.credits || [];
            if (loadedCredits.length > 0) {
                const parsedCrew = loadedCredits.map((credStr, idx) => {
                    const parts = credStr.split(":");
                    const role = parts[0]?.trim() || "";
                    const name = parts[1]?.trim() || "";
                    return { id: `cred-${idx}-${Date.now()}`, name, role };
                });
                setAssignedCrew(parsedCrew);
            } else if (isMockProject) {
                setActivities([
                    { id: 1, user: "Sarah Kim", action: "updated project status to In Progress", time: "2 hours ago", avatar: "SK" },
                    { id: 2, user: "Jake Torres", action: "pushed a new build — v0.4.1", time: "5 hours ago", avatar: "JT" },
                    { id: 3, user: "Maya Chen", action: "uploaded revised wireframes", time: "1 day ago", avatar: "MC" },
                    { id: 4, user: "Alex (You)", action: "created this project", time: "3 days ago", avatar: "AY" },
                ]);
                setComments([
                    { id: 1, user: "Sarah Kim", text: "Client approved the direction — moving into production phase now.", time: "2 hours ago", avatar: "SK" },
                    { id: 2, user: "Jake Torres", text: "Main components are all wired up. Need final copy from Emma before we can close the homepage.", time: "1 day ago", avatar: "JT" },
                ]);
                setAssignedCrew(crewMembers.slice(0, 3));
            } else {
                setActivities([{ id: 1, user: "Alex (You)", action: "created this project", time: "Just now", avatar: "AY" }]);
                setComments([]);
                setAssignedCrew([]);
            }

            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [id, reset]);

    const handleDeleteProject = async () => {
        setIsDeletingProject(true);
        try {
            await fetchApi(`/projects/${id}`, { method: "DELETE" });
            navigate("/admin/projects");
        } catch (err) {
            console.error("Failed to delete project:", err);
            alert(err instanceof Error ? err.message : "Failed to delete project.");
        } finally {
            setIsDeletingProject(false);
            setShowDeleteModal(false);
        }
    };

    const [dragActive, setDragActive] = useState(false);
    const [uploadedVideo, setUploadedVideo] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("video/")) setUploadedVideo(file);
    };

    const watched = watch();
    const statusInfo = statusColors[watched.status] || statusColors["Planning"];

    const onSave = async (data) => {
        setSaving(true);
        try {
            let coverMediaId = undefined;
            if (thumbnailFile) {
                const mediaAsset = await uploadMediaPipeline(thumbnailFile, "projects", fetchApi, undefined, data.client, project.slug, "thumbnail");
                coverMediaId = mediaAsset.id;
            } else if (thumbnailPreview === null) {
                coverMediaId = null;
            }

            let finalVideoUrl = data.videoUrl;
            if (uploadedVideo) {
                const mediaAsset = await uploadMediaPipeline(uploadedVideo, "projects", fetchApi, undefined, data.client, project.slug, "final video");
                finalVideoUrl = mediaAsset.url;
            }

            const finalGalleryMediaIds = [];
            for (const img of galleryImages) {
                if (img.file) {
                    const mediaAsset = await uploadMediaPipeline(img.file, "projects", fetchApi, undefined, data.client, project.slug, "behind the scenes", true);
                    finalGalleryMediaIds.push(mediaAsset.id);
                } else {
                    finalGalleryMediaIds.push(img.id);
                }
            }

            const payload = {
                title: data.title,
                client_slug: data.client,
                year: parseInt(new Date(data.dueDate || Date.now()).getFullYear()),
                format_slug: data.category,
                featured: isFeatured,
                published: isPublished,
                locked: isLocked,
                status: data.status,
                cover_media_id: coverMediaId,
                summary: data.description || null,
                video_url: finalVideoUrl,
                dueDate: data.dueDate || null,
                budget: data.budget || "TBD",
                credits: assignedCrew.map(c => `${c.role}: ${c.name}`),
                gallery_media_ids: finalGalleryMediaIds,
            };
            const updated = await fetchApi(`/projects/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            setProject(updated);
            setSaved(true);
            setTimeout(() => {
                setSaved(false); setIsEditing(false);
                setThumbnailFile(null); setUploadedVideo(null);
                setThumbnailPreview(null);
            }, 1400);
        } catch (err) {
            console.error("Failed to update project:", err);
            alert(err instanceof Error ? err.message : "Failed to update project.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        reset(); setThumbnailPreview(null); setThumbnailFile(null);
        setUploadedVideo(null); setGalleryImages(project.gallery || []);
        setIsFeatured(!!project.featured);
        setIsPublished(!!project.published);
        setIsLocked(!!project.locked);
        setIsEditing(false);
    };

    const handleToggleFeatured = async () => {
        const nextVal = !isFeatured;
        setIsFeatured(nextVal);
        if (!isEditing && project) {
            try {
                await fetchApi(`/projects/${id}`, {
                    method: "PUT",
                    body: JSON.stringify({ featured: nextVal })
                });
                setProject(prev => prev ? { ...prev, featured: nextVal } : null);
            } catch (err) {
                console.error("Failed to update featured state:", err);
                setIsFeatured(!nextVal);
            }
        }
    };

    const handleTogglePublished = async () => {
        const nextVal = !isPublished;
        setIsPublished(nextVal);
        if (!isEditing && project) {
            try {
                await fetchApi(`/projects/${id}`, {
                    method: "PUT",
                    body: JSON.stringify({ published: nextVal })
                });
                setProject(prev => prev ? { ...prev, published: nextVal } : null);
            } catch (err) {
                console.error("Failed to update publish state:", err);
                setIsPublished(!nextVal);
            }
        }
    };

    const handleToggleLocked = async () => {
        const nextVal = !isLocked;
        setIsLocked(nextVal);
        if (!isEditing && project) {
            try {
                await fetchApi(`/projects/${id}`, {
                    method: "PUT",
                    body: JSON.stringify({ locked: nextVal })
                });
                setProject(prev => prev ? { ...prev, locked: nextVal } : null);
            } catch (err) {
                console.error("Failed to update lock state:", err);
                setIsLocked(!nextVal);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    if (!project) {
        return (<div className="px-8 py-7">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate("/admin/projects")} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888" }}>
                        <ArrowLeft size={16}/>
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertCircle size={48} color="#3A2A2A" className="mb-4"/>
                    <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }}>Project not found</p>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-1 mb-4">This project doesn't exist or may have been deleted.</p>
                    <button onClick={() => navigate("/admin/projects")} className="px-4 py-2 rounded-lg" style={{ background: "#D84040", color: "#fff", fontSize: "14px" }}>
                        Back to Projects
                    </button>
                </div>
            </div>);
    }

    // ── Admin Command Center Tabs definition ──
    const ADMIN_TABS = [
        { id: "overview", label: "Tổng quan", icon: Activity },
        { id: "kanban", label: "Kanban", icon: Kanban },
        { id: "financials", label: "Tài chính", icon: TrendingUp },
        { id: "media", label: "Media", icon: Image },
        { id: "vault", label: "Tài liệu", icon: FileText },
    ];

    return (<div className="px-8 py-7 w-full">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/admin/projects")} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                        <ArrowLeft size={16}/>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span style={{ color: "#666", fontSize: "13px" }}>Projects</span>
                            <span style={{ color: "#444" }}>/</span>
                            <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{project.title}</span>
                        </div>
                        <h1 style={{ color: "#EEEEEE", fontSize: "22px", fontWeight: 700 }} className="mt-0.5">
                            {watched.title || project.title}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Publish Toggle */}
                    <button
                        onClick={handleTogglePublished}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                        style={{
                            background: isPublished ? "rgba(76,175,80,0.12)" : "#241C1C",
                            color: isPublished ? "#4CAF50" : "#666",
                            border: `1px solid ${isPublished ? "rgba(76,175,80,0.4)" : "#2E2020"}`,
                            fontSize: "13px",
                            fontWeight: isPublished ? 600 : 400
                        }}
                    >
                        <Globe size={13} />
                        {isPublished ? "Published" : "Draft"}
                    </button>

                    {/* Lock Toggle */}
                    <button
                        onClick={handleToggleLocked}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                        style={{
                            background: isLocked ? "rgba(216,64,64,0.12)" : "#241C1C",
                            color: isLocked ? "#D84040" : "#666",
                            border: `1px solid ${isLocked ? "rgba(216,64,64,0.4)" : "#2E2020"}`,
                            fontSize: "13px",
                            fontWeight: isLocked ? 600 : 400
                        }}
                    >
                        {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                        {isLocked ? "Locked" : "Unlocked"}
                    </button>

                    {/* Highlight Toggle */}
                    <button
                        onClick={handleToggleFeatured}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                        style={{
                            background: isFeatured ? "rgba(255,193,7,0.12)" : "#241C1C",
                            color: isFeatured ? "#FFC107" : "#666",
                            border: `1px solid ${isFeatured ? "rgba(255,193,7,0.4)" : "#2E2020"}`,
                            fontSize: "13px",
                            fontWeight: isFeatured ? 600 : 400
                        }}
                    >
                        <Star size={13} fill={isFeatured ? "#FFC107" : "none"}/>
                        {isFeatured ? "Featured" : "Highlight"}
                    </button>

                    <div className="h-6 w-[1px] bg-[#2E2020] mx-1" />

                    {isEditing ? (<>
                            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888", border: "1px solid #2E2020", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}>
                                <X size={14}/> Discard
                            </button>
                            <button onClick={handleSubmit(onSave)} disabled={saving || saved} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: saved ? "#4CAF50" : "#D84040", color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                                {saving ? <><Loader2 size={13} className="animate-spin"/> Saving...</>
                                : saved ? <><CheckCircle2 size={13}/> Saved!</>
                                : <><Save size={13}/> Save Changes</>}
                            </button>
                        </>) : (<>
                            <button onClick={() => window.open(`/works/${project.slug}`, "_blank")} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#666", border: "1px solid #2E2020", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2E2020"; }}>
                                <ExternalLink size={13}/> Preview
                            </button>
                            {isLocked ? (
                                <button
                                    onClick={() => alert("Dự án này đang bị khóa. Vui lòng click vào nút 'Locked' ở trên để mở khóa trước khi chỉnh sửa.")}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all opacity-60 cursor-not-allowed"
                                    style={{ background: "#2A1F1F", color: "#666", border: "1px solid #3A2A2A", fontSize: "13px", fontWeight: 600 }}
                                >
                                    <Lock size={13}/> Locked
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "#D84040", color: "#fff", fontSize: "13px", fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.background = "#c03030"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#D84040"; }}>
                                    <Edit3 size={13}/> Edit Project
                                </button>
                            )}
                        </>)}
                </div>
            </div>

            {/* ══════════════ ADMIN COMMAND CENTER TABS ══════════════ */}
            <div style={{ marginBottom: "24px" }}>
                {/* Tab bar */}
                <div style={{
                    display: "flex", gap: "2px", marginBottom: "20px",
                    background: "rgba(29,22,22,0.5)", borderRadius: "14px", padding: "5px",
                    border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(12px)",
                }}>
                    {ADMIN_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setAdminTab(tab.id as any)}
                            style={{
                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                padding: "9px 10px", borderRadius: "10px", border: "none", cursor: "pointer",
                                background: adminTab === tab.id ? "#D84040" : "transparent",
                                color: adminTab === tab.id ? "#fff" : "#666",
                                fontSize: "12px", fontWeight: adminTab === tab.id ? 600 : 400,
                                transition: "all 0.18s",
                                boxShadow: adminTab === tab.id ? "0 4px 14px rgba(216,64,64,0.3)" : "none",
                            }}
                            onMouseEnter={e => { if (adminTab !== tab.id) e.currentTarget.style.color = "#EEEEEE"; }}
                            onMouseLeave={e => { if (adminTab !== tab.id) e.currentTarget.style.color = "#666"; }}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {adminTab === "overview" && <OverviewAdminTab project={project} navigate={navigate} />}
                {adminTab === "kanban" && <KanbanTab />}
                {adminTab === "financials" && <FinancialsTab project={project} expenses={expenses} invoices={invoices} dbClients={dbClients} setInvoices={setInvoices} />}
                {adminTab === "media" && <MediaAdminTab project={project} feedbacks={feedbacks} setFeedbacks={setFeedbacks} setProject={setProject} />}
                {adminTab === "vault" && <VaultTab project={project} />}
            </div>

            {/* ══════════════ ORIGINAL PROJECT DETAIL CONTENT ══════════════ */}
            {/* Divider */}
            <div style={{ borderTop: "1px solid #2A1F1F", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "#444", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em", background: "#1A1010", padding: "4px 10px", borderRadius: "20px", border: "1px solid #2A1F1F", marginTop: "-13px" }}>
                    Chi tiết dự án
                </span>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-3 gap-6">

                {/* ── Left: Hero + Details (2 cols) ── */}
                <div className="col-span-2 space-y-5">

                    {/* Hero Image */}
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #2E2020" }}>
                        <div className="relative h-56">
                            <img src={thumbnailPreview || project.cover_image || project.image} alt={project.title} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #1D1616 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" }}/>
                            {isEditing && (<>
                                    <input id="thumb-upload-detail" type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setThumbnailPreview(URL.createObjectURL(file)); setThumbnailFile(file); }
            }}/>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: "rgba(0,0,0,0.5)", zIndex: 4 }}>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => document.getElementById("thumb-upload-detail")?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "rgba(255,255,255,0.14)", color: "#EEEEEE", fontSize: "13px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}>
                                                <Camera size={14}/> Change Thumbnail
                                            </button>
                                            {thumbnailPreview && (<button type="button" onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); }} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "rgba(216,64,64,0.3)", color: "#EEEEEE", fontSize: "13px", backdropFilter: "blur(8px)", border: "1px solid rgba(216,64,64,0.5)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.45)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.3)"; }}>
                                                    <X size={13}/> Reset
                                                </button>)}
                                        </div>
                                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>PNG, JPG or WebP recommended</p>
                                    </div>
                                </>)}
                            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between" style={{ zIndex: 5 }}>
                                <div>
                                    <span className="px-3 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text, border: `1px solid ${statusInfo.border}`, fontSize: "12px", fontWeight: 600, backdropFilter: "blur(8px)" }}>
                                        {watched.status}
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    {(project.tags || []).map((tag) => (<span key={tag} className="px-2 py-0.5 rounded" style={{ background: "rgba(29,22,22,0.8)", color: "#aaa", fontSize: "11px", backdropFilter: "blur(6px)" }}>{tag}</span>))}
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                                <span style={{ color: "#888", fontSize: "12px" }}>Overall Progress</span>
                                {isEditing ? (<div className="flex items-center gap-2">
                                        <input type="range" min={0} max={100} {...register("progress", { valueAsNumber: true })} className="w-28 accent-red-500"/>
                                        <span style={{ color: "#D84040", fontSize: "13px", fontWeight: 700, minWidth: "36px" }}>{watched.progress}%</span>
                                    </div>) : (<span style={{ color: "#D84040", fontSize: "14px", fontWeight: 700 }}>{project.progress}%</span>)}
                            </div>
                            <div className="rounded-full" style={{ height: "6px", background: "#2A1F1F" }}>
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${isEditing ? watched.progress : project.progress}%`, background: project.progress === 100 ? "#6B8FD6" : "linear-gradient(to right, #8E1616, #D84040)" }}/>
                            </div>
                        </div>
                    </div>

                    {/* Core Details Form/View */}
                    <div className="rounded-xl" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Project Information</p>
                            {isEditing && (<span className="px-2 py-0.5 rounded" style={{ background: "rgba(216,64,64,0.12)", color: "#D84040", fontSize: "11px" }}>Editing</span>)}
                        </div>

                        <div className="px-5 py-5 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                    <Briefcase size={11} color="#D84040"/> Project Title
                                </label>
                                {isEditing ? (<input {...register("title", { required: true })} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>{project.title}</p>)}
                            </div>

                            {/* Client + Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <User size={11} color="#D84040"/> Client
                                    </label>
                                    {isEditing ? (<select {...register("client")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                            {dbClients.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                        </select>) : (<p style={{ color: "#EEEEEE", fontSize: "14px" }}>{project.client}</p>)}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Tag size={11} color="#D84040"/> Category
                                    </label>
                                    {isEditing ? (<select {...register("category")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                            {dbCategories.filter((c: any) => c.type === 'project_type').map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                        </select>) : (<button onClick={() => {
                const catId = project.format_slug || project.category;
                if (catId) navigate(`/admin/categories/${catId}`);
            }} className="flex items-center gap-1.5 group/cat" style={{ color: "#EEEEEE", fontSize: "14px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                                            {project.format || project.category}
                                            <ExternalLink size={11} color="#555" className="opacity-0 group-hover/cat:opacity-100 transition-opacity"/>
                                        </button>)}
                                </div>
                            </div>

                            {/* Status + Due Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Activity size={11} color="#D84040"/> Status
                                    </label>
                                    {isEditing ? (<select {...register("status")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                            <option value="Planning">Planning</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Review">Review</option>
                                            <option value="Completed">Completed</option>
                                        </select>) : (<span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text, fontSize: "12px", fontWeight: 600 }}>{project.status}</span>)}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Calendar size={11} color="#D84040"/> Due Date
                                    </label>
                                    {isEditing ? (<input type="date" {...register("dueDate")} className="px-3 py-2 rounded-lg outline-none" style={{ ...inputStyle, colorScheme: "dark" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "14px" }}>{project.dueDate}</p>)}
                                </div>
                            </div>

                            {/* Budget + Tags */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Coins size={11} color="#D84040"/> Budget
                                    </label>
                                    {isEditing ? (
                                        <input {...register("budget")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p style={{ color: "#D84040", fontSize: "15px", fontWeight: 700 }}>{project.budget}</p>
                                            {project.budget !== "TBD" && (
                                                <button
                                                    onClick={() => navigate(`/admin/finance/revenue`)}
                                                    style={{ background: "transparent", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", opacity: 0.6, padding: 0 }}
                                                    title="Xem doanh thu ở trang Tài chính"
                                                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                                                >
                                                    <ExternalLink size={13} color="#D84040" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Tag size={11} color="#D84040"/> Tags
                                    </label>
                                    {isEditing ? (<input {...register("tags")} placeholder="Comma-separated tags" className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<div className="flex flex-wrap gap-1.5">
                                            {(project.tags || []).map((tag) => (<span key={tag} className="px-2 py-0.5 rounded" style={{ background: "#2A1F1F", color: "#888", fontSize: "12px", border: "1px solid #3A2A2A" }}>{tag}</span>))}
                                        </div>)}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Description</label>
                                {isEditing ? (<textarea {...register("description")} rows={4} className="px-3 py-2 rounded-lg outline-none resize-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.7" }}>
                                        A comprehensive creative engagement focused on delivering exceptional brand experiences and driving measurable outcomes for the client. The project spans multiple phases including discovery, design, development, and delivery.
                                    </p>)}
                            </div>

                            {/* ── Video Media ── */}
                            <div className="pt-4" style={{ borderTop: "1px solid #2A1F1F" }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Video size={12} color="#D84040"/>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Video Media</label>
                                    {!isEditing && <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(216,64,64,0.1)", color: "#666", fontSize: "10px", border: "1px solid rgba(216,64,64,0.18)" }}>Optional</span>}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4 mt-3">
                                        <div>
                                            <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="flex items-center gap-1.5 mb-2">
                                                <Link2 size={10} color="#D84040"/> Video URL
                                            </label>
                                            <div className="relative">
                                                <Link2 size={13} color="#555" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
                                                <input {...register("videoUrl")} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." className="px-3 py-2 rounded-lg outline-none transition-all" style={{ ...inputStyle, paddingLeft: "36px", paddingRight: "36px" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                                {watch("videoUrl") && (
                                                    <button type="button" onClick={() => setValue("videoUrl", "")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-[#2A1F1F] hover:bg-[#3A2A2A] text-white/50 hover:text-white transition-all" title="Clear Video URL">
                                                        <X size={10}/>
                                                    </button>
                                                )}
                                            </div>
                                            {watch("videoUrl") && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4CAF50" }}/>
                                                    <span style={{ color: "#4CAF50", fontSize: "11px" }}>URL detected — will be embedded on the project page</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="flex items-center gap-1.5 mb-2">
                                                <UploadCloud size={10} color="#D84040"/> Upload Video File
                                            </label>
                                            {!uploadedVideo ? (
                                                <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => document.getElementById("video-upload-edit")?.click()} className="rounded-xl flex flex-col items-center justify-center py-8 cursor-pointer transition-all select-none" style={{ border: `2px dashed ${dragActive ? "#D84040" : "#3A2A2A"}`, background: dragActive ? "rgba(216,64,64,0.05)" : "rgba(29,22,22,0.4)" }}>
                                                    <input id="video-upload-edit" type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setUploadedVideo(file); }}/>
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: dragActive ? "rgba(216,64,64,0.15)" : "#1D1616", border: `1px solid ${dragActive ? "rgba(216,64,64,0.4)" : "#2E2020"}` }}>
                                                        <UploadCloud size={18} color={dragActive ? "#D84040" : "#555"}/>
                                                    </div>
                                                    <p style={{ color: dragActive ? "#D84040" : "#888", fontSize: "12px", fontWeight: 500 }}>{dragActive ? "Drop video here" : "Drag & drop a video file"}</p>
                                                    <p style={{ color: "#555", fontSize: "11px" }} className="mt-1">or <span style={{ color: "#D84040" }}>browse files</span> · MP4, MOV, WebM — up to 500 MB</p>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.25)" }}>
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(76,175,80,0.15)" }}>
                                                        <Play size={14} color="#4CAF50" fill="#4CAF50"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="truncate">{uploadedVideo.name}</p>
                                                        <p style={{ color: "#666", fontSize: "11px" }}>{(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB · {uploadedVideo.type || "video"}</p>
                                                    </div>
                                                    <button type="button" onClick={() => setUploadedVideo(null)} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{ background: "#2A1F1F", color: "#666", border: "1px solid #3A2A2A" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                                        <X size={12}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <VideoViewMode project={project} uploadedVideo={uploadedVideo} />
                                )}


                                    </div>
                                </div>
                            </div>

                    {/* Behind the Scenes Images */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <div className="flex items-center gap-2">
                                <Camera size={14} color="#D84040"/>
                                <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Behind the Scenes Images</p>
                            </div>
                            <span style={{ color: "#888", fontSize: "12px" }}>{galleryImages.length} images</span>
                        </div>
                        <div className="p-5">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div onClick={() => document.getElementById("gallery-upload-input")?.click()} className="rounded-xl flex flex-col items-center justify-center py-6 cursor-pointer transition-all select-none" style={{ border: "2px dashed #3A2A2A", background: "rgba(29,22,22,0.4)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                        <input id="gallery-upload-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                                                const files = e.target.files;
                                                if (files) {
                                                    Array.from(files).forEach(file => {
                                                        const previewUrl = URL.createObjectURL(file);
                                                        setGalleryImages(prev => [...prev, { id: `new-${Date.now()}-${Math.random()}`, url: previewUrl, file }]);
                                                    });
                                                }
                                            }}/>
                                        <UploadCloud size={20} color="#555" className="mb-2"/>
                                        <p style={{ color: "#888", fontSize: "12px", fontWeight: 500 }}>Click to upload multiple images</p>
                                        <p style={{ color: "#555", fontSize: "10px" }} className="mt-0.5">PNG, JPG or WebP</p>
                                    </div>
                                    {galleryImages.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-3 mt-4">
                                            {galleryImages.map((img) => (
                                                <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden group" style={{ border: "1px solid #3A2A2A" }}>
                                                    <img src={img.url} alt="BTS" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={() => setGalleryImages(prev => prev.filter(item => item.id !== img.id))} className="p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-700 transition-colors" title="Delete image">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }} className="text-center py-2">No images uploaded yet.</p>
                                    )}
                                </div>
                            ) : (
                                galleryImages.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {galleryImages.map((img) => (
                                            <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden" style={{ border: "1px solid #2E2020" }}>
                                                <img src={img.url} alt="Behind the Scenes" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all duration-300" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: "#444", fontSize: "13px", fontStyle: "italic" }}>No behind the scenes images uploaded for this project.</p>
                                )
                            )}
                        </div>
                    </div>

                    {/* Activity / Comments Tabs */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <div className="flex" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            {["activity", "comments"].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className="flex items-center gap-2 px-5 py-3.5 transition-all capitalize" style={{ color: activeTab === tab ? "#EEEEEE" : "#666", borderBottom: `2px solid ${activeTab === tab ? "#D84040" : "transparent"}`, fontSize: "13px", fontWeight: activeTab === tab ? 600 : 400, background: "transparent" }}>
                                    {tab === "activity" ? <Activity size={13}/> : <MessageSquare size={13}/>}
                                    {tab === "activity" ? "Activity" : "Comments"}{" "}
                                    <span className="px-1.5 py-0.5 rounded" style={{ background: activeTab === tab ? "rgba(216,64,64,0.15)" : "#2A1F1F", color: activeTab === tab ? "#D84040" : "#555", fontSize: "10px" }}>
                                        {tab === "activity" ? activities.length : comments.length}
                                    </span>
                                </button>))}
                        </div>

                        <div className="px-5 py-4 space-y-4">
                            {activeTab === "activity" &&
            activities.map((item) => (<div key={item.id} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "11px", fontWeight: 700 }}>{item.avatar}</div>
                                        <div>
                                            <p style={{ color: "#EEEEEE", fontSize: "13px" }}>
                                                <span style={{ fontWeight: 600 }}>{item.user}</span>{" "}
                                                <span style={{ color: "#888" }}>{item.action}</span>
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock size={10} color="#555"/>
                                                <span style={{ color: "#555", fontSize: "11px" }}>{item.time}</span>
                                            </div>
                                        </div>
                                    </div>))}

                            {activeTab === "comments" && (<>
                                    {comments.map((c) => (<div key={c.id} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "11px", fontWeight: 700 }}>{c.avatar}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{c.user}</span>
                                                    <span style={{ color: "#555", fontSize: "11px" }}>{c.time}</span>
                                                </div>
                                                <p className="px-3 py-2 rounded-lg" style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#aaa", fontSize: "13px", lineHeight: "1.6", border: "1px solid #2A1F1F" }}>{c.text}</p>
                                            </div>
                                        </div>))}
                                    <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid #2A1F1F" }}>
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#D84040", color: "#fff", fontSize: "10px", fontWeight: 700 }}>AY</div>
                                        <input onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                const newComment = { id: Date.now(), user: "Alex (You)", text: e.currentTarget.value.trim(), time: "Just now", avatar: "AY" };
                                setComments((prev) => [...prev, newComment]);
                                e.currentTarget.value = "";
                            }
                        }} placeholder="Add a comment..." className="flex-1 px-3 py-2 rounded-lg outline-none" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", fontSize: "13px" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#2A1F1F")}/>
                                    </div>
                                </>)}
                        </div>
                    </div>
                </div>

                {/* ── Right: Sidebar (1 col) ── */}
                <div className="col-span-1 space-y-5">

                    {/* Quick Stats */}
                    <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick Stats</p>
                        {[
            { icon: Coins, label: "Budget", value: project.budget, color: "#D84040" },
            { icon: Calendar, label: "Due Date", value: project.dueDate, color: "#EEEEEE" },
            { icon: Activity, label: "Progress", value: `${project.progress}%`, color: project.progress === 100 ? "#4CAF50" : "#D84040" },
        ].map(({ icon: Icon, label, value, color }) => (<div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #2A1F1F" }}>
                                <div className="flex items-center gap-2">
                                    <Icon size={13} color="#8E1616"/>
                                    <span style={{ color: "#888", fontSize: "12px" }}>{label}</span>
                                </div>
                                <span style={{ color, fontSize: "13px", fontWeight: 600 }}>{value}</span>
                            </div>))}
                        <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <div className="flex items-center gap-2">
                                <Clock size={13} color="#8E1616"/>
                                <span style={{ color: "#888", fontSize: "12px" }}>Last Updated</span>
                            </div>
                            <span style={{ color: "#666", fontSize: "12px" }}>2 hours ago</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                                <Star size={13} color="#8E1616"/>
                                <span style={{ color: "#888", fontSize: "12px" }}>Highlighted</span>
                            </div>
                            <button onClick={() => setIsFeatured((v) => !v)} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all" style={{ background: isFeatured ? "rgba(255,193,7,0.12)" : "#2A1F1F", color: isFeatured ? "#FFC107" : "#555", border: `1px solid ${isFeatured ? "rgba(255,193,7,0.4)" : "#3A2A2A"}`, fontSize: "11px", fontWeight: 600 }}>
                                <Star size={10} fill={isFeatured ? "#FFC107" : "none"}/>
                                {isFeatured ? "Yes" : "No"}
                            </button>
                        </div>
                    </div>

                    {/* Assigned Crew */}
                    <div className="rounded-xl p-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <div className="flex items-center justify-between mb-3">
                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Assigned Crew</p>
                            <span style={{ color: "#D84040", fontSize: "12px" }}>{assignedCrew.length} members</span>
                        </div>

                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {assignedCrew.map((c) => {
                                        const initials = c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                                        const realMember = dbCrew.find(m => m.name.toLowerCase() === c.name.toLowerCase());
                                        const avatarUrl = realMember?.avatar || null;
                                        return (
                                            <div key={c.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt={c.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: "#8E1616", color: "#EEEEEE" }}>{initials}</div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 500 }} className="truncate">{realMember ? realMember.name : c.name}</p>
                                                        <p style={{ color: "#D84040", fontSize: "10px" }} className="truncate">{c.role}</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setAssignedCrew(prev => prev.filter(item => item.id !== c.id))} className="text-gray-500 hover:text-red-500 transition-colors p-1">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {assignedCrew.length === 0 && (<p style={{ color: "#666", fontSize: "11px", fontStyle: "italic" }} className="py-2">No crew assigned yet.</p>)}
                                </div>

                                <div className="mt-3 pt-3 border-t border-[#2A1F1F] space-y-2">
                                    <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Assign Crew Member</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <select id="assign-crew-select" className="px-2 py-1.5 rounded-lg outline-none flex-1 text-xs" style={inputStyle}>
                                            <option value="">Select registered crew...</option>
                                            {dbCrew.filter(m => !assignedCrew.some(ac => ac.name.toLowerCase() === m.name.toLowerCase())).map((m) => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2 flex-1">
                                            <input id="assign-crew-role" placeholder="Role (e.g. Director)" list="common-roles" className="px-2 py-1.5 rounded-lg outline-none flex-1 text-xs w-full" style={inputStyle} />
                                            <datalist id="common-roles">
                                                {dbCategories.filter((c: any) => c.type === 'hr_role').map((c: any) => (
                                                    <option key={c.slug} value={c.name} />
                                                ))}
                                            </datalist>
                                            <button type="button" onClick={() => {
                                                const selectEl = document.getElementById("assign-crew-select") as HTMLSelectElement;
                                                const roleEl = document.getElementById("assign-crew-role") as HTMLInputElement;
                                                const selectedId = selectEl?.value;
                                                const roleVal = roleEl?.value.trim();
                                                if (selectedId && roleVal) {
                                                    const selectedMember = dbCrew.find(m => m.id.toString() === selectedId);
                                                    if (selectedMember) {
                                                        setAssignedCrew(prev => [...prev, { id: `crew-${selectedMember.id}-${Date.now()}`, name: selectedMember.name, role: roleVal }]);
                                                        selectEl.value = "";
                                                        roleEl.value = "";
                                                    }
                                                } else {
                                                    alert("Vui lòng chọn nhân sự và nhập/chọn chức vụ (Role).");
                                                }
                                            }} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-[#EEEEEE]" style={{ background: "#D84040" }}>
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-[#2A1F1F] space-y-2">
                                    <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Add Custom Credit</label>
                                    <div className="flex gap-2">
                                        <input id="custom-credit-role" placeholder="Role: e.g. Sound Designer" className="px-2 py-1.5 rounded-lg outline-none flex-1 text-xs" style={inputStyle}/>
                                        <input id="custom-credit-name" placeholder="Name: e.g. John Doe" className="px-2 py-1.5 rounded-lg outline-none flex-1 text-xs" style={inputStyle}/>
                                        <button type="button" onClick={() => {
                                                const roleEl = document.getElementById("custom-credit-role");
                                                const nameEl = document.getElementById("custom-credit-name");
                                                const roleVal = roleEl?.value.trim();
                                                const nameVal = nameEl?.value.trim();
                                                if (roleVal && nameVal) {
                                                    setAssignedCrew(prev => [...prev, { id: `custom-${Date.now()}`, name: nameVal, role: roleVal }]);
                                                    if (roleEl) roleEl.value = "";
                                                    if (nameEl) nameEl.value = "";
                                                } else {
                                                    alert("Please enter both a role and a name.");
                                                }
                                            }} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#D84040", color: "#fff" }}>
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assignedCrew.map((c) => {
                                    const realMember = dbCrew.find(m => m.name.toLowerCase() === c.name.toLowerCase());
                                    const avatarUrl = realMember?.avatar || null;
                                    const status = realMember?.status || "Active";
                                    const initials = c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                                    return (
                                        <div key={c.id} className="flex items-center gap-3">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={realMember?.name || c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: "2px solid #2A1F1F" }}/>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "#8E1616", border: "2px solid #2A1F1F", color: "#EEEEEE" }}>{initials}</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                {realMember ? (
                                                    <button type="button" onClick={() => navigate(`/admin/crew/${realMember.id}`)} className="text-left hover:text-[#D84040] transition-colors" style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>{realMember.name}</button>
                                                ) : (
                                                    <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>{c.name}</p>
                                                )}
                                                <p style={{ color: "#D84040", fontSize: "11px" }}>{c.role}</p>
                                            </div>
                                            {realMember && (<span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status === "Active" ? "#4CAF50" : "#E8A838" }}/>)}
                                        </div>
                                    );
                                })}
                                {assignedCrew.length === 0 && (<p style={{ color: "#666", fontSize: "12px", fontStyle: "italic" }}>No crew assigned to this project yet.</p>)}
                            </div>
                        )}
                    </div>

                    {/* Client Info */}
                    <div className="rounded-xl p-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }} className="mb-3">Client</p>
                        {(() => {
            const clientData = dbClients.find((c) => c.name === project.client || c.slug === project.client_slug);
            return clientData ? (<div>
                                    <div className="flex items-center gap-3 mb-3">
                                        {(clientData.avatar || clientData.logo_media_url) ? (
                                            <img src={clientData.avatar || clientData.logo_media_url} alt={clientData.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: "2px solid #2A1F1F", background: "#241C1C" }} />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>
                                                {(clientData.name || "Client").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{clientData.name}</p>
                                            <p style={{ color: "#888", fontSize: "11px" }}>{clientData.contact || "Primary Contact"}</p>
                                        </div>
                                    </div>
                                    <a href={`mailto:${clientData.email || 'contact@example.com'}`} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888", border: "1px solid #2A1F1F", fontSize: "12px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#2A1F1F"; }}>
                                        <User size={12}/>
                                        {clientData.email || "No Email Registered"}
                                    </a>
                                </div>) : null;
        })()}
                    </div>

                    {/* Danger Zone */}
                    {isEditing && (<div className="rounded-xl p-4" style={{ background: "rgba(142,22,22,0.08)", border: "1px solid rgba(142,22,22,0.3)" }}>
                            <p style={{ color: "#D84040", fontSize: "13px", fontWeight: 600 }} className="mb-2">Danger Zone</p>
                            <p style={{ color: "#888", fontSize: "12px", lineHeight: "1.5" }} className="mb-3">
                                Permanently delete this project and all associated data. This action cannot be undone.
                            </p>
                            <button onClick={() => setShowDeleteModal(true)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.3)", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.1)"; }}>
                                <Trash2 size={13}/> Delete Project
                            </button>
                        </div>)}
                </div>
            </div>

            {/* Delete confirmation modal */}
            <DeleteConfirmModal isOpen={showDeleteModal} itemType="project" itemName={project?.title ?? ""} onConfirm={handleDeleteProject} onCancel={() => setShowDeleteModal(false)} isDeleting={isDeletingProject}/>
        </div>);
}
