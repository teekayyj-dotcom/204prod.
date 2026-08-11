// @ts-nocheck
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { MediaLibraryPage } from "./MediaLibraryPage";
import { useForm } from "react-hook-form";
import {
    ArrowLeft, Edit3, Save, X, Calendar, DollarSign, Tag, User, Briefcase,
    Clock, CheckCircle2, Loader2, Trash2, MessageSquare, Activity, ExternalLink,
    AlertCircle, Star, Video, Link2, UploadCloud, Play, Camera, MonitorPlay,
    Kanban, TrendingUp, Image, FileText, Plus, AlertTriangle, CheckCheck,
    FileCheck, Receipt, FilePlus, Banknote, TrendingDown, Target, Shield,
    Lock, Unlock, PlayCircle, ImageIcon, Upload, Eye, ArrowRight, Zap, Globe, Film, Coins, MoreVertical, ChevronDown, List
} from "lucide-react";
import { crewMembers } from "../data/mockData";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { AddClientModal } from "../components/AddClientModal";
import { fetchApi } from "../utils/apiClient";
import { uploadMediaPipeline } from "../../../utils/imagePipeline";
import { polyfill } from "mobile-drag-drop";
import "mobile-drag-drop/default.css";

polyfill({
    holdToDrag: 500
});

window.addEventListener('touchmove', function() {}, {passive: false});

// ─── Constants ────────────────────────────────────────────────────────────────

