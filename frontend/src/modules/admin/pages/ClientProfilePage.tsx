// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { 
    ArrowLeft, Edit3, Save, X, Trash2, CheckCircle2, Loader2, 
    Mail, Phone, Globe, Building2, User, Briefcase, DollarSign, 
    Calendar, AlertTriangle, ExternalLink, Activity, Tag, 
    ChevronRight, Plus, Check, Camera, FileText, ShieldCheck, 
    Percent, Folder, PlusCircle, History, Clock, Receipt, 
    CreditCard, AlertCircle, ChevronDown, UserCheck
} from "lucide-react";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { fetchApi } from "../utils/apiClient";

const statusColors = {
    Lead: { bg: "rgba(233, 30, 99, 0.15)", text: "#E91E63", border: "rgba(233, 30, 99, 0.3)", label: "Lead mới" },
    Active: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50", border: "rgba(76,175,80,0.3)", label: "Đang hợp tác" },
    Paused: { bg: "rgba(232,168,56,0.15)", text: "#E8A838", border: "rgba(232,168,56,0.3)", label: "Tạm dừng" },
    Completed: { bg: "rgba(150, 150, 150, 0.15)", text: "#999999", border: "rgba(150, 150, 150, 0.3)", label: "Đã ngừng hợp tác" },
};

const projectStatusColors = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838" },
};

const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};

