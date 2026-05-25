// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, FolderOpen, MoreHorizontal, Trash2, ChevronRight, Pencil, X, Search, Droplets, Check, Briefcase, Palette, Code2, Camera, Film, Megaphone, LayoutTemplate, Monitor, Globe, Layers, PenTool, Scissors, Zap, Cpu, Package, MessageSquare, BookOpen, Music, Video, Box, Grid3X3, FileText, Award, Target, Compass, Sparkles, Wand2, Lightbulb, Rocket, Shield, Brush, Settings, Sliders, Shapes, Folder, Image, Newspaper, FlaskConical, DollarSign, Loader2 } from "lucide-react";
import { fetchApi } from "../utils/apiClient";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
// ─────────────────────────────────────────────────────────────────
// Icon catalogue
// ─────────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
    { name: "FolderOpen", Icon: FolderOpen },
    { name: "Folder", Icon: Folder },
    { name: "Briefcase", Icon: Briefcase },
    { name: "Palette", Icon: Palette },
    { name: "Brush", Icon: Brush },
    { name: "PenTool", Icon: PenTool },
    { name: "Wand2", Icon: Wand2 },
    { name: "Shapes", Icon: Shapes },
    { name: "Layers", Icon: Layers },
    { name: "Code2", Icon: Code2 },
    { name: "Monitor", Icon: Monitor },
    { name: "Cpu", Icon: Cpu },
    { name: "Settings", Icon: Settings },
    { name: "Sliders", Icon: Sliders },
    { name: "Camera", Icon: Camera },
    { name: "Image", Icon: Image },
    { name: "Film", Icon: Film },
    { name: "Video", Icon: Video },
    { name: "Music", Icon: Music },
    { name: "Megaphone", Icon: Megaphone },
    { name: "Newspaper", Icon: Newspaper },
    { name: "FileText", Icon: FileText },
    { name: "BookOpen", Icon: BookOpen },
    { name: "MessageSquare", Icon: MessageSquare },
    { name: "Globe", Icon: Globe },
    { name: "Compass", Icon: Compass },
    { name: "Target", Icon: Target },
    { name: "Rocket", Icon: Rocket },
    { name: "Sparkles", Icon: Sparkles },
    { name: "Lightbulb", Icon: Lightbulb },
    { name: "Zap", Icon: Zap },
    { name: "Award", Icon: Award },
    { name: "Shield", Icon: Shield },
    { name: "Package", Icon: Package },
    { name: "Box", Icon: Box },
    { name: "Grid3X3", Icon: Grid3X3 },
    { name: "LayoutTemplate", Icon: LayoutTemplate },
    { name: "DollarSign", Icon: DollarSign },
    { name: "Scissors", Icon: Scissors },
    { name: "FlaskConical", Icon: FlaskConical },
];
const defaultIcons = {
    Branding: "Palette",
    "Web Design": "Monitor",
    Motion: "Film",
    Marketing: "Megaphone",
    "UI/UX": "Layers",
    Photography: "Camera",
};
// ─────────────────────────────────────────────────────────────────
// Color catalogue — brand primary red is the global default
// ─────────────────────────────────────────────────────────────────
const BRAND_RED = "#D84040";
const COLOR_SWATCHES = [
    // Row 1 — Reds & pinks
    { hex: "#D84040", label: "Brand Red" },
    { hex: "#8E1616", label: "Deep Red" },
    { hex: "#C0392B", label: "Crimson" },
    { hex: "#E91E63", label: "Rose" },
    // Row 2 — Warm
    { hex: "#FF5722", label: "Deep Orange" },
    { hex: "#E67E22", label: "Orange" },
    { hex: "#E8A838", label: "Amber" },
    { hex: "#F9A825", label: "Yellow" },
    // Row 3 — Cool
    { hex: "#4CAF50", label: "Green" },
    { hex: "#1ABC9C", label: "Teal" },
    { hex: "#00BCD4", label: "Cyan" },
    { hex: "#3498DB", label: "Sky Blue" },
    // Row 4 — Accent neutrals
    { hex: "#6B8FD6", label: "Periwinkle" },
    { hex: "#9B59B6", label: "Purple" },
    { hex: "#607D8B", label: "Steel" },
    { hex: "#EEEEEE", label: "Light Gray" },
];
// Hex-to-RGBA helper for generating tint backgrounds from a hex color
function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
// ─────────────────────────────────────────────────────────────────
// Color Picker Modal
// ─────────────────────────────────────────────────────────────────
function ColorPickerModal({ current, onSelect, onClose, }) {
    const [hex, setHex] = useState(current);
    const [hexInput, setHexInput] = useState(current);
    const [hexError, setHexError] = useState(false);
    const isValid = (v) => /^#[0-9A-Fa-f]{6}$/.test(v);
    const handleHexChange = (v) => {
        setHexInput(v);
        const full = v.startsWith("#") ? v : `#${v}`;
        if (isValid(full)) {
            setHex(full);
            setHexError(false);
        }
        else {
            setHexError(true);
        }
    };
    const handleConfirm = () => {
        if (isValid(hex)) {
            onSelect(hex);
            onClose();
        }
    };
    const handleSwatchClick = (swatchHex) => {
        setHex(swatchHex);
        setHexInput(swatchHex);
        setHexError(false);
    };
    const isDefault = hex === BRAND_RED;
    return (<div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.72)", zIndex: 9999 }} onClick={onClose}>
            <div className="rounded-2xl overflow-hidden" style={{
            background: "#241C1C",
            border: "1px solid #2E2020",
            width: "360px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                    <div className="flex items-center gap-3">
                        {/* Live preview dot */}
                        <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{
            background: hex,
            border: `2px solid ${hexToRgba(hex, 0.4)}`,
            boxShadow: `0 0 12px ${hexToRgba(hex, 0.35)}`,
            transition: "background 0.15s, box-shadow 0.15s",
        }}/>
                        <div>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>
                                Accent Color
                            </p>
                            <p style={{ color: "#666", fontSize: "11px" }}>
                                Applies to icon, progress bar &amp; hover
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: "#2A1F1F", color: "#666", border: "1px solid #3A2A2A" }} onMouseEnter={(e) => {
            e.currentTarget.style.color = "#EEEEEE";
            e.currentTarget.style.borderColor = "#D84040";
        }} onMouseLeave={(e) => {
            e.currentTarget.style.color = "#666";
            e.currentTarget.style.borderColor = "#3A2A2A";
        }}>
                        <X size={14}/>
                    </button>
                </div>

                {/* Swatch grid */}
                <div className="px-5 pt-4 pb-2">
                    <p style={{
            color: "#555",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
        }} className="mb-3">
                        Presets
                    </p>
                    <div className="grid grid-cols-8 gap-2">
                        {COLOR_SWATCHES.map(({ hex: swHex, label }) => {
            const isActive = swHex.toLowerCase() === hex.toLowerCase();
            return (<button key={swHex} onClick={() => handleSwatchClick(swHex)} title={label} className="relative rounded-lg transition-all" style={{
                    width: "32px",
                    height: "32px",
                    background: swHex,
                    border: isActive
                        ? `2px solid #EEEEEE`
                        : `2px solid transparent`,
                    boxShadow: isActive
                        ? `0 0 0 1px ${hexToRgba(swHex, 0.6)}, 0 0 8px ${hexToRgba(swHex, 0.4)}`
                        : "none",
                    transform: isActive ? "scale(1.12)" : "scale(1)",
                }} onMouseEnter={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.transform = "scale(1.08)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                    }
                }} onMouseLeave={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.borderColor = "transparent";
                    }
                }}>
                                    {isActive && (<span className="absolute inset-0 flex items-center justify-center">
                                            <Check size={13} color={swHex === "#EEEEEE" ? "#1D1616" : "#fff"} strokeWidth={3}/>
                                        </span>)}
                                </button>);
        })}
                    </div>
                </div>

                {/* Custom hex input */}
                <div className="px-5 pt-3 pb-4">
                    <p style={{
            color: "#555",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
        }} className="mb-2">
                        Custom Hex
                    </p>
                    <div className="flex items-center gap-2">
                        {/* Live swatch */}
                        <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{
            background: hexError ? "#3A2A2A" : hex,
            border: "1px solid #3A2A2A",
            transition: "background 0.15s",
        }}/>
                        <div className="relative flex-1">
                            <input value={hexInput} onChange={(e) => handleHexChange(e.target.value)} placeholder="#D84040" maxLength={7} className="w-full px-3 py-2 rounded-lg outline-none" style={{
            background: "#1D1616",
            border: `1px solid ${hexError ? "#D84040" : "#3A2A2A"}`,
            color: "#EEEEEE",
            fontSize: "13px",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
        }} onFocus={(e) => (e.target.style.borderColor = hexError ? "#D84040" : "#666")} onBlur={(e) => (e.target.style.borderColor = hexError ? "#D84040" : "#3A2A2A")}/>
                        </div>
                    </div>
                    {hexError && (<p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">
                            Enter a valid hex color (e.g. #A1B2C3)
                        </p>)}
                </div>

                {/* Reset + Confirm */}
                <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #2A1F1F" }}>
                    <button onClick={() => handleSwatchClick(BRAND_RED)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all" style={{
            background: isDefault ? "rgba(216,64,64,0.12)" : "#2A1F1F",
            color: isDefault ? "#D84040" : "#666",
            border: `1px solid ${isDefault ? "rgba(216,64,64,0.3)" : "#3A2A2A"}`,
            fontSize: "12px",
        }} onMouseEnter={(e) => {
            e.currentTarget.style.color = "#D84040";
            e.currentTarget.style.borderColor =
                "rgba(216,64,64,0.4)";
        }} onMouseLeave={(e) => {
            if (!isDefault) {
                e.currentTarget.style.color = "#666";
                e.currentTarget.style.borderColor = "#3A2A2A";
            }
        }}>
                        <Droplets size={11}/>
                        {isDefault ? "Default" : "Reset to Default"}
                    </button>

                    <button onClick={handleConfirm} disabled={hexError || !isValid(hex)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all" style={{
            background: hexError || !isValid(hex) ? "#2A1F1F" : hex,
            color: hexError || !isValid(hex) ? "#555" : hex === "#EEEEEE" ? "#1D1616" : "#fff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: hexError || !isValid(hex) ? "not-allowed" : "pointer",
            boxShadow: !hexError && isValid(hex)
                ? `0 0 10px ${hexToRgba(hex, 0.35)}`
                : "none",
            transition: "background 0.15s, box-shadow 0.15s",
        }}>
                        <Check size={13}/>
                        Apply
                    </button>
                </div>
            </div>
        </div>);
}
// ─────────────────────────────────────────────────────────────────
// Icon Picker Modal
// ─────────────────────────────────────────────────────────────────
function IconPickerModal({ current, onSelect, onClose, }) {
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => ICON_OPTIONS.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())), [query]);
    return (<div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.72)", zIndex: 9999 }} onClick={onClose}>
            <div className="rounded-2xl overflow-hidden" style={{
            background: "#241C1C",
            border: "1px solid #2E2020",
            width: "520px",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
            background: "rgba(216,64,64,0.12)",
            border: "1px solid rgba(216,64,64,0.25)",
        }}>
                            <Palette size={15} color="#D84040"/>
                        </div>
                        <div>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>
                                Choose Category Icon
                            </p>
                            <p style={{ color: "#666", fontSize: "11px" }}>
                                {filtered.length} icons available
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: "#2A1F1F", color: "#666", border: "1px solid #3A2A2A" }} onMouseEnter={(e) => {
            e.currentTarget.style.color = "#EEEEEE";
            e.currentTarget.style.borderColor = "#D84040";
        }} onMouseLeave={(e) => {
            e.currentTarget.style.color = "#666";
            e.currentTarget.style.borderColor = "#3A2A2A";
        }}>
                        <X size={14}/>
                    </button>
                </div>

                <div className="px-5 py-3" style={{ borderBottom: "1px solid #2A1F1F" }}>
                    <div className="relative">
                        <Search size={13} color="#555" style={{
            position: "absolute",
            left: "11px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
        }}/>
                        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons…" className="w-full pl-8 pr-4 py-2 rounded-lg outline-none" style={{
            background: "#1D1616",
            border: "1px solid #3A2A2A",
            color: "#EEEEEE",
            fontSize: "13px",
        }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                    </div>
                </div>

                <div className="px-4 py-4 overflow-y-auto" style={{ flex: 1 }}>
                    {filtered.length === 0 ? (<div className="flex flex-col items-center py-10">
                            <Search size={28} color="#3A2A2A" className="mb-2"/>
                            <p style={{ color: "#666", fontSize: "13px" }}>
                                No icons match "{query}"
                            </p>
                        </div>) : (<div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                            {filtered.map(({ name, Icon }) => {
                const isActive = name === current;
                return (<button key={name} onClick={() => {
                        onSelect(name);
                        onClose();
                    }} className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all" style={{
                        background: isActive
                            ? "rgba(216,64,64,0.12)"
                            : "transparent",
                        border: `1px solid ${isActive ? "rgba(216,64,64,0.4)" : "transparent"}`,
                    }} onMouseEnter={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.background =
                                "#2A1F1F";
                            e.currentTarget.style.borderColor =
                                "#3A2A2A";
                        }
                    }} onMouseLeave={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.background =
                                "transparent";
                            e.currentTarget.style.borderColor =
                                "transparent";
                        }
                    }} title={name}>
                                        <Icon size={20} color={isActive ? "#D84040" : "#666"}/>
                                        <span style={{
                        color: isActive ? "#D84040" : "#555",
                        fontSize: "9px",
                        maxWidth: "52px",
                        textAlign: "center",
                        lineHeight: "1.2",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                        display: "block",
                        padding: "0 4px",
                    }}>
                                            {name}
                                        </span>
                                    </button>);
            })}
                        </div>)}
                </div>

                <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #2A1F1F" }}>
                    <span style={{ color: "#555", fontSize: "11px" }}>
                        Currently:{" "}
                        <span style={{ color: "#D84040" }}>{current}</span>
                    </span>
                    <button onClick={onClose} className="px-3 py-1.5 rounded-lg" style={{
            background: "#2A1F1F",
            color: "#888",
            fontSize: "12px",
            border: "1px solid #3A2A2A",
        }} onMouseEnter={(e) => {
            e.currentTarget.style.color = "#EEEEEE";
        }} onMouseLeave={(e) => {
            e.currentTarget.style.color = "#888";
        }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>);
}
// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────
export function CategoriesPage() {
    const navigate = useNavigate();
    const [cats, setCats] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetchApi('/categories'),
            fetchApi('/projects')
        ]).then(([catsData, projsData]) => {
            const mappedCats = catsData.map(c => ({
                id: c.slug,
                name: c.name,
                projectCount: 0
            }));
            setCats(mappedCats);
            setAllProjects(projsData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);
    const [iconOverrides, setIconOverrides] = useState({});
    const [colorOverrides, setColorOverrides] = useState({});
    const [iconPickerForId, setIconPickerForId] = useState(null);
    const [colorPickerForId, setColorPickerForId] = useState(null);
    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const handleDelete = (id, name, e) => {
        e.stopPropagation();
        setDeleteTarget({ id, name });
    };
    const confirmDelete = async () => {
        if (!deleteTarget)
            return;
        setIsDeleting(true);
        await new Promise((r) => setTimeout(r, 700));
        setCats((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setIsDeleting(false);
        setDeleteTarget(null);
    };
    const openIconPicker = (catId, e) => {
        e.stopPropagation();
        setIconPickerForId(catId);
    };
    const openColorPicker = (catId, e) => {
        e.stopPropagation();
        setColorPickerForId(catId);
    };
    const handleIconSelect = (name) => {
        if (iconPickerForId) {
            setIconOverrides((prev) => ({ ...prev, [iconPickerForId]: name }));
        }
        setIconPickerForId(null);
    };
    const handleColorSelect = (hex) => {
        if (colorPickerForId) {
            setColorOverrides((prev) => ({ ...prev, [colorPickerForId]: hex }));
        }
        setColorPickerForId(null);
    };
    // Helpers to resolve current values
    const getCatIconName = (cat) => iconOverrides[cat.id] ?? defaultIcons[cat.name] ?? "FolderOpen";
    const getCatColor = (cat) => colorOverrides[cat.id] ?? BRAND_RED;
    // Values for open pickers
    const iconPickerCat = cats.find((c) => c.id === iconPickerForId);
    const colorPickerCurrentHex = colorPickerForId
        ? getCatColor(cats.find((c) => c.id === colorPickerForId) || cats[0])
        : BRAND_RED;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }
    return (<div className="px-8 py-7">
            {/* ── Modals ── */}
            {iconPickerForId && iconPickerCat && (<IconPickerModal current={getCatIconName(iconPickerCat)} onSelect={handleIconSelect} onClose={() => setIconPickerForId(null)}/>)}
            {colorPickerForId && (<ColorPickerModal current={colorPickerCurrentHex} onSelect={handleColorSelect} onClose={() => setColorPickerForId(null)}/>)}
            <DeleteConfirmModal isOpen={deleteTarget !== null} itemType="category" itemName={deleteTarget?.name ?? ""} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting}/>

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Categories
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        Manage project categories and taxonomy
                    </p>
                </div>
                <button onClick={() => navigate("/admin/categories/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{
            background: "#D84040",
            color: "#EEEEEE",
            fontSize: "14px",
            fontWeight: 600,
        }} onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}>
                    <Plus size={16}/> New Category
                </button>
            </div>

            {/* ── Category Grid ── */}
            <div className="grid grid-cols-3 gap-4 mb-10">
                {cats.map((cat) => {
            const projectsInCat = allProjects.filter((p) => p.format === cat.name);
            const iconName = getCatIconName(cat);
            const IconEntry = ICON_OPTIONS.find((o) => o.name === iconName) ?? ICON_OPTIONS[0];
            const CatIcon = IconEntry.Icon;
            const catColor = getCatColor(cat);
            const catColorBg = hexToRgba(catColor, 0.12);
            const isCustomColor = colorOverrides[cat.id] != null && colorOverrides[cat.id] !== BRAND_RED;
            return (<div key={cat.id} onClick={() => navigate(`/admin/categories/${cat.id}`)} className="rounded-xl p-5 group relative cursor-pointer transition-all" style={{ background: "#241C1C", border: "1px solid #2E2020" }} onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = catColor;
                    e.currentTarget.style.transform =
                        "translateY(-1px)";
                }} onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2E2020";
                    e.currentTarget.style.transform = "translateY(0)";
                }}>
                            <div className="flex items-start justify-between mb-4">
                                {/* Icon box with "Edit Icon" pencil overlay */}
                                <div className="relative group/ico flex-shrink-0">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: catColorBg,
                    border: "1px solid #3A2A2A",
                }}>
                                        <CatIcon size={22} color={catColor}/>
                                    </div>
                                    {/* Pencil overlay — icon picker */}
                                    <button onClick={(e) => openIconPicker(cat.id, e)} className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover/ico:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.65)" }} title="Change icon">
                                        <Pencil size={13} color="#EEEEEE"/>
                                    </button>
                                    {/* Small pencil badge */}
                                    <button onClick={(e) => openIconPicker(cat.id, e)} className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full items-center justify-center hidden group-hover/ico:flex" style={{
                    background: catColor,
                    border: "2px solid #241C1C",
                }} title="Change icon">
                                        <Pencil size={7} color="#fff"/>
                                    </button>
                                </div>

                                {/* Top-right action buttons */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* ── Color Picker button ── */}
                                    <button onClick={(e) => openColorPicker(cat.id, e)} className="w-7 h-7 rounded flex items-center justify-center transition-all relative" style={{ background: "#2A1F1F", color: "#888" }} title="Change Color" onMouseEnter={(e) => (e.currentTarget.style.color = catColor)} onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}>
                                        {/* Tiny color dot to hint at current override */}
                                        {isCustomColor && (<span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{
                        background: catColor,
                        border: "1px solid #2A1F1F",
                    }}/>)}
                                        <Droplets size={12}/>
                                    </button>

                                    {/* Delete button */}
                                    <button onClick={(e) => handleDelete(cat.id, cat.name, e)} className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2A1F1F", color: "#888" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#D84040")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}>
                                        <Trash2 size={13}/>
                                    </button>
                                </div>
                            </div>

                            <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }} className="mb-1">
                                {cat.name}
                            </h3>
                            <div className="flex items-center justify-between">
                                <p style={{ color: "#888", fontSize: "13px" }}>
                                    {projectsInCat.length || cat.projectCount} project
                                    {(projectsInCat.length || cat.projectCount) !== 1 ? "s" : ""}
                                </p>
                                <ChevronRight size={14} color="#444" className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                            </div>

                            {/* Progress bar — uses per-category color */}
                            <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                                <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(((projectsInCat.length || cat.projectCount) / 10) * 100, 100)}%`,
                    background: `linear-gradient(to right, ${hexToRgba(catColor, 0.6)}, ${catColor})`,
                }}/>
                            </div>
                        </div>);
        })}
            </div>

            {/* ── Category Table ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                    <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>
                        All Categories
                    </h3>
                </div>
                <table className="w-full">
                    <thead>
                        <tr style={{ borderBottom: "1px solid #2A1F1F" }}>
                            {["Category Name", "Projects", "Status", "Actions"].map((h) => (<th key={h} className="px-5 py-3 text-left" style={{
                color: "#666",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
            }}>
                                    {h}
                                </th>))}
                        </tr>
                    </thead>
                    <tbody>
                        {cats.map((cat, i) => {
            const iconName = getCatIconName(cat);
            const IconEntry = ICON_OPTIONS.find((o) => o.name === iconName) ?? ICON_OPTIONS[0];
            const RowIcon = IconEntry.Icon;
            const catColor = getCatColor(cat);
            return (<tr key={cat.id} onClick={() => navigate(`/admin/categories/${cat.id}`)} className="cursor-pointer transition-colors" style={{
                    borderBottom: i < cats.length - 1 ? "1px solid #2A1F1F" : "none",
                }} onMouseEnter={(e) => (e.currentTarget.style.background =
                    "#2A1F1F")} onMouseLeave={(e) => (e.currentTarget.style.background =
                    "transparent")}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <RowIcon size={15} color={catColor}/>
                                            <span style={{
                    color: "#EEEEEE",
                    fontSize: "13px",
                    fontWeight: 500,
                }}>
                                                {cat.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span style={{ color: "#999", fontSize: "13px" }}>
                                            {cat.projectCount}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="px-2 py-0.5 rounded-full" style={{
                    background: hexToRgba(catColor, 0.12),
                    color: catColor,
                    fontSize: "11px",
                }}>
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {/* Color picker in table row */}
                                            <button onClick={(e) => openColorPicker(cat.id, e)} className="w-7 h-7 rounded flex items-center justify-center transition-all" style={{
                    background: "#2A1F1F",
                    color: "#666",
                    border: "1px solid #3A2A2A",
                }} title="Change Color" onMouseEnter={(e) => {
                    e.currentTarget.style.color =
                        catColor;
                    e.currentTarget.style.borderColor =
                        catColor;
                }} onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#666";
                    e.currentTarget.style.borderColor =
                        "#3A2A2A";
                }}>
                                                <Droplets size={12}/>
                                            </button>

                                            <button onClick={() => navigate(`/admin/categories/${cat.id}`)} style={{ color: "#666" }} className="hover:text-red-400">
                                                <MoreHorizontal size={16}/>
                                            </button>
                                            <ChevronRight size={13} color="#444"/>
                                        </div>
                                    </td>
                                </tr>);
        })}
                    </tbody>
                </table>
            </div>
        </div>);
}