const statusColors = {
    Other: { bg: "rgba(136,136,136,0.15)", text: "#888888" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838", border: "rgba(232,168,56,0.3)" },
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040", border: "rgba(216,64,64,0.3)" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50", border: "rgba(76,175,80,0.3)" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6", border: "rgba(107,143,214,0.3)" },
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

function formatDueDate(dateStr?: string | null): string {
    if (!dateStr) return "";
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

function formatTaskDeadline(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (dateStr.includes('T')) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${hours}:${mins} ${day}/${month}`;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
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

    useEffect(() => {
        const handleKanbanUpdate = (e: any) => {
            if (e.detail?.project_slug === id) {
                fetchTasks();
            }
        };
        window.addEventListener('kanban_update', handleKanbanUpdate);
        return () => window.removeEventListener('kanban_update', handleKanbanUpdate);
    }, [id]);

    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [showAddTask, setShowAddTask] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskAssignees, setNewTaskAssignees] = useState<{id: string, name: string, initials: string}[]>([]);
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
    const [editTaskAssignees, setEditTaskAssignees] = useState<{id: string, name: string, initials: string}[]>([]);
    const [editTaskTag, setEditTaskTag] = useState("");
    const [editTaskCreator, setEditTaskCreator] = useState("");
    const [editTaskDeadline, setEditTaskDeadline] = useState("");
    const [showEditAssigneeDropdown, setShowEditAssigneeDropdown] = useState(false);
    const [searchEditAssigneeQuery, setSearchEditAssigneeQuery] = useState("");

    const handleEditTaskClick = (colId: string, task: any) => {
        setEditingTask({ colId, task });
        setEditTaskTitle(task.title);
        const names = task.assigneeName ? task.assigneeName.split(", ") : [];
        const initials = task.assignee ? task.assignee.split(", ") : [];
        const assignees = names.map((n: string, i: number) => {
            const crewMatch = crewList.find(c => c.name === n);
            return { id: crewMatch ? crewMatch.id : n + i, name: n, initials: initials[i] || "" };
        });
        setEditTaskAssignees(assignees);
        setEditTaskTag(task.tag || "");
        setEditTaskCreator(task.createdBy || "");
        setEditTaskDeadline(task.deadline || "");
    };

    const saveEditedTask = () => {
        if (!editingTask || !editTaskTitle.trim()) return;
        const taskUpdate = {
            title: editTaskTitle.trim(),
            assignee_name: editTaskAssignees.length > 0 ? editTaskAssignees.map(a => a.name).join(", ") : null,
            assignee_initials: editTaskAssignees.length > 0 ? editTaskAssignees.map(a => a.initials).join(", ") : null,
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
        const taskData = {
            id: newTaskId,
            title: newTaskTitle.trim(),
            assignee_name: newTaskAssignees.length > 0 ? newTaskAssignees.map(a => a.name).join(", ") : "",
            assignee_initials: newTaskAssignees.length > 0 ? newTaskAssignees.map(a => a.initials).join(", ") : "",
            tag: newTaskTag.trim() || "Work",
            created_by: newTaskCreator.trim() || currentUserName,
            deadline: newTaskDeadline || "",
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
        setNewTaskAssignees([]);
        setSearchAssigneeQuery("");
        setNewTaskTag("");
        setNewTaskCreator(currentUserName);
        setNewTaskDeadline("");
        setShowAddTask(null);
    };

    return (
        <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
            <style>{`
                input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    transform: scale(1.2);
                    cursor: pointer;
                }
            `}</style>
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
            <div style={{ display: "flex", gap: "12px", minWidth: "100%" }}>
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
                                    const isDone = col.id === "done" || task.status === "done";
                                    const overdue = !isDone && isOverdue(task.deadline);
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
                                                    {task.assigneeName && (
                                                        <span style={{ color: "#888", fontSize: "11px", fontWeight: 500 }}>
                                                            {task.assigneeName}
                                                        </span>
                                                    )}
                                                </div>
                                                {task.deadline && (
                                                    <span style={{ fontSize: "9px", color: isDone ? "#4CAF50" : overdue ? "#f87171" : daysLeft !== null && daysLeft <= 2 ? "#E8A838" : "#555", fontWeight: overdue || isDone ? 700 : 400 }}>
                                                        {isDone ? "Hoàn thành" : overdue ? `Trễ (${formatTaskDeadline(task.deadline)})` : formatTaskDeadline(task.deadline)}
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
                                            {newTaskAssignees.length > 0 && (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                                                    {newTaskAssignees.map(a => (
                                                        <span key={a.id} style={{ background: "#2A1F1F", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "10px", padding: "3px 6px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                            {a.name} <X size={10} style={{ cursor: "pointer", color: "#888" }} onClick={() => setNewTaskAssignees(prev => prev.filter(x => x.id !== a.id))} />
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <input
                                                value={searchAssigneeQuery}
                                                onChange={e => {
                                                    setSearchAssigneeQuery(e.target.value);
                                                    setShowAssigneeDropdown(true);
                                                }}
                                                onFocus={() => {
                                                    setShowAssigneeDropdown(true);
                                                }}
                                                placeholder={newTaskAssignees.length ? "Thêm người..." : "Chọn người thực hiện..."}
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
                                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid #2A1F1F", marginBottom: "4px" }}>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (newTaskAssignees.length === crewList.length) {
                                                                        setNewTaskAssignees([]);
                                                                    } else {
                                                                        setNewTaskAssignees(crewList.map(c => ({
                                                                            id: c.id,
                                                                            name: c.name,
                                                                            initials: c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                                                                        })));
                                                                    }
                                                                }}
                                                                style={{ background: "transparent", border: "none", color: "#D84040", fontSize: "10px", cursor: "pointer", padding: "2px 0", fontWeight: "bold" }}
                                                            >
                                                                {newTaskAssignees.length === crewList.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                                            </button>
                                                        </div>
                                                        {crewList
                                                            .filter(c => c.name.toLowerCase().includes(searchAssigneeQuery.toLowerCase()))
                                                            .map(c => {
                                                                const initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                                                                return (
                                                                    <button
                                                                        key={c.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (newTaskAssignees.some(x => x.id === c.id)) {
                                                                                setNewTaskAssignees(prev => prev.filter(x => x.id !== c.id));
                                                                            } else {
                                                                                setNewTaskAssignees(prev => [...prev, { id: c.id, name: c.name, initials }]);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            width: "100%", textAlign: "left", padding: "6px 10px",
                                                                            borderRadius: "4px", fontSize: "11px", display: "flex",
                                                                            alignItems: "center", justifyContent: "space-between", background: "transparent",
                                                                            border: "none", color: "#EEEEEE", cursor: "pointer"
                                                                        }}
                                                                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(216, 64, 64, 0.1)"; e.currentTarget.style.color = "#D84040"; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#EEEEEE"; }}
                                                                    >
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                            {c.avatar ? (
                                                                                <img src={c.avatar} alt={c.name} style={{ width: "14px", height: "14px", borderRadius: "50%", objectFit: "cover" }} />
                                                                            ) : (
                                                                                <div style={{ width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "bold", color: "white", background: "#2A1F1F" }}>
                                                                                    {c.name.substring(0, 1).toUpperCase()}
                                                                                </div>
                                                                            )}
                                                                            <span>{c.name}</span>
                                                                        </div>
                                                                        {newTaskAssignees.some(x => x.id === c.id) && <CheckCircle2 size={12} color="#4CAF50" />}
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
                                            type="datetime-local"
                                            value={newTaskDeadline}
                                            onChange={e => setNewTaskDeadline(e.target.value)}
                                            style={{ background: "transparent", border: "none", borderBottom: "1px solid #2A1F1F", outline: "none", color: newTaskDeadline ? "#EEEEEE" : "#666", fontSize: "11px", width: "100%", paddingBottom: "3px" }}
                                        />
                                        <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
                                            <button onClick={() => addTask(col.id)} style={{ flex: 1, background: "#D84040", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 0", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>Thêm</button>
                                            <button onClick={() => { setShowAddTask(null); setNewTaskTitle(""); setNewTaskAssignees([]); setNewTaskTag(""); setNewTaskCreator(currentUserName); setNewTaskDeadline(""); }} style={{ background: "#2A1F1F", color: "#888", border: "none", borderRadius: "6px", padding: "5px 8px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowAddTask(col.id);
                                            setNewTaskTitle("");
                                            setNewTaskAssignees([]);
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
                                {editTaskAssignees.length > 0 && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                                            {editTaskAssignees.map(a => (
                                                <span key={a.id} style={{ background: "#2A1F1F", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "10px", padding: "3px 6px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    {a.name} <X size={10} style={{ cursor: "pointer", color: "#888" }} onClick={() => setEditTaskAssignees(prev => prev.filter(x => x.id !== a.id))} />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={searchEditAssigneeQuery}
                                        onChange={e => {
                                            setSearchEditAssigneeQuery(e.target.value);
                                            setShowEditAssigneeDropdown(true);
                                        }}
                                        onFocus={() => {
                                            setShowEditAssigneeDropdown(true);
                                        }}
                                        placeholder={editTaskAssignees.length ? "Thêm người..." : "Chọn người thực hiện..."}
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
                                                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid #2A1F1F", marginBottom: "4px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (editTaskAssignees.length === crewList.length) {
                                                                setEditTaskAssignees([]);
                                                            } else {
                                                                setEditTaskAssignees(crewList.map(c => ({
                                                                    id: c.id,
                                                                    name: c.name,
                                                                    initials: c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                                                                })));
                                                            }
                                                        }}
                                                        style={{ background: "transparent", border: "none", color: "#D84040", fontSize: "10px", cursor: "pointer", padding: "2px 0", fontWeight: "bold" }}
                                                    >
                                                        {editTaskAssignees.length === crewList.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                                    </button>
                                                </div>
                                                {crewList
                                                    .filter(c => c.name.toLowerCase().includes(searchEditAssigneeQuery.toLowerCase()))
                                                    .map(c => {
                                                        const initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                                                        return (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (editTaskAssignees.some(x => x.id === c.id)) {
                                                                        setEditTaskAssignees(prev => prev.filter(x => x.id !== c.id));
                                                                    } else {
                                                                        setEditTaskAssignees(prev => [...prev, { id: c.id, name: c.name, initials }]);
                                                                    }
                                                                }}
                                                                style={{
                                                                    width: "100%", textAlign: "left", padding: "6px 10px",
                                                                    borderRadius: "4px", fontSize: "11px", display: "flex",
                                                                    alignItems: "center", justifyContent: "space-between", background: "transparent",
                                                                    border: "none", color: "#EEEEEE", cursor: "pointer"
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(216, 64, 64, 0.1)"; e.currentTarget.style.color = "#D84040"; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#EEEEEE"; }}
                                                            >
                                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                    {c.avatar ? (
                                                                        <img src={c.avatar} alt={c.name} style={{ width: "14px", height: "14px", borderRadius: "50%", objectFit: "cover" }} />
                                                                    ) : (
                                                                        <div style={{ width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "bold", color: "white", background: "#2A1F1F" }}>
                                                                            {c.name.substring(0, 1).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <span>{c.name}</span>
                                                                </div>
                                                                {editTaskAssignees.some(x => x.id === c.id) && <CheckCircle2 size={12} color="#4CAF50" />}
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

                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#888", marginBottom: "4px" }}>Thời hạn (Deadline)</label>
                                <input
                                    type="datetime-local"
                                    value={editTaskDeadline}
                                    onChange={e => setEditTaskDeadline(e.target.value)}
                                    style={{ width: "100%", boxSizing: "border-box", background: "#1D1616", border: "1px solid #2A1F1F", borderRadius: "4px", padding: "6px 10px", fontSize: "12px", color: editTaskDeadline ? "#fff" : "#666", outline: "none" }}
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

    const statusMap: Record<string, number> = {
        "lead": 0,
        "pitching": 0,
        "planning": 0,
        "Planning": 0,
        "production": 1,
        "In Progress": 1,
        "in progress": 1,
        "post-production": 2,
        "Review": 2,
        "review": 2,
        "completed": 3,
        "Completed": 3,
        "canceled": -1,
        "Other": -1,
        "other": -1
    };
    const currentStatusIdx = statusMap[project?.status] ?? -1;
    const displayProgress = currentStatusIdx === 3 ? 100 : currentStatusIdx === 2 ? 75 : currentStatusIdx === 1 ? 50 : currentStatusIdx === 0 ? 25 : 0;

    const milestones = [
        { label: "Kịch bản", desc: "Duyệt kịch bản phân cảnh", isDone: currentStatusIdx > 0, isActive: currentStatusIdx === 0 },
        { label: "Tiền kỳ / Đi quay", desc: "Setup bối cảnh & ghi hình", isDone: currentStatusIdx > 1, isActive: currentStatusIdx === 1 },
        { label: "Hậu kỳ", desc: "Dựng hình, Kỹ xảo, Âm thanh", isDone: currentStatusIdx > 2, isActive: currentStatusIdx === 2 },
        { label: "Bàn giao", desc: "Xuất file thành phẩm & chốt nghiệm thu", isDone: currentStatusIdx === 3, isActive: false }
    ];

    const completedTasks = tasks.filter(t => t.status === "done").length;
    const totalTasks = tasks.length;
    const crewCount = new Set((project.credits || []).map((cred: string) => cred.split(":")[1]?.trim().toLowerCase())).size;
    const fileCount = (project.gallery?.filter((g: any) => g.type === "video")?.length || 0) + docs.length;
    const commentCount = feedbacks.length;

    const stats = [
        { label: "Tasks hoàn thành", value: `${completedTasks} / ${totalTasks}`, icon: CheckCheck, color: "#4CAF50" },
        { label: "Thành viên", value: `${crewCount} người`, icon: User, color: "#6B8FD6" },
        { label: "Files đã upload", value: `${fileCount} files`, icon: ImageIcon, color: "#C084FC" },
        { label: "Phản hồi KH", value: `${commentCount} comments`, icon: MessageSquare, color: "#E8A838" },
    ];

    const activeStage = milestones.filter(s => s.isDone || s.isActive).pop()?.label;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Hero status strip */}
            <div style={{
                borderRadius: "14px", padding: "18px 22px",
                background: project.status === "Completed" ? "linear-gradient(135deg, rgba(76,175,80,0.18) 0%, rgba(29,22,22,0.5) 100%)" : "linear-gradient(135deg, rgba(142,22,22,0.18) 0%, rgba(29,22,22,0.5) 100%)",
                border: project.status === "Completed" ? "1px solid rgba(76,175,80,0.2)" : "1px solid rgba(216,64,64,0.2)", backdropFilter: "blur(16px)",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "14px",
            }}>
                <div>
                    <span style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>Trạng thái hiện tại</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{
                            padding: "4px 12px", borderRadius: "20px",
                            background: statusColors[project.status]?.bg || "#333",
                            color: statusColors[project.status]?.text || "#fff",
                            fontSize: "12px", fontWeight: 700,
                            border: `1px solid ${statusColors[project.status]?.text || "#555"}33`,
                        }}>{project.status}</span>
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
                <div style={{ textAlign: "left", width: "100%", maxWidth: "300px", marginTop: "4px" }}>
                    <p style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>Deadline</p>
                    <p style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: project.status === "Completed" ? "#4CAF50" : isWaiting ? "#888" : isLate ? "#f87171" : "#E8A838", fontVariantNumeric: "tabular-nums" }}>
                        {project.status === "Completed" ? "Đã hoàn thành" : isWaiting ? "Chờ" : daysLeft === null ? "—" : isLate ? `${Math.abs(daysLeft)} ngày trễ` : daysLeft === 0 ? "Hôm nay!" : `${daysLeft} ngày`}
                    </p>
                    {!isWaiting && project.dueDate && <p style={{ color: "#555", fontSize: "10px", marginTop: "2px" }}>{new Date(project.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>}
                </div>
            </div>

            {/* Milestones / Timeline Road-map */}
            <div className="rounded-xl p-5 space-y-4 border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(29,22,22,0.4)" }}>
                <div className="flex justify-between items-center">
                    <span style={{ color: "#888", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>Tiến độ tổng thể</span>
                    <span style={{ color: "#D84040", fontSize: "15px", fontWeight: 800 }}>{displayProgress}%</span>
                </div>
                
                <div className="relative pt-4 pb-2">
                    {/* Horizontal Line background */}
                    <div className="absolute top-8 left-[12.5%] right-[12.5%] h-[4px] bg-[#2A1F1F] rounded-full" />
                    {/* Horizontal Line active progress */}
                    <div 
                        className="absolute top-8 left-[12.5%] h-[4px] bg-[#D84040] transition-all duration-500 rounded-full"
                        style={{ 
                            width: currentStatusIdx === 3 ? "75%" 
                                : currentStatusIdx === 2 ? "50%" 
                                : currentStatusIdx === 1 ? "25%" 
                                : "0%" 
                        }}
                    />

                    <div className="grid grid-cols-4 relative text-center">
                        {milestones.map((m, idx) => {
                            const dotColor = m.isDone ? "#D84040" : m.isActive ? "#FFC107" : "#2A1F1F";
                            const labelColor = m.isDone ? "#EEEEEE" : m.isActive ? "#FFC107" : "#555";
                            return (
                                <div key={m.label} className="flex flex-col items-center gap-2">
                                    {/* Dot indicator */}
                                    <div 
                                        className="w-5 h-5 rounded-full z-10 flex items-center justify-center border-2"
                                        style={{ 
                                            background: m.isDone ? "#D84040" : "#1D1616", 
                                            borderColor: dotColor,
                                            boxShadow: m.isActive ? "0 0 8px #FFC10755" : "none"
                                        }}
                                    >
                                        {m.isDone && <CheckCircle2 size={10} color="#fff" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold transition-all" style={{ color: labelColor }}>{m.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
            <div style={{ borderRadius: "12px", padding: "14px 18px", background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
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
                amount: parseFloat(String(newInvoice.amount).replace(/,/g, "")) || 0,
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
                                type="text"
                                placeholder="Số tiền (₫)" 
                                value={newInvoice.amount}
                                onChange={e => {
                                    const val = e.target.value.replace(/,/g, "");
                                    if (!isNaN(Number(val)) && val !== "") {
                                        setNewInvoice(p => ({ ...p, amount: Number(val).toLocaleString("en-US") }));
                                    } else if (val === "") {
                                        setNewInvoice(p => ({ ...p, amount: "" }));
                                    }
                                }}
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
                            <span style={{ color: inv.status === "paid" ? "#4CAF50" : "#E8A838", fontSize: "13px", fontWeight: 700 }}>{Number(String(inv.amount).replace(/,/g, "")).toLocaleString("en-US")} ₫</span>
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
    const [editingDemoId, setEditingDemoId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const [albums, setAlbums] = useState<any[]>([]);
    const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState("");
    const [newAlbumLink, setNewAlbumLink] = useState("");
    const [newAlbumBg, setNewAlbumBg] = useState("");
    
    // Edit/Delete Album states
    const [activeAlbumMenu, setActiveAlbumMenu] = useState<string | null>(null);
    const [editingAlbum, setEditingAlbum] = useState<any>(null);
    const [deletingAlbum, setDeletingAlbum] = useState<any>(null);
    const [editAlbumTitle, setEditAlbumTitle] = useState("");
    const [editAlbumLink, setEditAlbumLink] = useState("");
    const [editAlbumBg, setEditAlbumBg] = useState("");
    const [isEditingAlbum, setIsEditingAlbum] = useState(false);

    useEffect(() => {
        if (project?.slug) {
            fetchApi(`/projects/${project.slug}/albums`).then(res => setAlbums(res)).catch(console.error);
        }
    }, [project?.slug]);

    const handleCreateAlbum = async () => {
        if (!newAlbumTitle || !newAlbumLink) {
            alert("Vui lòng nhập Tên Album và Link Google Drive");
            return;
        }
        setIsCreatingAlbum(true);
        try {
            const res = await fetchApi(`/projects/${project.slug}/albums`, {
                method: "POST",
                body: JSON.stringify({
                    title: newAlbumTitle,
                    gdrive_folder_id: newAlbumLink,
                    background_url: newAlbumBg || null
                })
            });
            setAlbums(prev => [...prev, res]);
            setNewAlbumTitle("");
            setNewAlbumLink("");
            setNewAlbumBg("");
            alert("Tạo Album thành công!");
        } catch (err: any) {
            alert("Lỗi tạo album: " + (err.message || ""));
        } finally {
            setIsCreatingAlbum(false);
        }
    };

    const handleUpdateAlbum = async () => {
        if (!editingAlbum || !editAlbumTitle || !editAlbumLink) {
            alert("Vui lòng nhập Tên Album và Link Google Drive");
            return;
        }
        setIsEditingAlbum(true);
        try {
            const res = await fetchApi(`/projects/albums/${editingAlbum.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    title: editAlbumTitle,
                    gdrive_folder_id: editAlbumLink,
                    background_url: editAlbumBg || null
                })
            });
            setAlbums(prev => prev.map(a => a.id === editingAlbum.id ? res : a));
            setEditingAlbum(null);
            alert("Cập nhật Album thành công!");
        } catch (err: any) {
            alert("Lỗi cập nhật album: " + (err.message || ""));
        } finally {
            setIsEditingAlbum(false);
        }
    };

    const handleDeleteAlbum = async () => {
        if (!deletingAlbum) return;
        try {
            await fetchApi(`/projects/albums/${deletingAlbum.id}`, {
                method: "DELETE"
            });
            setAlbums(prev => prev.filter(a => a.id !== deletingAlbum.id));
            setDeletingAlbum(null);
            alert("Xoá Album thành công!");
        } catch (err: any) {
            alert("Lỗi xoá album: " + (err.message || ""));
        }
    };


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

    const handleRenameSubmit = async (demoId: string) => {
        if (!editTitle.trim()) {
            setEditingDemoId(null);
            return;
        }
        try {
            await fetchApi(`/media/${demoId}/rename`, {
                method: "PUT",
                body: JSON.stringify({ title: editTitle.trim() })
            });
            setProject((prev: any) => {
                if (!prev) return null;
                return {
                    ...prev,
                    gallery: (prev.gallery || []).map((g: any) => 
                        g.id === demoId ? { ...g, name: editTitle.trim() } : g
                    )
                };
            });
            setEditingDemoId(null);
        } catch (err) {
            console.error("Failed to rename demo", err);
            alert("Đổi tên thất bại!");
        }
    };

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
                    project.client_slug || project.client,
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
            {/* Media Drive UI */}
            {mediaView === "grid" && (
                <div style={{ marginTop: "-15px" }}>
                    <MediaLibraryPage isComponent={true} projectSlug={project.slug} clientSlug={project.client_slug || project.client} />
                </div>
            )}

            {/* Old Media Grid UI Removed - Using Drive Mode Component Instead */}
            {mediaView === "feedback" && (
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

            <DeleteConfirmModal 
                isOpen={!!deletingAlbum} 
                itemType="album" 
                itemName={deletingAlbum?.title ?? ""} 
                onConfirm={handleDeleteAlbum} 
                onCancel={() => setDeletingAlbum(null)} 
            />

            {editingAlbum && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                    <div style={{ background: "#1D1616", borderRadius: "12px", border: "1px solid #2A1F1F", width: "100%", maxWidth: "450px", overflow: "hidden" }}>
                        <div style={{ padding: "20px", borderBottom: "1px solid #2A1F1F", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 700, margin: 0 }}>Sửa thông tin Album</h3>
                            <button onClick={() => setEditingAlbum(null)} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", display: "flex" }}><X size={18}/></button>
                        </div>
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div>
                                <label style={{ display: "block", color: "#888", fontSize: "12px", marginBottom: "6px" }}>Tên Album *</label>
                                <input type="text" value={editAlbumTitle} onChange={e => setEditAlbumTitle(e.target.value)} style={{ width: "100%", background: "#151010", border: "1px solid #2A1F1F", borderRadius: "6px", padding: "10px 12px", color: "#EEEEEE", fontSize: "13px" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", color: "#888", fontSize: "12px", marginBottom: "6px" }}>Link Google Drive *</label>
                                <input type="text" value={editAlbumLink} onChange={e => setEditAlbumLink(e.target.value)} style={{ width: "100%", background: "#151010", border: "1px solid #2A1F1F", borderRadius: "6px", padding: "10px 12px", color: "#EEEEEE", fontSize: "13px" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", color: "#888", fontSize: "12px", marginBottom: "6px" }}>Link Ảnh Background (Tùy chọn)</label>
                                <input type="text" value={editAlbumBg} onChange={e => setEditAlbumBg(e.target.value)} style={{ width: "100%", background: "#151010", border: "1px solid #2A1F1F", borderRadius: "6px", padding: "10px 12px", color: "#EEEEEE", fontSize: "13px" }} />
                            </div>
                        </div>
                        <div style={{ padding: "15px 20px", borderTop: "1px solid #2A1F1F", display: "flex", justifyContent: "flex-end", gap: "10px", background: "rgba(0,0,0,0.2)" }}>
                            <button onClick={() => setEditingAlbum(null)} style={{ padding: "8px 16px", borderRadius: "6px", background: "transparent", color: "#888", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Huỷ</button>
                            <button 
                                onClick={handleUpdateAlbum} 
                                disabled={isEditingAlbum}
                                style={{ padding: "8px 16px", borderRadius: "6px", background: "#D84040", color: "#fff", border: "none", cursor: isEditingAlbum ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", opacity: isEditingAlbum ? 0.7 : 1 }}
                            >
                                {isEditingAlbum ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
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
    const [uploadMenuOpen, setUploadMenuOpen] = useState<string | null>(null);
    const [linkUploadModal, setLinkUploadModal] = useState<{isOpen: boolean, type: string}>({isOpen: false, type: ""});
    const [linkUrl, setLinkUrl] = useState("");
    const [linkName, setLinkName] = useState("");
    const [isUploadingLink, setIsUploadingLink] = useState(false);

    const docTypeConfig = {
        brief: { label: "Creative Brief", icon: FileCheck, color: "#6B8FD6" },
        script: { label: "Kịch bản", icon: FileText, color: "#9C27B0" },
        shotlist: { label: "Shot List", icon: List, color: "#00BCD4" },
        contract: { label: "Hợp đồng", icon: Shield, color: "#4CAF50" },
        quotation: { label: "Báo giá", icon: Coins, color: "#E8A838" },
        invoice: { label: "Hóa đơn", icon: Receipt, color: "#D84040" },
    };

    const fetchDocs = () => {
        setLoading(true);
        fetchApi(`/media?t=${Date.now()}`)
            .then((data: any[]) => {
                const filtered = data.filter(d => d.project_slug === project?.slug && ["creative brief", "kịch bản", "shot list", "tài liệu hợp đồng", "báo giá", "hoá đơn"].includes(d.folder));
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
                    script: "kịch bản",
                    shotlist: "shot list",
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

    const handleUploadLinkSubmit = async () => {
        if (!linkUrl) return;
        setIsUploadingLink(true);
        try {
            const clientSlug = project?.client_slug || project?.client;
            const folderMap: Record<string, string> = {
                brief: "creative brief",
                script: "kịch bản",
                shotlist: "shot list",
                contract: "tài liệu hợp đồng",
                quotation: "báo giá",
                invoice: "hoá đơn"
            };
            const targetFolder = folderMap[linkUploadModal.type] || linkUploadModal.type;
            const captionName = linkName.trim() ? linkName.trim() : linkUrl.substring(0, 50);
            
            let formattedUrl = linkUrl.trim();
            if (!/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = 'https://' + formattedUrl;
            }

            await fetchApi("/media/finalize", {
                method: "POST",
                body: JSON.stringify({
                    asset_id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
                    url: formattedUrl,
                    thumbnail_url: null,
                    alt: captionName,
                    caption: captionName,
                    mime_type: "text/uri-list",
                    file_size: 0,
                    client_slug: clientSlug || null,
                    project_slug: project?.slug || null,
                    folder: targetFolder
                })
            });
            fetchDocs();
            setLinkUploadModal({isOpen: false, type: ""});
            setLinkUrl("");
            setLinkName("");
        } catch (err) {
            console.error("Failed to upload link:", err);
            alert("Lưu link thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"));
        } finally {
            setIsUploadingLink(false);
        }
    };

    const handleDeleteDoc = async (docId: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
        try {
            await fetchApi(`/media/${docId}`, { method: "DELETE" });
            setDocs(prev => prev.filter(d => d.id !== docId));
            // Force refresh to ensure sync
            fetchDocs();
        } catch (err) {
            console.error("Failed to delete document:", err);
            alert("Xóa thất bại: " + (err instanceof Error ? err.message : "Lỗi không xác định"));
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>


            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                    <Loader2 className="animate-spin" size={24} color="#6B8FD6" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
                    {(["brief", "script", "shotlist", "contract", "quotation", "invoice"] as const).map(type => {
                    const cfg = docTypeConfig[type];
                    const folderMap: Record<string, string> = {
                        brief: "creative brief",
                        script: "kịch bản",
                        shotlist: "shot list",
                        contract: "tài liệu hợp đồng",
                        quotation: "báo giá",
                        invoice: "hoá đơn"
                    };
                    const targetFolder = folderMap[type];
                    const typeDocs = docs.filter(d => d.folder === targetFolder);
                    const isUploading = uploadingType === type;

                    return (
                        <div key={type} style={{ borderRadius: "12px", overflow: "hidden", background: "rgba(29,22,22,0.4)", border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", height: "100%" }}>
                            <div style={{ padding: "12px 16px", borderBottom: "1px solid #2A1F1F", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                    <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>{cfg.label}</span>
                                </div>
                                <div style={{ position: "relative" }}>
                                    <button 
                                        onClick={() => setUploadMenuOpen(uploadMenuOpen === type ? null : type)}
                                        disabled={isUploading}
                                        className="flex items-center justify-center w-10 h-10 md:w-6 md:h-6 rounded-md border border-dashed border-[#3A2A2A] bg-transparent text-[#666] cursor-pointer disabled:cursor-not-allowed hover:text-white transition-colors"
                                    >
                                        {isUploading ? <Loader2 className="animate-spin w-5 h-5 md:w-3 md:h-3" /> : <Plus className="w-5 h-5 md:w-3 md:h-3" />}
                                    </button>
                                    
                                    {uploadMenuOpen === type && !isUploading && (
                                        <div style={{ position: "absolute", top: "50%", right: "100%", transform: "translateY(-50%)", marginRight: "8px", background: "#1D1616", border: "1px solid #3A2A2A", borderRadius: "8px", padding: "4px", zIndex: 10, display: "flex", flexDirection: "row", gap: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
                                            <button 
                                                onClick={() => { setUploadMenuOpen(null); handleUploadClick(type); }}
                                                className="flex items-center py-2.5 px-4 md:py-1.5 md:px-3 rounded-md border-none bg-[rgba(107,143,214,0.1)] text-[#6B8FD6] text-[13px] md:text-[11px] cursor-pointer whitespace-nowrap hover:bg-[rgba(107,143,214,0.2)] transition-colors"
                                            >
                                                Upload File
                                            </button>
                                            <button 
                                                onClick={() => { setUploadMenuOpen(null); setLinkUploadModal({isOpen: true, type}); }}
                                                className="flex items-center py-2.5 px-4 md:py-1.5 md:px-3 rounded-md border-none bg-[rgba(76,175,80,0.1)] text-[#4CAF50] text-[13px] md:text-[11px] cursor-pointer whitespace-nowrap hover:bg-[rgba(76,175,80,0.2)] transition-colors"
                                            >
                                                Upload Link
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {typeDocs.length === 0 ? (
                                <div style={{ flex: 1, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#444", fontSize: "11px" }}>Chưa có tài liệu</div>
                            ) : (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                {typeDocs.map((doc, i) => (
                                    <a 
                                        key={doc.id} 
                                        href={doc.url.match(/^https?:\/\//i) ? doc.url : `https://${doc.url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < typeDocs.length - 1 ? "1px solid #2A1F1F" : "none", textDecoration: "none", cursor: "pointer", transition: "background 0.2s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
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
                                            <button 
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDoc(doc.id, e); }}
                                                className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:p-[4.5px] rounded-md border border-[rgba(216,64,64,0.2)] bg-[rgba(216,64,64,0.05)] text-[#D84040] cursor-pointer hover:bg-[rgba(216,64,64,0.1)] transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 md:w-[9px] md:h-[9px]" />
                                            </button>
                                        </div>
                                    </a>
                                ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                </div>
            )}

            {/* Link Upload Modal */}
            {linkUploadModal.isOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#1D1616", border: "1px solid #3A2A2A", borderRadius: "12px", width: "100%", maxWidth: "400px", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, fontSize: "16px", color: "#EEEEEE" }}>Upload Link</h3>
                            <button onClick={() => setLinkUploadModal({isOpen: false, type: ""})} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", color: "#999", fontSize: "12px", marginBottom: "6px" }}>Tên tài liệu (tuỳ chọn)</label>
                                <input 
                                    type="text" 
                                    value={linkName}
                                    onChange={e => setLinkName(e.target.value)}
                                    placeholder="Ví dụ: Tài liệu hướng dẫn"
                                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #3A2A2A", borderRadius: "8px", color: "#EEE", fontSize: "13px" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", color: "#999", fontSize: "12px", marginBottom: "6px" }}>Đường dẫn (Link)</label>
                                <input 
                                    type="url" 
                                    value={linkUrl}
                                    onChange={e => setLinkUrl(e.target.value)}
                                    placeholder="https://..."
                                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #3A2A2A", borderRadius: "8px", color: "#EEE", fontSize: "13px" }}
                                />
                            </div>
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                            <button 
                                onClick={() => setLinkUploadModal({isOpen: false, type: ""})}
                                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #3A2A2A", background: "transparent", color: "#CCC", cursor: "pointer", fontSize: "13px" }}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleUploadLinkSubmit}
                                disabled={isUploadingLink || !linkUrl}
                                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#6B8FD6", color: "#FFF", cursor: isUploadingLink || !linkUrl ? "not-allowed" : "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", opacity: (!linkUrl || isUploadingLink) ? 0.6 : 1 }}
                            >
                                {isUploadingLink && <Loader2 className="animate-spin" size={14} />}
                                Lưu Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── VideoViewMode (helper component) ─────────────────────────────────────────────

function VideoItem({ url, project, setProject }: { url: string; project: any; setProject: any }) {
    const [showMenu, setShowMenu] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMediaSelector, setShowMediaSelector] = useState(false);

    let displayUrl = url;
    const bunnyDirectMatch = url.match(/https:\/\/[^\/]+\/([a-zA-Z0-9-]+)\/play_1080p\.mp4/);
    if (bunnyDirectMatch) {
        displayUrl = `https://iframe.mediadelivery.net/embed/694348/${bunnyDirectMatch[1]}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;
    }
    const ytMatch = url ? url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/) : null;
    const vmMatch = url ? url.match(/vimeo\.com\/(\d+)/) : null;
    const embedUrl = ytMatch
        ? `https://www.youtube.com/embed/${ytMatch[1]}`
        : vmMatch ? `https://player.vimeo.com/video/${vmMatch[1]}` 
        : displayUrl.includes("iframe.mediadelivery.net") ? displayUrl : null;
    const isDirectVideo = !!url && !embedUrl && (
        url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".webm") || url.includes("r2.dev")
    );

    const handleDelete = async () => {
        setIsProcessing(true);
        try {
            const allMedia = await fetchApi('/media');
            const targetMedia = allMedia.find((m: any) => m.url === url);
            if (targetMedia) {
                await fetchApi(`/media/${targetMedia.id}`, { method: 'DELETE' }).catch(console.error);
            }
            let currentUrls = (project?.video_url || project?.videoUrl || "").split(",").filter(Boolean);
            const newUrls = currentUrls.filter((u: string) => u !== url).join(",");
            const updatedProject = await fetchApi(`/projects/${project.slug}`, {
                method: "PUT",
                body: JSON.stringify({ ...project, video_url: newUrls })
            });
            if (setProject) setProject(updatedProject);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
            setShowDeleteModal(false);
        }
    };

    const handleChangeVideo = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsProcessing(true);
        setShowMenu(false);
        try {
            const mediaAsset = await uploadMediaPipeline(file, "projects", fetchApi, undefined, project.client_slug || project.client, project.slug, "final video");
            const newUrl = mediaAsset.url;
            let currentUrls = (project?.video_url || project?.videoUrl || "").split(",").filter(Boolean);
            const idx = currentUrls.indexOf(url);
            if (idx !== -1) {
                currentUrls[idx] = newUrl;
            } else {
                currentUrls.push(newUrl);
            }
            const newUrlsStr = currentUrls.join(",");
            const updatedProject = await fetchApi(`/projects/${project.slug}`, {
                method: "PUT",
                body: JSON.stringify({ ...project, video_url: newUrlsStr })
            });
            if (setProject) setProject(updatedProject);
            const allMedia = await fetchApi('/media');
            const targetMedia = allMedia.find((m: any) => m.url === url);
            if (targetMedia) {
                await fetchApi(`/media/${targetMedia.id}`, { method: 'DELETE' }).catch(console.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectMediaVideo = async (selectedUrl: string) => {
        setIsProcessing(true);
        setShowMediaSelector(false);
        try {
            let currentUrls = (project?.video_url || project?.videoUrl || "").split(",").filter(Boolean);
            const idx = currentUrls.indexOf(url);
            if (idx !== -1) {
                currentUrls[idx] = selectedUrl;
            } else {
                currentUrls.push(selectedUrl);
            }
            const newUrlsStr = currentUrls.join(",");
            const updatedProject = await fetchApi(`/projects/${project.slug}`, {
                method: "PUT",
                body: JSON.stringify({ ...project, video_url: newUrlsStr })
            });
            if (setProject) setProject(updatedProject);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="relative rounded-xl overflow-hidden group bg-black flex-1" style={{ border: "1px solid #2E2020", aspectRatio: "3/2", minHeight: "200px" }}>
            {embedUrl ? (
                <iframe src={embedUrl} className="w-full h-full" style={{ border: "none", display: "block" }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Project video" />
            ) : isDirectVideo ? (
                <video src={url} controls className="w-full h-full object-contain" />
            ) : (
                <a href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center w-full h-full text-[#EEEEEE] hover:text-[#D84040] transition-colors p-4">
                    <Video size={32} className="mb-2 opacity-50" />
                    <span className="flex items-center gap-2">View Video Link <ExternalLink size={14} /></span>
                    <span className="text-[10px] text-[#888] mt-2 truncate w-full text-center">{url}</span>
                </a>
            )}

            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-[#D84040]"
            >
                <MoreVertical size={16} />
            </button>

            {showMenu && (
                <div className="absolute top-11 right-2 w-40 bg-[#1D1616] border border-[#3A2A2A] rounded-xl shadow-xl overflow-hidden z-20">
                    <label className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#EEEEEE] hover:bg-[#2A1F1F] cursor-pointer">
                        <Edit3 size={14} /> Change Video
                        <input type="file" accept="video/*" hidden onChange={handleChangeVideo} />
                    </label>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); setShowMediaSelector(true); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#EEEEEE] hover:bg-[#2A1F1F] cursor-pointer text-left"
                    >
                        <MonitorPlay size={14} /> Chọn từ Media
                    </button>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); setShowDeleteModal(true); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#D84040] hover:bg-[#2A1F1F] cursor-pointer text-left"
                    >
                        <Trash2 size={14} /> Delete Video
                    </button>
                </div>
            )}

            {isProcessing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-30">
                    <Loader2 size={24} className="animate-spin mb-2 text-[#D84040]" />
                    <span className="text-sm font-medium">Processing...</span>
                </div>
            )}

            {showDeleteModal && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 z-40 text-center">
                    <AlertTriangle size={32} className="text-[#D84040] mb-3" />
                    <p className="text-white text-sm font-medium mb-4">Are you sure you want to delete this video?</p>
                    <div className="flex gap-3">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteModal(false); }} className="px-4 py-1.5 rounded-lg bg-[#2A1F1F] hover:bg-[#3A2A2A] text-white text-sm transition-colors">Cancel</button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }} className="px-4 py-1.5 rounded-lg bg-[#D84040] hover:bg-red-600 text-white text-sm font-medium transition-colors">Delete</button>
                    </div>
                </div>
            )}
            
            {showMediaSelector && (
                <MediaSelectorModal 
                    projectSlug={project?.slug} 
                    onClose={() => setShowMediaSelector(false)} 
                    onSelect={handleSelectMediaVideo} 
                />
            )}
        </div>
    );
}

function VideoViewMode({ project, uploadedVideo, setProject }: { project: any; uploadedVideo: any; setProject?: any }) {
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
    
    let rawUrl = project?.video_url || project?.videoUrl || "";
    if (!rawUrl) {
        return (
            <p style={{ color: "#444", fontSize: "13px", fontStyle: "italic" }} className="mt-2">
                No video attached — click <span style={{ color: "#D84040" }}>Edit Project</span> to add one.
            </p>
        );
    }

    const urls = rawUrl.split(",").filter(Boolean);
    const gridCols = urls.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
    
    return (
        <div className={`mt-3 grid ${gridCols} gap-3`}>
            {urls.map((u: string, idx: number) => (
                <VideoItem key={idx} url={u} project={project} setProject={setProject} />
            ))}
        </div>
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


function AssignCrewRow({ dbCrew, dbCategories, assignedCrew, setAssignedCrew, inputStyle }: any) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null);
    const [role, setRole] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const filteredCrew = dbCrew.filter((m: any) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleAdd = () => {
        const nameVal = searchTerm.trim();
        const roleVal = role.trim();
        if (nameVal && roleVal) {
            let selectedMember = null;
            if (selectedCrewId) {
                selectedMember = dbCrew.find((m: any) => m.id === selectedCrewId);
            } else {
                selectedMember = dbCrew.find((m: any) => m.name.toLowerCase() === nameVal.toLowerCase());
            }

            if (selectedMember) {
                const exists = assignedCrew.some((ac: any) => {
                    if (ac.crewId) return ac.crewId === selectedMember.id && ac.role === roleVal;
                    return ac.name === selectedMember.name && ac.role === roleVal && !selectedMember.id;
                });
                if (exists) {
                    alert("Thành viên này đã được gán vai trò này.");
                    return;
                }
                setAssignedCrew((prev: any) => [...prev, { id: `crew-${selectedMember.id}-${Date.now()}`, crewId: selectedMember.id, name: selectedMember.name, role: roleVal }]);
                setSearchTerm("");
                setSelectedCrewId(null);
                setRole("");
            } else {
                alert("Không tìm thấy nhân sự có tên này trong hệ thống. Vui lòng chọn từ danh sách hoặc dùng phần Add Custom Credit.");
            }
        } else {
            alert("Vui lòng chọn nhân sự và nhập/chọn chức vụ (Role).");
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
                <input 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setSelectedCrewId(null); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    placeholder="Select or type crew name..." 
                    className="px-2 py-1.5 rounded-lg outline-none w-full text-xs" 
                    style={inputStyle} 
                    autoComplete="off"
                />
                {isOpen && filteredCrew.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg z-50 max-h-48 overflow-y-auto shadow-xl" style={{ background: "#1A1A1A", border: "1px solid #333" }}>
                    {filteredCrew.map((m: any) => (
                        <div 
                        key={m.id} 
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => {
                            setSearchTerm(m.name);
                            setSelectedCrewId(m.id);
                            setIsOpen(false);
                        }}
                        >
                        {m.avatar ? (
                            <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-red-900 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                            {m.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <span className="text-xs text-gray-200">{m.name}</span>
                        </div>
                    ))}
                    </div>
                )}
            </div>
            <div className="flex gap-2 flex-1">
                <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Director)" list="common-roles" className="px-2 py-1.5 rounded-lg outline-none flex-1 text-xs w-full" style={inputStyle} />
                <datalist id="common-roles">
                    {dbCategories.filter((c: any) => c.type === 'hr_role').map((c: any) => (
                        <option key={c.slug} value={c.name} />
                    ))}
                </datalist>
                <button type="button" onClick={handleAdd} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-[#EEEEEE]" style={{ background: "#D84040" }}>
                    Add
                </button>
            </div>
        </div>
    );
}

function MediaSelectorModal({ projectSlug, onClose, onSelect, acceptKind = "video" }: { projectSlug: string; onClose: () => void; onSelect: (url: string) => void; acceptKind?: string }) {
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi(`/media?project_slug=${projectSlug}`).then(data => {
            setMediaList(data.filter((m: any) => m.kind === acceptKind || (m.type && m.type.startsWith(acceptKind))));
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [projectSlug]);

    return createPortal(
        <div className="fixed inset-0 bg-black/90 flex flex-col z-[99999] p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-bold">Chọn Video từ Media dự án</h3>
                <button type="button" onClick={onClose} className="text-white hover:text-[#D84040]"><X size={24} /></button>
            </div>
            {loading ? (
                <div className="flex-1 flex justify-center items-center text-[#D84040]"><Loader2 size={32} className="animate-spin" /></div>
            ) : mediaList.length === 0 ? (
                <div className="flex-1 flex justify-center items-center text-[#888] text-sm">Không tìm thấy video nào trong media dự án này. Hãy tải lên ở thư viện Media.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto pb-10">
                    {mediaList.map((m: any) => (
                        <div key={m.id} onClick={() => onSelect(m.url)} className="relative group cursor-pointer rounded-lg overflow-hidden border border-[#3A2A2A] hover:border-[#D84040]">
                            <video src={m.url} className="w-full aspect-video object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <span className="bg-[#D84040] text-white px-3 py-1 rounded text-sm font-bold">Chọn Video</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white text-xs truncate">{m.name || m.file_name || "Video"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
}

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
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isAddingClient, setIsAddingClient] = useState(false);
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
            fetchApi(`/projects/${id}/feedback`).catch(() => []),
            fetchApi(`/projects/${id}/activities`).catch(() => []),
            fetchApi(`/projects/${id}/comments`).catch(() => [])
        ]).then(([projData, clientsData, categoriesData, crewData, expensesData, invoicesData, feedbackData, activitiesData, commentsData]) => {
            setProject(projData);
            setIsFeatured(!!projData.featured);
            setIsPublished(!!projData.published);
            setDbClients(clientsData);
            setDbCategories(categoriesData);
            setDbCrew(crewData);
            setExpenses(expensesData || []);
            setInvoices(invoicesData || []);
            setFeedbacks(feedbackData || []);
            setGalleryImages(projData.gallery || []);
            
            const formatTimeAgo = (dateStr: string) => {
                const diff = Date.now() - new Date(dateStr).getTime();
                const minutes = Math.floor(diff / 60000);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
                return "Just now";
            };

            setActivities((activitiesData || []).map((a: any) => ({
                id: a.id,
                user: a.user_name,
                action: a.action,
                time: formatTimeAgo(a.created_at),
                avatar: a.avatar || a.user_name.substring(0, 2).toUpperCase()
            })));

            setComments((commentsData || []).map((c: any) => ({
                id: c.id,
                user: c.user_name,
                text: c.text,
                time: formatTimeAgo(c.created_at),
                avatar: c.avatar || c.user_name.substring(0, 2).toUpperCase()
            })));

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

            const loadedCredits = projData.structured_credits || projData.credits || [];
            if (loadedCredits.length > 0) {
                const parsedCrew = loadedCredits.map((cred, idx) => {
                    if (typeof cred === 'string') {
                        const parts = cred.split(":");
                        const role = parts[0]?.trim() || "";
                        const name = parts[1]?.trim() || "";
                        return { id: `cred-${idx}-${Date.now()}`, name, role };
                    } else {
                        return { id: `cred-${idx}-${Date.now()}`, name: cred.name, role: cred.role, crewId: cred.crew_id };
                    }
                });
                setAssignedCrew(parsedCrew);
            } else {
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
    const [uploadedVerticalVideos, setUploadedVerticalVideos] = useState<File[]>([]);
    const [videoFormat, setVideoFormat] = useState<"horizontal" | "vertical">("horizontal");
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [showMediaSelector, setShowMediaSelector] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (videoFormat === "horizontal") {
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith("video/")) setUploadedVideo(file);
        } else {
            const files = Array.from(e.dataTransfer.files || []).filter((f: any) => f.type.startsWith("video/"));
            setUploadedVerticalVideos(prev => [...prev, ...files]);
        }
    };

    const handleSelectMediaVideo = (url: string) => {
        setValue("videoUrl", url);
        setUploadedVideo(null);
        setUploadedVerticalVideos([]);
        
        let currentUrls = (project?.video_url || project?.videoUrl || "").split(",").filter(Boolean);
        if (videoFormat === "horizontal") {
            currentUrls = [url];
        } else {
            currentUrls.push(url);
        }
        
        setProject(prev => ({ ...prev, video_url: currentUrls.join(","), videoUrl: currentUrls.join(",") }));
        setShowMediaSelector(false);
    };

    const watched = watch();
    const statusInfo = statusColors[watched.status] || statusColors["Planning"];

    const onSave = async (data) => {
        setSaving(true);
        try {
            let coverMediaId = undefined;
            if (thumbnailFile) {
                const renamedThumb = new File([thumbnailFile], `${data.title}.jpg`, { type: thumbnailFile.type });
                const mediaAsset = await uploadMediaPipeline(renamedThumb, "projects", fetchApi, undefined, data.client, project.slug, "thumbnail");
                coverMediaId = mediaAsset.id;
            } else if (thumbnailPreview === null) {
                coverMediaId = null;
            }

            let finalVideoUrl = data.videoUrl !== undefined ? data.videoUrl : (project?.video_url || project?.videoUrl);
            if (videoFormat === "horizontal") {
                if (uploadedVideo) {
                    const mediaAsset = await uploadMediaPipeline(uploadedVideo, "projects", fetchApi, undefined, data.client, project.slug, "final video");
                    finalVideoUrl = mediaAsset.url;
                }
            } else {
                if (uploadedVerticalVideos.length > 0) {
                    if (uploadedVerticalVideos.length < 3) {
                        throw new Error("Với định dạng dọc, vui lòng upload ít nhất 3 video.");
                    }
                    const urls = [];
                    for (let i = 0; i < uploadedVerticalVideos.length; i++) {
                        const file = uploadedVerticalVideos[i];
                        const renamed = new File([file], `Vertical Video ${data.title} ${i + 1}.mp4`, { type: file.type });
                        const mediaAsset = await uploadMediaPipeline(renamed, "projects", fetchApi, undefined, data.client, project.slug, "final video");
                        urls.push(mediaAsset.url);
                    }
                    finalVideoUrl = urls.join(",");
                }
            }

            const finalGalleryMediaIds = [];
            for (let i = 0; i < galleryImages.length; i++) {
                const img = galleryImages[i];
                if (img.file) {
                    const renamedBts = new File([img.file], `BTS ${data.title} ${i + 1}.jpg`, { type: img.file.type });
                    const mediaAsset = await uploadMediaPipeline(renamedBts, "projects", fetchApi, undefined, data.client, project.slug, "behind the scenes", true);
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
                status: data.status,
                cover_media_id: coverMediaId,
                summary: data.description || null,
                video_url: finalVideoUrl,
                dueDate: data.dueDate || null,
                budget: data.budget || "TBD",
                credits: assignedCrew.map((c: any) => `${c.role}: ${c.name}`),
                structured_credits: assignedCrew.map((c: any) => {
                    const realMember = c.crewId ? dbCrew.find((m: any) => m.id === c.crewId) : dbCrew.find((m: any) => m.name.toLowerCase() === c.name.toLowerCase());
                    return {
                        role: c.role,
                        name: c.name,
                        crew_id: realMember ? realMember.id : null
                    };
                }),
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

    const handleStatusChange = async (newStatus: string) => {
        setShowStatusDropdown(false);
        if (!project) return;

        setValue("status", newStatus);

        try {
            await fetchApi(`/projects/${id}`, {
                method: "PUT",
                body: JSON.stringify({ status: newStatus })
            });
            setProject(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (err) {
            console.error("Failed to update status:", err);
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

    const renderActionButtons = () => (
        <>
            {isEditing ? (<>
                <button onClick={handleCancel} className="flex items-center justify-center gap-1.5 px-4 rounded-lg transition-all whitespace-nowrap" style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888", border: "1px solid #2E2020", fontSize: "12px", height: "36px", minWidth: "130px", fontWeight: 500 }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}>
                    <X size={14}/> Discard
                </button>
                <button onClick={handleSubmit(onSave)} disabled={saving || saved} className="flex items-center justify-center gap-1.5 px-4 rounded-lg transition-all whitespace-nowrap" style={{ background: saved ? "#4CAF50" : "#D84040", color: "#fff", fontSize: "12px", fontWeight: 600, height: "36px", minWidth: "130px" }}>
                    {saving ? <><Loader2 size={14} className="animate-spin"/> Saving...</>
                    : saved ? <><CheckCircle2 size={14}/> Saved!</>
                    : <><Save size={14}/> Save Changes</>}
                </button>
            </>) : (<>
                <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-1.5 px-4 rounded-lg transition-all whitespace-nowrap" style={{ background: "#D84040", color: "#fff", fontSize: "12px", fontWeight: 600, height: "36px", minWidth: "130px" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#c03030"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#D84040"; }}>
                    <Edit3 size={14}/> Edit Project
                </button>
            </>)}
        </>
    );

    return (<div className="px-4 md:px-8 py-7 w-full max-w-full overflow-x-hidden">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="flex items-center justify-between w-full lg:w-auto">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <button onClick={() => navigate("/admin/projects")} className="hidden lg:flex w-9 h-9 rounded-lg items-center justify-center transition-all flex-shrink-0" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                            <ArrowLeft size={16}/>
                        </button>
                        <h1 style={{ color: "#EEEEEE", fontSize: "22px", fontWeight: 700, lineHeight: 1 }} className="mt-0.5">
                            {watched.title || project.title}
                        </h1>
                    </div>
                    
                    {/* Action buttons (Mobile only) */}
                    <div className="flex items-center gap-2 lg:hidden">
                        {renderActionButtons()}
                    </div>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto">
                    {/* Publish Toggle */}
                    <button
                        onClick={handleTogglePublished}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 rounded-lg transition-all whitespace-nowrap"
                        style={{
                            background: isPublished ? "rgba(76,175,80,0.12)" : "#241C1C",
                            color: isPublished ? "#4CAF50" : "#666",
                            border: `1px solid ${isPublished ? "rgba(76,175,80,0.4)" : "#2E2020"}`,
                            fontSize: "13px",
                            fontWeight: isPublished ? 600 : 400,
                            height: "36px"
                        }}
                    >
                        <Globe size={13} className="flex-shrink-0" />
                        <span className="truncate">{isPublished ? "Published" : "Draft"}</span>
                    </button>

                    {/* Status Dropdown */}
                    <div className="relative flex-1 lg:flex-none">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className="w-full flex items-center justify-between lg:justify-center gap-1.5 px-3 rounded-lg transition-all whitespace-nowrap"
                            style={{
                                background: (statusColors[watched.status || project?.status] || statusColors["Planning"]).bg,
                                color: (statusColors[watched.status || project?.status] || statusColors["Planning"]).text,
                                border: `1px solid ${(statusColors[watched.status || project?.status] || statusColors["Planning"]).border || "transparent"}`,
                                fontSize: "13px",
                                fontWeight: 600,
                                height: "36px"
                            }}
                        >
                            <span className="flex items-center gap-1.5 truncate">
                                <Activity size={13} className="flex-shrink-0" />
                                <span className="truncate">{watched.status || project?.status || "Planning"}</span>
                            </span>
                            <ChevronDown size={13} className={`flex-shrink-0 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showStatusDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-full lg:w-40 bg-[#1D1616] border border-[#2E2020] rounded-lg shadow-xl z-50 overflow-hidden">
                                {Object.keys(statusColors).map((status) => {
                                    const color = statusColors[status as keyof typeof statusColors];
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(status)}
                                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#2A1F1F] transition-colors"
                                            style={{ color: color.text }}
                                        >
                                            {status}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Highlight Toggle */}
                    <button
                        onClick={handleToggleFeatured}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 rounded-lg transition-all whitespace-nowrap"
                        style={{
                            background: isFeatured ? "rgba(255,193,7,0.12)" : "#241C1C",
                            color: isFeatured ? "#FFC107" : "#666",
                            border: `1px solid ${isFeatured ? "rgba(255,193,7,0.4)" : "#2E2020"}`,
                            fontSize: "13px",
                            fontWeight: isFeatured ? 600 : 400,
                            height: "36px"
                        }}
                    >
                        <Star size={13} fill={isFeatured ? "#FFC107" : "none"} className="flex-shrink-0" />
                        <span className="truncate">{isFeatured ? "Featured" : "Highlight"}</span>
                    </button>

                    <div className="hidden lg:block h-6 w-[1px] bg-[#2E2020] mx-1" />

                    {/* Action buttons (Desktop only) */}
                    <div className="hidden lg:flex items-center gap-2">
                        {renderActionButtons()}
                    </div>
                </div>
            </div>

            {/* ══════════════ ADMIN COMMAND CENTER TABS ══════════════ */}
            <div style={{ marginBottom: "24px" }}>
                {/* Tab bar */}
                <div className="overflow-x-auto hide-scrollbar" style={{
                    display: "flex", gap: "2px", marginBottom: "20px",
                    background: "rgba(29,22,22,0.5)", borderRadius: "14px", padding: "5px",
                    border: "1px solid rgba(46,32,32,0.6)", backdropFilter: "blur(12px)",
                }}>
                    {ADMIN_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setAdminTab(tab.id as any)}
                            style={{
                                flex: "1 0 auto", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                padding: "9px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Hero + Details (2 cols) ── */}
                <div className="lg:col-span-2 space-y-5">

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
                                    Project Title
                                </label>
                                {isEditing ? (<input {...register("title", { required: true })} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>{project.title}</p>)}
                            </div>

                            {/* Client + Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        Client
                                    </label>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <select {...register("client")} className="flex-1 px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                                {dbClients.map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                            </select>
                                            <button 
                                                type="button" 
                                                onClick={() => setIsAddingClient(true)} 
                                                className="flex items-center justify-center rounded-lg transition-all" 
                                                style={{ background: "#241C1C", border: "1px solid #3A2A2A", width: "40px", height: "40px", color: "#888" }} 
                                                title="Thêm Client mới"
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3A2A2A"; e.currentTarget.style.color = "#888"; }}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    ) : (<p style={{ color: "#EEEEEE", fontSize: "14px" }}>{project.client}</p>)}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        Category
                                    </label>
                                    {isEditing ? (
                                        isAddingCategory ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="Enter category name"
                                                    className="flex-1 px-3 py-2 rounded-lg outline-none appearance-none"
                                                    style={{ ...inputStyle }}
                                                    onFocus={(e) => (e.target.style.borderColor = "#D84040")}
                                                    onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            document.getElementById("btn-edit-save-new-category")?.click();
                                                        } else if (e.key === 'Escape') {
                                                            setIsAddingCategory(false);
                                                            setNewCategoryName("");
                                                            setValue("category", "", { shouldValidate: true });
                                                        }
                                                    }}
                                                />
                                                <button
                                                    id="btn-edit-save-new-category"
                                                    type="button"
                                                    onClick={async () => {
                                                        const name = newCategoryName.trim();
                                                        if (name) {
                                                            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                                                            try {
                                                                const res = await fetchApi("/categories", {
                                                                    method: "POST",
                                                                    body: JSON.stringify({ name, slug, type: "project_type", description: "" })
                                                                });
                                                                setDbCategories((prev: any[]) => [...prev, res]);
                                                                setValue("category", res.slug, { shouldValidate: true, shouldDirty: true });
                                                                setIsAddingCategory(false);
                                                                setNewCategoryName("");
                                                            } catch (err) {
                                                                alert("Lỗi khi tạo category (có thể bị trùng)");
                                                            }
                                                        }
                                                    }}
                                                    className="px-3 py-2 rounded-lg font-medium transition-all"
                                                    style={{ background: "#D84040", color: "#FFF", fontSize: "12px" }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingCategory(false);
                                                        setNewCategoryName("");
                                                        setValue("category", "", { shouldValidate: true });
                                                    }}
                                                    className="px-3 py-2 rounded-lg font-medium transition-all"
                                                    style={{ background: "#3A2A2A", color: "#EEE", fontSize: "12px" }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <select 
                                                    {...register("category")}
                                                    className="flex-1 px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                                    <option value="">Select category</option>
                                                    {dbCategories.filter((c: any) => c.type === 'project_type').map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                                </select>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setIsAddingCategory(true)} 
                                                    className="flex items-center justify-center rounded-lg transition-all" 
                                                    style={{ background: "#241C1C", border: "1px solid #3A2A2A", width: "40px", height: "40px", color: "#888" }} 
                                                    title="Thêm Category mới"
                                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3A2A2A"; e.currentTarget.style.color = "#888"; }}
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        )
                                    ) : (<button onClick={() => {
                const catId = project.format_slug || project.category;
                if (catId) navigate(`/admin/categories/${catId}`);
            }} className="flex items-center gap-1.5 group/cat" style={{ color: "#EEEEEE", fontSize: "14px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                                            {project.format || project.category}
                                            <ExternalLink size={11} color="#555" className="opacity-0 group-hover/cat:opacity-100 transition-opacity"/>
                                        </button>)}
                                </div>
                            </div>

                            {/* Due Date + Budget */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        Due Date
                                    </label>
                                    {isEditing ? (<input type="date" {...register("dueDate")} className="px-3 py-2 rounded-lg outline-none w-full" style={{ ...inputStyle, colorScheme: "dark" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (
                                        <p style={{ color: "#EEEEEE", fontSize: "14px" }}>{formatDueDate(project.dueDate)}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        Budget
                                    </label>
                                    {isEditing ? (() => {
                                        const { onChange, ...rest } = register("budget");
                                        return (
                                            <input 
                                                {...rest} 
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/,/g, "");
                                                    if (!isNaN(Number(val)) && val !== "") {
                                                        e.target.value = Number(val).toLocaleString("en-US");
                                                    }
                                                    onChange(e);
                                                }}
                                                className="px-3 py-2 rounded-lg outline-none" 
                                                style={inputStyle} 
                                                onFocus={(e) => (e.target.style.borderColor = "#D84040")} 
                                                onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}
                                            />
                                        );
                                    })() : (
                                        <div className="flex items-center gap-2">
                                            <p style={{ color: "#D84040", fontSize: "15px", fontWeight: 700 }}>
                                                {project.budget !== "TBD" && !isNaN(Number(project.budget)) ? Number(project.budget).toLocaleString("en-US") : project.budget}
                                            </p>
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
                                                <Video size={10} color="#D84040"/> Định dạng Video
                                            </label>
                                            <div className="flex gap-2 mb-4">
                                                <button type="button" onClick={() => setVideoFormat("horizontal")} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: videoFormat === "horizontal" ? "rgba(216,64,64,0.15)" : "#2A1F1F", color: videoFormat === "horizontal" ? "#D84040" : "#888", border: `1px solid ${videoFormat === "horizontal" ? "rgba(216,64,64,0.3)" : "#3A2A2A"}` }}>
                                                    Video Ngang (Mặc định)
                                                </button>
                                                <button type="button" onClick={() => setVideoFormat("vertical")} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: videoFormat === "vertical" ? "rgba(216,64,64,0.15)" : "#2A1F1F", color: videoFormat === "vertical" ? "#D84040" : "#888", border: `1px solid ${videoFormat === "vertical" ? "rgba(216,64,64,0.3)" : "#3A2A2A"}` }}>
                                                    Video Dọc (Tối thiểu 3)
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="flex items-center gap-1.5">
                                                    <UploadCloud size={10} color="#D84040"/> Upload Video {videoFormat === "vertical" ? "Files (Ít nhất 3 video)" : "File"}
                                                </label>
                                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMediaSelector(true); }} className="flex items-center gap-1 text-xs text-[#D84040] hover:underline px-2 py-1 bg-[#D84040]/10 rounded-md">
                                                    <MonitorPlay size={12} /> Chọn từ Media
                                                </button>
                                            </div>
                                            {(videoFormat === "horizontal" && !uploadedVideo) || (videoFormat === "vertical" && uploadedVerticalVideos.length === 0) ? (
                                                <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => document.getElementById("video-upload-edit")?.click()} className="rounded-xl flex flex-col items-center justify-center py-8 cursor-pointer transition-all select-none" style={{ border: `2px dashed ${dragActive ? "#D84040" : "#3A2A2A"}`, background: dragActive ? "rgba(216,64,64,0.05)" : "rgba(29,22,22,0.4)" }}>
                                                    <input id="video-upload-edit" type="file" accept="video/*" multiple={videoFormat === "vertical"} className="hidden" onChange={(e) => { 
                                                        if (videoFormat === "horizontal") {
                                                            const file = e.target.files?.[0]; if (file) setUploadedVideo(file); 
                                                        } else {
                                                            const files = Array.from(e.target.files || []);
                                                            setUploadedVerticalVideos(prev => [...prev, ...files]);
                                                        }
                                                    }}/>
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: dragActive ? "rgba(216,64,64,0.15)" : "#1D1616", border: `1px solid ${dragActive ? "rgba(216,64,64,0.4)" : "#2E2020"}` }}>
                                                        <UploadCloud size={18} color={dragActive ? "#D84040" : "#555"}/>
                                                    </div>
                                                    <p style={{ color: dragActive ? "#D84040" : "#888", fontSize: "12px", fontWeight: 500 }}>{dragActive ? "Drop video here" : (videoFormat === "vertical" ? "Drag & drop multiple videos" : "Drag & drop a video file")}</p>
                                                    <p style={{ color: "#555", fontSize: "11px" }} className="mt-1">or <span style={{ color: "#D84040" }}>browse files</span> · MP4, MOV, WebM — up to 500 MB</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {videoFormat === "horizontal" && uploadedVideo && (
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
                                                    {videoFormat === "vertical" && uploadedVerticalVideos.length > 0 && (
                                                        <>
                                                            {uploadedVerticalVideos.map((video, idx) => (
                                                                <div key={idx} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.25)" }}>
                                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(76,175,80,0.15)" }}>
                                                                        <Play size={14} color="#4CAF50" fill="#4CAF50"/>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="truncate">{video.name}</p>
                                                                        <p style={{ color: "#666", fontSize: "11px" }}>{(video.size / 1024 / 1024).toFixed(1)} MB · {video.type || "video"}</p>
                                                                    </div>
                                                                    <button type="button" onClick={() => setUploadedVerticalVideos(prev => prev.filter((_, i) => i !== idx))} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{ background: "#2A1F1F", color: "#666", border: "1px solid #3A2A2A" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                                                        <X size={12}/>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <div onClick={() => document.getElementById("video-upload-edit")?.click()} className="rounded-xl flex items-center justify-center py-4 cursor-pointer transition-all select-none mt-2" style={{ border: "2px dashed #3A2A2A", background: "rgba(29,22,22,0.4)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                                                <input id="video-upload-edit" type="file" accept="video/*" multiple className="hidden" onChange={(e) => { 
                                                                    const files = Array.from(e.target.files || []);
                                                                    setUploadedVerticalVideos(prev => [...prev, ...files]);
                                                                }}/>
                                                                <span style={{ color: "#888", fontSize: "12px", fontWeight: 500 }}>+ Add more videos</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <VideoViewMode project={project} uploadedVideo={uploadedVideo} setProject={setProject} />
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
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "11px", fontWeight: 700 }}>
                                            {item.avatar?.startsWith('http') ? <img src={item.avatar} alt="" className="w-full h-full object-cover" /> : item.avatar}
                                        </div>
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
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "11px", fontWeight: 700 }}>
                                                {c.avatar?.startsWith('http') ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : c.avatar}
                                            </div>
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
                                        <input onKeyDown={async (e) => {
                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                const text = e.currentTarget.value.trim();
                                e.currentTarget.value = "";
                                try {
                                    const newComment = await fetchApi(`/projects/${id}/comments`, {
                                        method: "POST",
                                        body: JSON.stringify({
                                            user_name: "Alex (You)",
                                            text: text,
                                            avatar: "AY"
                                        })
                                    });
                                    setComments((prev) => [{
                                        id: newComment.id,
                                        user: newComment.user_name,
                                        text: newComment.text,
                                        time: "Just now",
                                        avatar: newComment.avatar
                                    }, ...prev]);
                                } catch (err) {
                                    console.error("Failed to post comment", err);
                                    alert("Failed to post comment");
                                }
                            }
                        }} placeholder="Add a comment..." className="flex-1 px-3 py-2 rounded-lg outline-none" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", fontSize: "13px" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#2A1F1F")}/>
                                    </div>
                                </>)}
                        </div>
                    </div>
                </div>

                {/* ── Right: Sidebar (1 col) ── */}
                <div className="col-span-1 space-y-5">


                    {/* Assigned Crew */}
                    <div className="rounded-xl p-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <div className="flex items-center justify-between mb-3">
                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Assigned Crew</p>
                            <span style={{ color: "#D84040", fontSize: "12px" }}>{new Set(assignedCrew.map(c => c.name.toLowerCase())).size} members</span>
                        </div>

                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {Object.values(assignedCrew.reduce((acc, current) => {
                                        const key = current.crewId ? `id-${current.crewId}` : current.name.toLowerCase();
                                        if (!acc[key]) acc[key] = { name: current.name, crewId: current.crewId, roles: [] };
                                        acc[key].roles.push({ id: current.id, role: current.role });
                                        return acc;
                                    }, {} as Record<string, { name: string, crewId?: number, roles: { id: string, role: string }[] }>)).map((c) => {
                                        const initials = c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                                        const realMember = c.crewId ? dbCrew.find(m => m.id === c.crewId) : dbCrew.find(m => m.name.toLowerCase() === c.name.toLowerCase());
                                        const avatarUrl = realMember?.avatar || null;
                                        return (
                                            <div key={c.crewId ? `id-${c.crewId}` : c.name} className="flex items-start justify-between p-2 rounded-lg" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                                                <div className="flex items-start gap-2 min-w-0 w-full">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt={c.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5" style={{ background: "#8E1616", color: "#EEEEEE" }}>{initials}</div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 500 }} className="truncate">{realMember ? realMember.name : c.name}</p>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {c.roles.map(r => (
                                                                <div key={r.id} className="flex items-center gap-1" style={{ background: "rgba(216, 64, 64, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                                                    <p style={{ color: "#D84040", fontSize: "10px" }} className="truncate">{r.role}</p>
                                                                    <button type="button" onClick={() => setAssignedCrew(prev => prev.filter(item => item.id !== r.id))} className="text-gray-500 hover:text-red-500 transition-colors p-0.5">
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {assignedCrew.length === 0 && (<p style={{ color: "#666", fontSize: "11px", fontStyle: "italic" }} className="py-2">No crew assigned yet.</p>)}
                                </div>

                                <div className="mt-3 pt-3 border-t border-[#2A1F1F] space-y-2">
                                    <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Assign Crew Member</label>
                                    <AssignCrewRow 
                                        dbCrew={dbCrew} 
                                        dbCategories={dbCategories} 
                                        assignedCrew={assignedCrew} 
                                        setAssignedCrew={setAssignedCrew} 
                                        inputStyle={inputStyle} 
                                    />
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
                                {Object.values(assignedCrew.reduce((acc, current) => {
                                    const key = current.crewId ? `id-${current.crewId}` : current.name.toLowerCase();
                                    if (!acc[key]) acc[key] = { name: current.name, crewId: current.crewId, roles: [] };
                                    acc[key].roles.push(current.role);
                                    return acc;
                                }, {} as Record<string, { name: string, crewId?: number, roles: string[] }>)).map((c) => {
                                    const realMember = c.crewId ? dbCrew.find(m => m.id === c.crewId) : dbCrew.find(m => m.name.toLowerCase() === c.name.toLowerCase());
                                    const avatarUrl = realMember?.avatar || null;
                                    const status = realMember?.status || "Active";
                                    const initials = c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                                    return (
                                        <div key={c.crewId ? `id-${c.crewId}` : c.name} className="flex items-start gap-3">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={realMember?.name || c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" style={{ border: "2px solid #2A1F1F" }}/>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5" style={{ background: "#8E1616", border: "2px solid #2A1F1F", color: "#EEEEEE" }}>{initials}</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    {realMember ? (
                                                        <button type="button" onClick={() => navigate(`/admin/crew/${realMember.id}`)} className="text-left hover:text-[#D84040] transition-colors" style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>{realMember.name}</button>
                                                    ) : (
                                                        <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>{c.name}</p>
                                                    )}
                                                    {realMember && (<span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: status === "Active" ? "#4CAF50" : "#E8A838" }}/>)}
                                                </div>
                                                <div className="mt-0.5 space-y-0.5">
                                                    {c.roles.map((role, idx) => (
                                                        <p key={idx} style={{ color: "#D84040", fontSize: "11px" }}>{role}</p>
                                                    ))}
                                                </div>
                                            </div>
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

            <DeleteConfirmModal isOpen={showDeleteModal} itemType="project" itemName={project?.title ?? ""} onConfirm={handleDeleteProject} onCancel={() => setShowDeleteModal(false)} isDeleting={isDeletingProject}/>
            
            {isAddingClient && (
                <AddClientModal 
                    onClose={() => setIsAddingClient(false)}
                    onAdd={(newClient) => {
                        setDbClients((prev: any[]) => [...prev, newClient]);
                        setTimeout(() => {
                            setValue("client", newClient.slug, { shouldValidate: true, shouldDirty: true });
                        }, 0);
                    }}
                />
            )}

            {showMediaSelector && (
                <MediaSelectorModal 
                    projectSlug={project?.slug} 
                    onClose={() => setShowMediaSelector(false)} 
                    onSelect={handleSelectMediaVideo} 
                />
            )}
        </div>);
}