export function ClientProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    
    // Tab state
    const [activeTab, setActiveTab] = useState("info");
    
    // Crew list for Assignee dropdown
    const [crew, setCrew] = useState([]);
    
    // CRM Metadata State
    const [crmData, setCrmData] = useState({
        tax_code: "",
        invoice_address: "",
        poc_list: [],
        assignee: "",
        ltv: 0,
        outstanding_balance: 0,
        invoices: [],
        proposals: [],
        activity_logs: [],
        appointments: [],
        documents: [],
        raw_notes: "",
        tier: "SME",
    });

    // Temp form states for adding items while in editing mode
    const [newPoc, setNewPoc] = useState({ name: "", phone: "", email: "", role: "" });
    const [newProposal, setNewProposal] = useState({ title: "", budget: "", sentDate: "", status: "Pending" });
    const [newInvoice, setNewInvoice] = useState({ code: "", description: "", amount: "", date: "", status: "Unpaid" });
    const [newLog, setNewLog] = useState({ date: new Date().toISOString().split('T')[0], type: "Meeting", content: "" });
    const [newAppointment, setNewAppointment] = useState({ date: "", type: "Pitching", content: "" });
    const [newDoc, setNewDoc] = useState({ name: "", type: "Master Agreement", url: "#" });

    const { register, handleSubmit, watch, reset, setValue } = useForm({});

    // Fetch crew members
    useEffect(() => {
        fetchApi("/crew")
            .then(data => {
                if (Array.isArray(data)) {
                    setCrew(data);
                }
            })
            .catch(err => console.error("Error fetching crew members:", err));
    }, []);

    // Fetch categories
    const [categories, setCategories] = useState([]);
    useEffect(() => {
        fetchApi("/categories")
            .then(data => {
                if (Array.isArray(data)) {
                    setCategories(data);
                }
            })
            .catch(err => console.error("Error fetching categories:", err));
    }, []);

    // Fetch client details
    useEffect(() => {
        fetchApi(`/projects/clients/${id}`)
            .then(data => {
                setClient(data);
                setAvatarPreview(data.logo_media_url || null);
                
                // Try parsing metadata from database notes field
                let parsedCrm = null;
                if (data.notes) {
                    try {
                        const trimmed = data.notes.trim();
                        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                            parsedCrm = JSON.parse(trimmed);
                        }
                    } catch (e) {
                        console.warn("Client notes is not a valid JSON string. Falling back to plain text.");
                    }
                }
                
                // Sync properties
                const initialCrm = {
                    tax_code: parsedCrm?.tax_code || "",
                    invoice_address: parsedCrm?.invoice_address || "",
                    poc_list: parsedCrm?.poc_list || (data.contact ? [{ name: data.contact, phone: data.phone || "", email: data.email || "", role: "Người liên hệ chính" }] : []),
                    assignee: parsedCrm?.assignee || "",
                    ltv: parsedCrm?.ltv || data.total_budget || 0,
                    outstanding_balance: parsedCrm?.outstanding_balance || 0,
                    invoices: parsedCrm?.invoices || [],
                    proposals: parsedCrm?.proposals || [],
                    activity_logs: parsedCrm?.activity_logs || [],
                    appointments: parsedCrm?.appointments || [],
                    documents: parsedCrm?.documents || [
                        { id: "doc-1", name: "Hợp đồng nguyên tắc (Master Agreement)", type: "Master Agreement", url: "#" },
                        { id: "doc-2", name: "Thỏa thuận bảo mật thông tin (NDA)", type: "NDA", url: "#" }
                    ],
                    raw_notes: parsedCrm?.raw_notes || (!data.notes?.trim().startsWith("{") ? data.notes : "") || "",
                    tier: parsedCrm?.tier || "SME",
                };
                
                setCrmData(initialCrm);

                reset({
                    name: data.name,
                    contact: initialCrm.poc_list[0]?.name || data.contact || "",
                    email: initialCrm.poc_list[0]?.email || data.email || "",
                    phone: initialCrm.poc_list[0]?.phone || data.phone || "",
                    website: data.website || "",
                    industry: data.industry || "",
                    status: data.status || "Active",
                    since: data.since || "2026",
                    budget: data.total_budget ? `${data.total_budget.toLocaleString()} ₫` : "N/A",
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id, reset]);

    const watched = watch();
    const statusInfo = statusColors[watched.status] || statusColors["Active"];
    const initials = (watched.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    
    const industries = categories.filter(c => c.type === "client_industry");
    const currentIndustry = watched.industry;
    const hasCurrent = industries.some(ind => ind.name === currentIndustry);
    const dropdownOptions = [...industries];
    if (currentIndustry && !hasCurrent) {
        dropdownOptions.push({ name: currentIndustry, slug: currentIndustry });
    }

    const clientProjects = client?.projects || [];
    const activeProjects = clientProjects.filter(p => p.status !== "Completed");
    const completedProjects = clientProjects.filter(p => p.status === "Completed");

    const onSave = async (data) => {
        setSaving(true);
        try {
            let logoMediaId = client.logo_media_id;

            if (avatarFile) {
                const formData = new FormData();
                formData.append("file", avatarFile);
                formData.append("alt", `${data.name} Logo`);
                formData.append("caption", `Logo for ${data.name}`);
                formData.append("folder", "avatar/client");
                const mediaAsset = await fetchApi("/media/upload", {
                    method: "POST",
                    body: formData,
                });
                logoMediaId = mediaAsset.id;
            } else if (avatarPreview === null) {
                logoMediaId = null;
            }

            // Synchronize primary contact details from the first POC in our list
            const primaryPoc = crmData.poc_list[0] || {};
            const primaryContactName = primaryPoc.name || data.contact || null;
            const primaryContactEmail = primaryPoc.email || data.email || null;
            const primaryContactPhone = primaryPoc.phone || data.phone || null;

            // Compute LTV based on projects total budget and paid invoices
            const calculatedLTV = crmData.invoices
                .filter(inv => inv.status === "Paid")
                .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0) || crmData.ltv || client.total_budget || 0;

            const calculatedOutstanding = crmData.invoices
                .filter(inv => inv.status === "Unpaid" || inv.status === "Overdue")
                .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

            const updatedCrmData = {
                ...crmData,
                ltv: calculatedLTV,
                outstanding_balance: calculatedOutstanding,
            };

            const payload = {
                name: data.name,
                logo_media_id: logoMediaId,
                website: data.website || null,
                contact: primaryContactName,
                email: primaryContactEmail,
                phone: primaryContactPhone,
                industry: data.industry || null,
                status: data.status,
                since: data.since || null,
                notes: JSON.stringify(updatedCrmData),
            };

            await fetchApi(`/projects/clients/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            // Reload fresh details
            const freshDetail = await fetchApi(`/projects/clients/${id}`);
            setClient(freshDetail);
            setAvatarPreview(freshDetail.logo_media_url || null);
            setAvatarFile(null);
            setCrmData(updatedCrmData);
            
            // Sync React Hook Form
            setValue("contact", primaryContactName || "");
            setValue("email", primaryContactEmail || "");
            setValue("phone", primaryContactPhone || "");

            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                setIsEditing(false);
            }, 1400);
        } catch (error) {
            console.error("Error updating client:", error);
            alert(error instanceof Error ? error.message : "Failed to update client.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await fetchApi(`/projects/clients/${id}`, {
                method: "DELETE"
            });
            navigate("/admin/clients");
        } catch (error) {
            console.error("Error deleting client:", error);
            alert(error instanceof Error ? error.message : "Failed to delete client.");
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const handleCancel = () => { 
        reset(); 
        setAvatarPreview(client?.logo_media_url || null);
        setAvatarFile(null);
        
        // Restore CRM data
        let parsedCrm = null;
        if (client?.notes) {
            try {
                const trimmed = client.notes.trim();
                if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                    parsedCrm = JSON.parse(trimmed);
                }
            } catch (e) {}
        }
        
        setCrmData({
            tax_code: parsedCrm?.tax_code || "",
            invoice_address: parsedCrm?.invoice_address || "",
            poc_list: parsedCrm?.poc_list || (client?.contact ? [{ name: client.contact, phone: client.phone || "", email: client.email || "", role: "Người liên hệ chính" }] : []),
            assignee: parsedCrm?.assignee || "Sarah Kim",
            ltv: parsedCrm?.ltv || client?.total_budget || 0,
            outstanding_balance: parsedCrm?.outstanding_balance || 0,
            invoices: parsedCrm?.invoices || [],
            proposals: parsedCrm?.proposals || [],
            activity_logs: parsedCrm?.activity_logs || [],
            appointments: parsedCrm?.appointments || [],
            documents: parsedCrm?.documents || [
                { id: "doc-1", name: "Hợp đồng nguyên tắc (Master Agreement)", type: "Master Agreement", url: "#" },
                { id: "doc-2", name: "Thỏa thuận bảo mật thông tin (NDA)", type: "NDA", url: "#" }
            ],
            raw_notes: parsedCrm?.raw_notes || (!client?.notes?.trim().startsWith("{") ? client.notes : "") || "",
            tier: parsedCrm?.tier || "SME",
        });
        
        setIsEditing(false); 
    };

    // Helper functions to mutate local CRM arrays while in editing mode
    const addPocItem = () => {
        if (!newPoc.name.trim()) return;
        setCrmData(prev => ({
            ...prev,
            poc_list: [...prev.poc_list, { ...newPoc, id: `poc-${Date.now()}` }]
        }));
        setNewPoc({ name: "", phone: "", email: "", role: "" });
    };

    const removePocItem = (index) => {
        setCrmData(prev => ({
            ...prev,
            poc_list: prev.poc_list.filter((_, i) => i !== index)
        }));
    };

    const addProposalItem = () => {
        if (!newProposal.title.trim()) return;
        setCrmData(prev => ({
            ...prev,
            proposals: [...prev.proposals, { ...newProposal, id: `prop-${Date.now()}` }]
        }));
        setNewProposal({ title: "", budget: "", sentDate: new Date().toISOString().split('T')[0], status: "Pending" });
    };

    const removeProposalItem = (index) => {
        setCrmData(prev => ({
            ...prev,
            proposals: prev.proposals.filter((_, i) => i !== index)
        }));
    };

    const addInvoiceItem = () => {
        if (!newInvoice.code.trim()) return;
        setCrmData(prev => ({
            ...prev,
            invoices: [...prev.invoices, { ...newInvoice, id: `inv-${Date.now()}` }]
        }));
        setNewInvoice({ code: "", description: "", amount: "", date: new Date().toISOString().split('T')[0], status: "Unpaid" });
    };

    const removeInvoiceItem = (index) => {
        setCrmData(prev => ({
            ...prev,
            invoices: prev.invoices.filter((_, i) => i !== index)
        }));
    };

    const addLogItem = () => {
        if (!newLog.content.trim()) return;
        setCrmData(prev => ({
            ...prev,
            activity_logs: [{ ...newLog, id: `log-${Date.now()}` }, ...prev.activity_logs]
        }));
        setNewLog({ date: new Date().toISOString().split('T')[0], type: "Meeting", content: "" });
    };

    const removeLogItem = (index) => {
        setCrmData(prev => ({
            ...prev,
            activity_logs: prev.activity_logs.filter((_, i) => i !== index)
        }));
    };

    const addAppointmentItem = () => {
        if (!newAppointment.content.trim()) return;
        setCrmData(prev => ({
            ...prev,
            appointments: [...prev.appointments, { ...newAppointment, id: `app-${Date.now()}` }]
        }));
        setNewAppointment({ date: new Date().toISOString().split('T')[0], type: "Pitching", content: "" });
    };

    const removeAppointmentItem = (index) => {
        setCrmData(prev => ({
            ...prev,
            appointments: prev.appointments.filter((_, i) => i !== index)
        }));
    };

    const addDocItem = () => {
        if (!newDoc.name.trim()) return;
        setCrmData(prev => ({
            ...prev,
            documents: [...prev.documents, { ...newDoc, id: `doc-${Date.now()}` }]
        }));
        setNewDoc({ name: "", type: "Master Agreement", url: "#" });
    };

    const removeDocItem = (index) => {
        setCrmData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    const tabs = [
        { id: "info", label: "Thông tin chung", icon: User },
        { id: "projects", label: "Dự án & Báo giá", icon: Briefcase },
        { id: "finance", label: "Tài chính", icon: DollarSign },
        { id: "logs", label: "Nhật ký & Ghi chú", icon: History },
        { id: "documents", label: "Tài liệu", icon: Folder },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="px-8 py-7">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate("/admin/clients")} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888" }}>
                        <ArrowLeft size={16}/>
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertTriangle size={48} color="#3A2A2A" className="mb-4"/>
                    <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }}>Client not found</p>
                    <button onClick={() => navigate("/admin/clients")} className="mt-4 px-4 py-2 rounded-lg" style={{ background: "#D84040", color: "#fff", fontSize: "14px" }}>Back to Clients</button>
                </div>
            </div>
        );
    }

    return (
        <div className="px-8 py-7 w-full">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/admin/clients")} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                        <ArrowLeft size={16}/>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span style={{ color: "#666", fontSize: "13px" }}>Clients</span>
                            <span style={{ color: "#444" }}>/</span>
                            <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{client.name}</span>
                        </div>
                        <h1 style={{ color: "#EEEEEE", fontSize: "22px", fontWeight: 700 }} className="mt-0.5">{watched.name}</h1>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888", border: "1px solid #2E2020", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}>
                                <X size={14}/> Discard
                            </button>
                            <button onClick={handleSubmit(onSave)} disabled={saving || saved} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: saved ? "#4CAF50" : "#D84040", color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                                {saving ? <><Loader2 size={13} className="animate-spin"/> Saving...</>
                                : saved ? <><CheckCircle2 size={13}/> Saved!</>
                                : <><Save size={13}/> Save Changes</>}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#666", border: "1px solid #2E2020", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2E2020"; }}>
                                <Trash2 size={13}/> Delete
                            </button>
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "#D84040", color: "#fff", fontSize: "13px", fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.background = "#c03030"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#D84040"; }}>
                                <Edit3 size={13}/> Edit Client
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Banner block */}
            <div className="rounded-xl overflow-hidden mb-6 relative" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #1D1616 0%, #8E1616 60%, #D84040 100%)", zIndex: 0 }}>
                    {/* Status and Tier badges */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full font-semibold" style={{ 
                            background: crmData.tier === "VIP" ? "rgba(255,215,0,0.15)" : crmData.tier === "Partner" ? "rgba(26,188,156,0.15)" : "rgba(107,143,214,0.15)",
                            color: crmData.tier === "VIP" ? "#FFD700" : crmData.tier === "Partner" ? "#1ABC9C" : "#6B8FD6",
                            border: `1px solid ${crmData.tier === "VIP" ? "rgba(255,215,0,0.3)" : crmData.tier === "Partner" ? "rgba(26,188,156,0.3)" : "rgba(107,143,214,0.3)"}`,
                            fontSize: "12px", 
                            backdropFilter: "blur(8px)"
                        }}>
                            Cấp độ: {crmData.tier || "SME"}
                        </span>
                        <span className="px-3 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text, border: `1px solid ${statusInfo.border}`, fontSize: "12px", fontWeight: 600, backdropFilter: "blur(8px)" }}>
                            {statusInfo.label || watched.status}
                        </span>
                    </div>
                </div>

                <div className="px-6 pb-5 relative flex items-end justify-between -mt-10" style={{ zIndex: 1 }}>
                    <div className="flex items-end gap-4">
                        <div className="relative group">
                            <input id="client-profile-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setAvatarPreview(URL.createObjectURL(file));
                                    setAvatarFile(file);
                                }
                            }}/>
                            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "22px", fontWeight: 700, border: "4px solid #241C1C", position: "relative", zIndex: 2 }}>
                                {avatarPreview ? (<img src={avatarPreview} alt="Client avatar" className="w-full h-full object-cover"/>) : (initials)}
                            </div>
                            {isEditing && (
                                <>
                                    <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ background: "rgba(0,0,0,0.6)", zIndex: 3 }} onClick={() => document.getElementById("client-profile-avatar")?.click()}>
                                        <Camera size={20} color="#EEEEEE"/>
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#D84040", border: "2px solid #241C1C", zIndex: 4 }} onClick={() => document.getElementById("client-profile-avatar")?.click()}>
                                        <Camera size={10} color="#fff"/>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mb-1">
                            <h2 style={{ color: "#EEEEEE", fontSize: "20px", fontWeight: 700 }}>{watched.name}</h2>
                            <p style={{ color: "#888", fontSize: "13px" }} className="mt-0.5">{watched.industry || "Chưa cập nhật lĩnh vực"}</p>
                        </div>
                    </div>
                    {isEditing && (
                        <div className="flex items-center gap-2 mb-1">
                            <button type="button" onClick={() => document.getElementById("client-profile-avatar")?.click()} style={{ color: "#D84040", fontSize: "12px", fontWeight: 500 }}>
                                {avatarPreview ? "Thay đổi logo" : "Tải logo lên"}
                            </button>
                            {avatarPreview && (
                                <>
                                    <span style={{ color: "#3A2A2A", fontSize: "10px" }}>·</span>
                                    <button type="button" onClick={() => setAvatarPreview(null)} style={{ color: "#666", fontSize: "12px" }}>
                                        Xóa bỏ
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal isOpen={confirmDelete} itemType="client" itemName={client.name} onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} isDeleting={deleting}/>

            {/* CRM Tabbed Navigation */}
            <div className="flex gap-2 border-b border-[#2A1F1F] mb-6">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className="flex items-center gap-2 px-5 py-3 transition-all relative"
                        style={{
                            color: activeTab === t.id ? "#EEEEEE" : "#888",
                            fontSize: "14px",
                            fontWeight: activeTab === t.id ? 600 : 400,
                        }}
                    >
                        <t.icon size={15} style={{ color: activeTab === t.id ? "#D84040" : "#666" }} />
                        {t.label}
                        {activeTab === t.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#D84040" }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="grid grid-cols-1 gap-6">

                {/* ── TAB 1: THÔNG TIN CHUNG ── */}
                {activeTab === "info" && (
                    <div className="grid grid-cols-3 gap-6 items-start">
                        {/* Company Detail Form Fields (2 cols) */}
                        <div className="col-span-2 rounded-xl p-5 space-y-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] mb-4 flex items-center gap-2">
                                <Building2 size={16} /> Thông tin doanh nghiệp
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1 flex items-center gap-1">
                                        Tên công ty
                                    </label>
                                    {isEditing ? (
                                        <input {...register("name")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} />
                                    ) : (
                                        <p style={{ color: "#EEEEEE", fontSize: "14px" }}>{watched.name || "—"}</p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1 flex items-center gap-1">
                                        Lĩnh vực kinh doanh
                                    </label>
                                    {isEditing ? (
                                        <select {...register("industry")} className="px-3 py-2 rounded-lg outline-none cursor-pointer" style={inputStyle}>
                                            <option value="">Chọn lĩnh vực...</option>
                                            {dropdownOptions.map((ind) => (
                                                <option key={ind.slug || ind.name} value={ind.name}>{ind.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p style={{ color: "#EEEEEE", fontSize: "14px" }}>{watched.industry || "—"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1 flex items-center gap-1">
                                        Mã số thuế
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            value={crmData.tax_code} 
                                            onChange={(e) => setCrmData(prev => ({ ...prev, tax_code: e.target.value }))}
                                            placeholder="MST trích xuất hóa đơn"
                                            className="px-3 py-2 rounded-lg outline-none" 
                                            style={inputStyle} 
                                        />
                                    ) : (
                                        <p style={{ color: "#EEEEEE", fontSize: "14px" }}>{crmData.tax_code || "—"}</p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1 flex items-center gap-1">
                                        Website doanh nghiệp
                                    </label>
                                    {isEditing ? (
                                        <input {...register("website")} placeholder="https://..." className="px-3 py-2 rounded-lg outline-none" style={inputStyle} />
                                    ) : (
                                        watched.website ? (
                                            <a href={watched.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#D84040] hover:underline" style={{ fontSize: "14px" }}>
                                                {watched.website} <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <p style={{ color: "#EEEEEE", fontSize: "14px" }}>—</p>
                                        )
                                    )}
                                </div>
                            </div>

                            <div>
                                <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1 flex items-center gap-1">
                                    Địa chỉ xuất hóa đơn
                                </label>
                                {isEditing ? (
                                    <input 
                                        value={crmData.invoice_address} 
                                        onChange={(e) => setCrmData(prev => ({ ...prev, invoice_address: e.target.value }))}
                                        placeholder="Địa chỉ ghi trên hóa đơn VAT"
                                        className="px-3 py-2 rounded-lg outline-none" 
                                        style={inputStyle} 
                                    />
                                ) : (
                                    <p style={{ color: "#EEEEEE", fontSize: "14px" }}>{crmData.invoice_address || "—"}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-2">
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1 flex items-center gap-1">
                                        Thời điểm bắt đầu hợp tác (Since)
                                    </label>
                                    {isEditing ? (
                                        <input {...register("since")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} />
                                    ) : (
                                        <p style={{ color: "#EEEEEE", fontSize: "14px" }}>{client.since || "—"}</p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1 flex items-center gap-1">
                                        Cấp độ khách hàng (Tier)
                                    </label>
                                    {isEditing ? (
                                        <select 
                                            value={crmData.tier || "SME"}
                                            onChange={(e) => setCrmData(prev => ({ ...prev, tier: e.target.value }))}
                                            className="px-3 py-2 rounded-lg outline-none cursor-pointer"
                                            style={inputStyle}
                                        >
                                            <option value="SME">SME</option>
                                            <option value="VIP">VIP</option>
                                            <option value="Partner">Partner</option>
                                        </select>
                                    ) : (
                                        <div>
                                            <span className="inline-flex items-center px-3 py-0.5 rounded-full font-semibold" style={{ 
                                                background: crmData.tier === "VIP" ? "rgba(255,215,0,0.12)" : crmData.tier === "Partner" ? "rgba(26,188,156,0.12)" : "rgba(107,143,214,0.12)",
                                                color: crmData.tier === "VIP" ? "#FFD700" : crmData.tier === "Partner" ? "#1ABC9C" : "#6B8FD6",
                                                fontSize: "12px"
                                            }}>
                                                {crmData.tier || "SME"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1 flex items-center gap-1">
                                        Trạng thái quan hệ
                                    </label>
                                    {isEditing ? (
                                        <select {...register("status")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle}>
                                            <option value="Lead">Lead mới</option>
                                            <option value="Active">Đang hợp tác</option>
                                            <option value="Paused">Tạm dừng</option>
                                            <option value="Completed">Đã ngừng hợp tác</option>
                                        </select>
                                    ) : (
                                        <div>
                                            <span className="inline-flex items-center px-3 py-0.5 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text, fontSize: "12px", fontWeight: 600 }}>
                                                {statusInfo.label || watched.status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* POC Section & Assignee (1 col) */}
                        <div className="space-y-6">
                            {/* Internal Assignee */}
                            <div className="rounded-xl p-5" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] mb-3 flex items-center gap-2">
                                    <UserCheck size={16} /> Phân công chăm sóc
                                </h3>
                                <label style={{ color: "#888", fontSize: "11px" }} className="mb-1.5 block">
                                    Account Manager phụ trách
                                </label>
                                {isEditing ? (
                                    <select 
                                        value={crmData.assignee}
                                        onChange={(e) => setCrmData(prev => ({ ...prev, assignee: e.target.value }))}
                                        className="px-3 py-2 rounded-lg outline-none cursor-pointer"
                                        style={inputStyle}
                                    >
                                        <option value="">-- Chưa chỉ định --</option>
                                        {crew.map(member => (
                                            <option key={member.id} value={member.name}>{member.name} ({member.role})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(29, 22, 22, 0.6)", border: "1px solid #2A1F1F" }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: "#8E1616", color: "#fff", fontSize: "11px", fontWeight: 700 }}>
                                            {crmData.assignee?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "AM"}
                                        </div>
                                        <div>
                                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{crmData.assignee || "Chưa phân công"}</p>
                                            <p style={{ color: "#666", fontSize: "11px" }}>Account Manager</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* POC List */}
                            <div className="rounded-xl p-5" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><User size={16} /> Người liên hệ (POC)</span>
                                    <span className="text-xs text-[#888]">{crmData.poc_list.length} contacts</span>
                                </h3>

                                <div className="space-y-3 mb-4">
                                    {crmData.poc_list.map((poc, idx) => (
                                        <div key={poc.id || idx} className="p-3 rounded-lg space-y-1 relative group" style={{ background: "rgba(29, 22, 22, 0.6)", border: "1px solid #2A1F1F" }}>
                                            {isEditing && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removePocItem(idx)} 
                                                    className="absolute top-2 right-2 text-[#666] hover:text-[#D84040] transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{poc.name}</p>
                                                {poc.role && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold" style={{ background: "rgba(216, 64, 64, 0.12)", color: "#D84040" }}>
                                                        {poc.role}
                                                    </span>
                                                )}
                                            </div>
                                            {poc.phone && <p style={{ color: "#888", fontSize: "12px" }} className="flex items-center gap-1.5"><Phone size={10} color="#8E1616" /> {poc.phone}</p>}
                                            {poc.email && <p style={{ color: "#888", fontSize: "12px" }} className="flex items-center gap-1.5"><Mail size={10} color="#8E1616" /> {poc.email}</p>}
                                        </div>
                                    ))}
                                    {crmData.poc_list.length === 0 && (
                                        <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-4">Chưa có thông tin người liên hệ</p>
                                    )}
                                </div>

                                {/* Add POC Form (Only visible in edit mode) */}
                                {isEditing && (
                                    <div className="pt-3 border-t border-[#2A1F1F] space-y-2">
                                        <p className="text-[11px] font-semibold uppercase text-white/50">Thêm người liên hệ mới</p>
                                        <input 
                                            placeholder="Tên người liên hệ" 
                                            value={newPoc.name}
                                            onChange={(e) => setNewPoc(prev => ({ ...prev, name: e.target.value }))}
                                            className="px-2 py-1 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                        />
                                        <input 
                                            placeholder="Chức vụ (Ví dụ: Giám đốc Marketing)" 
                                            value={newPoc.role}
                                            onChange={(e) => setNewPoc(prev => ({ ...prev, role: e.target.value }))}
                                            className="px-2 py-1 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input 
                                                placeholder="Số điện thoại" 
                                                value={newPoc.phone}
                                                onChange={(e) => setNewPoc(prev => ({ ...prev, phone: e.target.value }))}
                                                className="px-2 py-1 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                            />
                                            <input 
                                                placeholder="Email" 
                                                value={newPoc.email}
                                                onChange={(e) => setNewPoc(prev => ({ ...prev, email: e.target.value }))}
                                                className="px-2 py-1 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={addPocItem}
                                            className="w-full py-1.5 rounded flex items-center justify-center gap-1 text-white bg-[#D84040] hover:bg-[#c03030]" 
                                            style={{ fontSize: "12px", fontWeight: 600 }}
                                        >
                                            <Plus size={12} /> Thêm liên hệ
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 2: DỰ ÁN & BÁO GIÁ ── */}
                {activeTab === "projects" && (
                    <div className="grid grid-cols-3 gap-6 items-start">
                        {/* Projects list (2 cols) */}
                        <div className="col-span-2 space-y-6">
                            {/* Active Projects */}
                            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                                    <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Dự án đang chạy (Active Projects)</p>
                                    <span style={{ color: "#D84040", fontSize: "12px" }}>{activeProjects.length} projects</span>
                                </div>
                                {activeProjects.length > 0 ? (
                                    <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
                                        {activeProjects.map((p) => (
                                            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors" onClick={() => navigate(`/admin/projects/${p.id}`)} onMouseEnter={(e) => (e.currentTarget.style.background = "#2A1F1F")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                                <div className="w-10 h-10 rounded-lg bg-[#2A1F1F] flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.title} className="w-full h-full object-cover"/>
                                                    ) : (
                                                        <Briefcase size={16} color="#666" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{p.title}</p>
                                                    <p style={{ color: "#666", fontSize: "11px" }}>{p.category} · Due {p.dueDate}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div style={{ width: "80px" }}>
                                                        <div className="rounded-full" style={{ height: "4px", background: "#2A1F1F" }}>
                                                            <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.progress === 100 ? "#6B8FD6" : "linear-gradient(to right, #8E1616, #D84040)" }}/>
                                                        </div>
                                                    </div>
                                                    <span style={{ color: "#666", fontSize: "11px", minWidth: "28px" }}>{p.progress}%</span>
                                                    <span className="px-2 py-0.5 rounded-full" style={{ background: projectStatusColors[p.status]?.bg || "rgba(100,100,100,0.15)", color: projectStatusColors[p.status]?.text || "#aaa", fontSize: "10px", fontWeight: 500 }}>
                                                        {p.status}
                                                    </span>
                                                    <span style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>{p.budget}</span>
                                                    <ChevronRight size={14} color="#555"/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <Briefcase size={32} color="#3A2A2A" className="mx-auto mb-2"/>
                                        <p style={{ color: "#666", fontSize: "13px" }}>Không có dự án nào đang chạy</p>
                                    </div>
                                )}
                            </div>

                            {/* Completed Projects */}
                            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                                    <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Lịch sử dự án đã hoàn thành (Completed)</p>
                                    <span style={{ color: "#888", fontSize: "12px" }}>{completedProjects.length} projects</span>
                                </div>
                                {completedProjects.length > 0 ? (
                                    <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
                                        {completedProjects.map((p) => (
                                            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors" onClick={() => navigate(`/admin/projects/${p.id}`)} onMouseEnter={(e) => (e.currentTarget.style.background = "#2A1F1F")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                                <div className="w-10 h-10 rounded-lg bg-[#2A1F1F] flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.title} className="w-full h-full object-cover"/>
                                                    ) : (
                                                        <Briefcase size={16} color="#666" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{p.title}</p>
                                                    <p style={{ color: "#666", fontSize: "11px" }}>{p.category} · Completed {p.dueDate}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(107,143,214,0.15)", color: "#6B8FD6", fontSize: "10px", fontWeight: 500 }}>
                                                        Completed
                                                    </span>
                                                    <span style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>{p.budget}</span>
                                                    <ChevronRight size={14} color="#555"/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <Briefcase size={32} color="#3A2A2A" className="mx-auto mb-2"/>
                                        <p style={{ color: "#666", fontSize: "13px" }}>Chưa có dự án đã hoàn thành</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Proposals Section (1 col) */}
                        <div className="rounded-xl p-5" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><FileText size={16} /> Báo giá & Proposal chờ chốt</span>
                                <span className="text-xs text-[#888]">{crmData.proposals.length} đề xuất</span>
                            </h3>

                            <div className="space-y-3 mb-4">
                                {crmData.proposals.map((prop, idx) => (
                                    <div key={prop.id || idx} className="p-3 rounded-lg space-y-1 relative group" style={{ background: "rgba(29, 22, 22, 0.6)", border: "1px solid #2A1F1F" }}>
                                        {isEditing && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeProposalItem(idx)} 
                                                className="absolute top-2 right-2 text-[#666] hover:text-[#D84040]"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{prop.title}</p>
                                        <div className="flex justify-between items-center text-xs pt-1">
                                            <span style={{ color: "#D84040", fontWeight: 600 }}>{prop.budget ? `${parseFloat(prop.budget).toLocaleString()} ₫` : "TBD"}</span>
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{
                                                background: prop.status === "Approved" ? "rgba(76,175,80,0.15)" : prop.status === "Rejected" ? "rgba(216,64,64,0.15)" : "rgba(232,168,56,0.15)",
                                                color: prop.status === "Approved" ? "#4CAF50" : prop.status === "Rejected" ? "#D84040" : "#E8A838"
                                            }}>
                                                {prop.status}
                                            </span>
                                        </div>
                                        {prop.sentDate && <p style={{ color: "#666", fontSize: "10px" }} className="mt-1">Gửi ngày: {prop.sentDate}</p>}
                                    </div>
                                ))}
                                {crmData.proposals.length === 0 && (
                                    <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-8">Chưa có báo giá đang chờ</p>
                                )}
                            </div>

                            {/* Add Proposal Form (Edit mode only) */}
                            {isEditing && (
                                <div className="pt-3 border-t border-[#2A1F1F] space-y-2">
                                    <p className="text-[11px] font-semibold uppercase text-white/50">Tạo đề xuất báo giá mới</p>
                                    <input 
                                        placeholder="Tiêu đề đề xuất (Proposal Name)" 
                                        value={newProposal.title}
                                        onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                                        className="px-2 py-1.5 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input 
                                            type="number" 
                                            placeholder="Ngân sách (₫)" 
                                            value={newProposal.budget}
                                            onChange={(e) => setNewProposal(prev => ({ ...prev, budget: e.target.value }))}
                                            className="px-2 py-1.5 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                        />
                                        <input 
                                            type="date"
                                            value={newProposal.sentDate}
                                            onChange={(e) => setNewProposal(prev => ({ ...prev, sentDate: e.target.value }))}
                                            className="px-2 py-1.5 rounded outline-none text-[#EEEEEE]" style={{ ...inputStyle, fontSize: "12px" }} 
                                        />
                                    </div>
                                    <select
                                        value={newProposal.status}
                                        onChange={(e) => setNewProposal(prev => ({ ...prev, status: e.target.value }))}
                                        className="px-2 py-1.5 rounded outline-none cursor-pointer"
                                        style={{ ...inputStyle, fontSize: "12px" }}
                                    >
                                        <option value="Pending">Chờ duyệt (Pending)</option>
                                        <option value="Approved">Chấp nhận (Approved)</option>
                                        <option value="Rejected">Từ chối (Rejected)</option>
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={addProposalItem}
                                        className="w-full py-1.5 rounded flex items-center justify-center gap-1 text-white bg-[#D84040] hover:bg-[#c03030]" 
                                        style={{ fontSize: "12px", fontWeight: 600 }}
                                    >
                                        <Plus size={12} /> Thêm đề xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB 3: TÀI CHÍNH ── */}
                {activeTab === "finance" && (
                    <div className="space-y-6">
                        {/* Financial Stat boxes */}
                        <div className="grid grid-cols-3 gap-6">
                            {/* LTV */}
                            <div className="rounded-xl p-5 flex items-center justify-between" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(76,175,80,0.12)" }}>
                                        <CreditCard size={18} color="#4CAF50"/>
                                    </div>
                                    <div>
                                        <p style={{ color: "#888", fontSize: "12px" }}>Giá trị vòng đời (LTV)</p>
                                        {isEditing ? (
                                            <input 
                                                type="number"
                                                value={crmData.ltv}
                                                onChange={(e) => setCrmData(prev => ({ ...prev, ltv: parseFloat(e.target.value) || 0 }))}
                                                className="px-2 py-0.5 rounded outline-none text-[#EEEEEE] font-bold"
                                                style={{ ...inputStyle, width: "120px", fontSize: "16px" }}
                                            />
                                        ) : (
                                            <p style={{ color: "#4CAF50", fontSize: "20px", fontWeight: 700 }}>
                                                {parseFloat(crmData.ltv || 0).toLocaleString()} ₫
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] text-[#666] uppercase bg-black/30 px-2 py-1 rounded">Từ hoá đơn Paid</span>
                            </div>

                            {/* Outstanding Balance */}
                            <div className="rounded-xl p-5 flex items-center justify-between" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(216,64,64,0.12)" }}>
                                        <AlertCircle size={18} color="#D84040"/>
                                    </div>
                                    <div>
                                        <p style={{ color: "#888", fontSize: "12px" }}>Công nợ hiện tại</p>
                                        <p style={{ color: "#D84040", fontSize: "20px", fontWeight: 700 }}>
                                            {crmData.invoices
                                                .filter(inv => inv.status === "Unpaid" || inv.status === "Overdue")
                                                .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)
                                                .toLocaleString()
                                            } ₫
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-[#666] uppercase bg-black/30 px-2 py-1 rounded">Chưa thanh toán</span>
                            </div>

                            {/* Invoices summary */}
                            <div className="rounded-xl p-5 flex items-center gap-3" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(216,64,64,0.12)" }}>
                                    <Receipt size={18} color="#D84040"/>
                                </div>
                                <div>
                                    <p style={{ color: "#888", fontSize: "12px" }}>Tổng số hóa đơn</p>
                                    <p style={{ color: "#EEEEEE", fontSize: "20px", fontWeight: 700 }}>{crmData.invoices.length} invoices</p>
                                </div>
                            </div>
                        </div>

                        {/* Invoices List Table */}
                        <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] flex items-center justify-between">
                                <span className="flex items-center gap-2"><Receipt size={16} /> Lịch sử xuất hóa đơn & thanh toán</span>
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#2A1F1F]" style={{ color: "#888", fontSize: "12px" }}>
                                            <th className="pb-3 font-semibold">Mã Invoice</th>
                                            <th className="pb-3 font-semibold">Mô tả chi tiết</th>
                                            <th className="pb-3 font-semibold">Ngày xuất bản</th>
                                            <th className="pb-3 font-semibold">Giá trị (₫)</th>
                                            <th className="pb-3 font-semibold">Trạng thái</th>
                                            {isEditing && <th className="pb-3 font-semibold text-right">Thao tác</th>}
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: "13px" }} className="divide-y divide-[#2A1F1F]">
                                        {crmData.invoices.map((inv, idx) => (
                                            <tr key={inv.id || idx} className="text-[#EEEEEE]">
                                                <td className="py-3 font-semibold text-[#D84040]">{inv.code}</td>
                                                <td className="py-3">{inv.description}</td>
                                                <td className="py-3">{inv.date}</td>
                                                <td className="py-3 font-semibold">{parseFloat(inv.amount).toLocaleString()} ₫</td>
                                                <td className="py-3">
                                                    {isEditing ? (
                                                        <select
                                                            value={inv.status}
                                                            onChange={(e) => {
                                                                const updatedInvoices = [...crmData.invoices];
                                                                updatedInvoices[idx].status = e.target.value;
                                                                setCrmData(prev => ({ ...prev, invoices: updatedInvoices }));
                                                            }}
                                                            className="px-2 py-0.5 rounded outline-none bg-[#1D1616] border border-[#3A2A2A] text-xs cursor-pointer"
                                                        >
                                                            <option value="Paid">Đã trả (Paid)</option>
                                                            <option value="Unpaid">Chưa trả (Unpaid)</option>
                                                            <option value="Overdue">Quá hạn (Overdue)</option>
                                                        </select>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{
                                                            background: inv.status === "Paid" ? "rgba(76,175,80,0.15)" : inv.status === "Overdue" ? "rgba(216,64,64,0.15)" : "rgba(232,168,56,0.15)",
                                                            color: inv.status === "Paid" ? "#4CAF50" : inv.status === "Overdue" ? "#D84040" : "#E8A838"
                                                        }}>
                                                            {inv.status === "Paid" ? "Paid" : inv.status === "Overdue" ? "Overdue" : "Unpaid"}
                                                        </span>
                                                    )}
                                                </td>
                                                {isEditing && (
                                                    <td className="py-3 text-right">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeInvoiceItem(idx)}
                                                            className="p-1 rounded text-[#666] hover:text-[#D84040] transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}

                                        {/* Inline Add Invoice Row (Edit mode only) */}
                                        {isEditing && (
                                            <tr style={{ background: "rgba(216, 64, 64, 0.02)" }}>
                                                <td className="py-3 pr-2">
                                                    <input 
                                                        placeholder="INV-000" 
                                                        value={newInvoice.code}
                                                        onChange={(e) => setNewInvoice(prev => ({ ...prev, code: e.target.value }))}
                                                        className="px-2 py-1 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                                    />
                                                </td>
                                                <td className="py-3 pr-2">
                                                    <input 
                                                        placeholder="Mô tả nội dung thanh toán" 
                                                        value={newInvoice.description}
                                                        onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                                                        className="px-2 py-1 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                                    />
                                                </td>
                                                <td className="py-3 pr-2">
                                                    <input 
                                                        type="date"
                                                        value={newInvoice.date}
                                                        onChange={(e) => setNewInvoice(prev => ({ ...prev, date: e.target.value }))}
                                                        className="px-2 py-1 rounded outline-none text-[#EEEEEE]" style={{ ...inputStyle, fontSize: "12px" }} 
                                                    />
                                                </td>
                                                <td className="py-3 pr-2">
                                                    <input 
                                                        type="number"
                                                        placeholder="Số tiền (₫)" 
                                                        value={newInvoice.amount}
                                                        onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))}
                                                        className="px-2 py-1 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                                    />
                                                </td>
                                                <td className="py-3 pr-2">
                                                    <select
                                                        value={newInvoice.status}
                                                        onChange={(e) => setNewInvoice(prev => ({ ...prev, status: e.target.value }))}
                                                        className="px-2 py-1 rounded outline-none cursor-pointer" style={{ ...inputStyle, fontSize: "12px" }}
                                                    >
                                                        <option value="Paid">Paid</option>
                                                        <option value="Unpaid">Unpaid</option>
                                                        <option value="Overdue">Overdue</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <button 
                                                        type="button" 
                                                        onClick={addInvoiceItem}
                                                        className="px-3 py-1 rounded flex items-center justify-center gap-1 text-white bg-[#D84040] hover:bg-[#c03030]" 
                                                        style={{ fontSize: "11px", fontWeight: 600 }}
                                                    >
                                                        <Plus size={11} /> Thêm
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {crmData.invoices.length === 0 && !isEditing && (
                                    <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-8">Chưa có giao dịch hóa đơn nào</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 4: NHẬT KÝ & GHI CHÚ ── */}
                {activeTab === "logs" && (
                    <div className="grid grid-cols-3 gap-6 items-start">
                        {/* Timeline logs (2 cols) */}
                        <div className="col-span-2 space-y-6">
                            {/* General Relationship notes */}
                            <div className="rounded-xl p-5 space-y-3" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] flex items-center gap-2">
                                    <History size={16} /> Ghi chú nội bộ tổng quan
                                </h3>
                                {isEditing ? (
                                    <textarea 
                                        rows={4} 
                                        placeholder="Ghi chú về thói quen, phong cách làm việc, sở thích của khách hàng..."
                                        value={crmData.raw_notes}
                                        onChange={(e) => setCrmData(prev => ({ ...prev, raw_notes: e.target.value }))}
                                        className="px-3 py-2.5 rounded-lg outline-none resize-none" 
                                        style={inputStyle} 
                                    />
                                ) : (
                                    <p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-line" }}>
                                        {crmData.raw_notes || "Chưa có ghi chú đặc biệt cho khách hàng này."}
                                    </p>
                                )}
                            </div>

                            {/* Care Logs timeline */}
                            <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] flex items-center justify-between">
                                    <span className="flex items-center gap-2"><History size={16} /> Nhật ký chăm sóc & Phản hồi</span>
                                    <span className="text-xs text-[#888]">{crmData.activity_logs.length} logs</span>
                                </h3>

                                {/* Quick Add Log (Edit mode only) */}
                                {isEditing && (
                                    <div className="p-4 rounded-lg space-y-3 border border-[#3A2A2A]" style={{ background: "rgba(29, 22, 22, 0.4)" }}>
                                        <p className="text-[11px] font-semibold uppercase text-white/50">Ghi nhận nhật ký chăm sóc mới</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input 
                                                type="date"
                                                value={newLog.date}
                                                onChange={(e) => setNewLog(prev => ({ ...prev, date: e.target.value }))}
                                                className="px-2 py-1 rounded outline-none text-[#EEEEEE]" style={{ ...inputStyle, fontSize: "12px" }} 
                                            />
                                            <select
                                                value={newLog.type}
                                                onChange={(e) => setNewLog(prev => ({ ...prev, type: e.target.value }))}
                                                className="px-2 py-1 rounded outline-none cursor-pointer" style={{ ...inputStyle, fontSize: "12px" }}
                                            >
                                                <option value="Meeting">Hội họp (Meeting)</option>
                                                <option value="Call">Điện thoại (Call)</option>
                                                <option value="Dining">Đi ăn / Tiếp khách (Dining)</option>
                                                <option value="Feedback">Phản hồi quan trọng (Feedback)</option>
                                            </select>
                                        </div>
                                        <textarea 
                                            rows={2}
                                            placeholder="Nội dung chi tiết (Ví dụ: Giám đốc bên họ rất kỹ tính khâu duyệt Kịch bản)" 
                                            value={newLog.content}
                                            onChange={(e) => setNewLog(prev => ({ ...prev, content: e.target.value }))}
                                            className="px-2.5 py-1.5 rounded outline-none resize-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={addLogItem}
                                            className="px-4 py-1.5 rounded flex items-center justify-center gap-1 text-white bg-[#D84040] hover:bg-[#c03030]" 
                                            style={{ fontSize: "12px", fontWeight: 600 }}
                                        >
                                            <Plus size={12} /> Ghi nhận vào nhật ký
                                        </button>
                                    </div>
                                )}

                                {/* Logs Render */}
                                <div className="space-y-4 pt-2">
                                    {crmData.activity_logs.map((log, idx) => (
                                        <div key={log.id || idx} className="flex gap-4 relative">
                                            {/* Timeline dot & line */}
                                            <div className="flex flex-col items-center flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(216, 64, 64, 0.12)", border: "1px solid #3A2A2A" }}>
                                                    <History size={13} color="#D84040" />
                                                </div>
                                                {idx < crmData.activity_logs.length - 1 && (
                                                    <div className="w-[1px] bg-[#3A2A2A] flex-1 min-h-[40px] my-1" />
                                                )}
                                            </div>
                                            {/* Content box */}
                                            <div className="flex-1 p-3 rounded-lg border border-[#2A1F1F]" style={{ background: "rgba(29, 22, 22, 0.4)" }}>
                                                {isEditing && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeLogItem(idx)}
                                                        className="float-right text-[#666] hover:text-[#D84040] transition-colors ml-2"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                )}
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold" style={{ background: "rgba(142, 22, 22, 0.12)", color: "#C0585A" }}>
                                                        {log.type}
                                                    </span>
                                                    <span style={{ color: "#666", fontSize: "11px" }}>{log.date}</span>
                                                </div>
                                                <p style={{ color: "#EEEEEE", fontSize: "13px", lineHeight: "1.6" }}>{log.content}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {crmData.activity_logs.length === 0 && (
                                        <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-8">Chưa có nhật ký hoạt động được ghi lại</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Appointments sidebar (1 col) */}
                        <div className="rounded-xl p-5" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Clock size={16} /> Lịch hẹn sắp tới</span>
                                <span className="text-xs text-[#888]">{crmData.appointments.length} lịch hẹn</span>
                            </h3>

                            <div className="space-y-3 mb-4">
                                {crmData.appointments.map((app, idx) => (
                                    <div key={app.id || idx} className="p-3 rounded-lg border border-[#2A1F1F] space-y-1.5 relative" style={{ background: "rgba(29, 22, 22, 0.6)" }}>
                                        {isEditing && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeAppointmentItem(idx)}
                                                className="absolute top-2 right-2 text-[#666] hover:text-[#D84040] transition-colors"
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold" style={{ background: "rgba(232, 168, 56, 0.12)", color: "#E8A838" }}>
                                                {app.type}
                                            </span>
                                            <span style={{ color: "#D84040", fontSize: "11px", fontWeight: 600 }} className="flex items-center gap-1">
                                                <Calendar size={11} /> {app.date}
                                            </span>
                                        </div>
                                        <p style={{ color: "#EEEEEE", fontSize: "12.5px" }}>{app.content}</p>
                                    </div>
                                ))}

                                {crmData.appointments.length === 0 && (
                                    <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-8">Không có lịch hẹn sắp tới</p>
                                )}
                            </div>

                            {/* Add Appointment form (Edit mode only) */}
                            {isEditing && (
                                <div className="pt-3 border-t border-[#2A1F1F] space-y-2">
                                    <p className="text-[11px] font-semibold uppercase text-white/50">Thêm lịch hẹn sắp tới</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input 
                                            type="date"
                                            value={newAppointment.date}
                                            onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                                            className="px-2 py-1 rounded outline-none text-[#EEEEEE]" style={{ ...inputStyle, fontSize: "12px" }} 
                                        />
                                        <select
                                            value={newAppointment.type}
                                            onChange={(e) => setNewAppointment(prev => ({ ...prev, type: e.target.value }))}
                                            className="px-2 py-1 rounded outline-none cursor-pointer" style={{ ...inputStyle, fontSize: "12px" }}
                                        >
                                            <option value="Pitching">Pitching (Thuyết trình)</option>
                                            <option value="Call">Gọi điện lại (Call)</option>
                                            <option value="Meeting">Họp dự án (Meeting)</option>
                                        </select>
                                    </div>
                                    <input 
                                        placeholder="Nội dung lịch hẹn (Ví dụ: Thuyết trình kịch bản...)" 
                                        value={newAppointment.content}
                                        onChange={(e) => setNewAppointment(prev => ({ ...prev, content: e.target.value }))}
                                        className="px-2 py-1 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={addAppointmentItem}
                                        className="w-full py-1.5 rounded flex items-center justify-center gap-1 text-white bg-[#D84040] hover:bg-[#c03030]" 
                                        style={{ fontSize: "12px", fontWeight: 600 }}
                                    >
                                        <Plus size={12} /> Thêm lịch hẹn
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB 5: KHO TÀI LIỆU & HỢP ĐỒNG ── */}
                {activeTab === "documents" && (
                    <div className="rounded-xl p-5 space-y-5" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D84040] flex items-center justify-between">
                            <span className="flex items-center gap-2"><Folder size={16} /> Kho lưu trữ tài liệu pháp lý & Rate Card</span>
                            <span className="text-xs text-[#888]">{crmData.documents.length} files</span>
                        </h3>

                        {/* Documents Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {crmData.documents.map((doc, idx) => {
                                // Decide icon based on type
                                let DocIcon = FileText;
                                if (doc.type === "NDA") DocIcon = ShieldCheck;
                                if (doc.type === "Discount Rate Card") DocIcon = Percent;

                                return (
                                    <div key={doc.id || idx} className="p-4 rounded-xl border border-[#2A1F1F] flex gap-3 relative group" style={{ background: "rgba(29, 22, 22, 0.6)" }}>
                                        {isEditing && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeDocItem(idx)}
                                                className="absolute top-2 right-2 text-[#666] hover:text-[#D84040] transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        <div className="w-10 h-10 rounded-lg bg-[#2A1F1F] flex items-center justify-center flex-shrink-0">
                                            <DocIcon size={20} color="#D84040" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-[#888] uppercase tracking-wider font-semibold">{doc.type}</p>
                                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }} className="truncate mt-0.5">{doc.name}</p>
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#666] hover:text-[#D84040] mt-2 transition-colors">
                                                Xem chi tiết <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Document Form (Edit mode only) */}
                        {isEditing && (
                            <div className="p-4 rounded-xl border border-[#3A2A2A] space-y-3" style={{ background: "rgba(29, 22, 22, 0.4)", maxWidth: "500px" }}>
                                <p className="text-[11px] font-semibold uppercase text-white/50">Thêm tài liệu liên kết mới</p>
                                <input 
                                    placeholder="Tên tài liệu / Văn bản" 
                                    value={newDoc.name}
                                    onChange={(e) => setNewDoc(prev => ({ ...prev, name: e.target.value }))}
                                    className="px-2 py-1.5 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={newDoc.type}
                                        onChange={(e) => setNewDoc(prev => ({ ...prev, type: e.target.value }))}
                                        className="px-2 py-1.5 rounded outline-none cursor-pointer" style={{ ...inputStyle, fontSize: "12px" }}
                                    >
                                        <option value="Master Agreement">Hợp đồng nguyên tắc (Master Agreement)</option>
                                        <option value="NDA">Thỏa thuận bảo mật (NDA)</option>
                                        <option value="Discount Rate Card">Bảng giá ưu đãi (Rate Card)</option>
                                        <option value="Other">Tài liệu khác (Other)</option>
                                    </select>
                                    <input 
                                        placeholder="Liên kết tài liệu (URL)" 
                                        value={newDoc.url}
                                        onChange={(e) => setNewDoc(prev => ({ ...prev, url: e.target.value }))}
                                        className="px-2 py-1.5 rounded outline-none" style={{ ...inputStyle, fontSize: "12px" }} 
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={addDocItem}
                                    className="px-4 py-1.5 rounded flex items-center justify-center gap-1 text-white bg-[#D84040] hover:bg-[#c03030]" 
                                    style={{ fontSize: "12px", fontWeight: 600 }}
                                >
                                    <Plus size={12} /> Thêm tài liệu
                                </button>
                            </div>
                        )}

                        {crmData.documents.length === 0 && !isEditing && (
                            <p style={{ color: "#666", fontSize: "12px", textAlign: "center" }} className="py-8">Chưa có tài liệu pháp lý được liên kết</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
