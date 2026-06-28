// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Plus, X, Search, Check, Briefcase, Palette, Camera, Film, 
    Megaphone, Layers, Sliders, DollarSign, Loader2, Award, 
    Users, ShieldCheck, Tag, Pencil, CheckCircle2, TrendingDown, 
    FileText, HelpCircle, User, Zap, Sparkles, Trash2
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

const BRAND_RED = "#D84040";

const COLOR_SWATCHES = [
    { hex: "#D84040", label: "Red" },
    { hex: "#E91E63", label: "Pink" },
    { hex: "#9B59B6", label: "Purple" },
    { hex: "#3498DB", label: "Blue" },
    { hex: "#00BCD4", label: "Cyan" },
    { hex: "#1ABC9C", label: "Teal" },
    { hex: "#4CAF50", label: "Green" },
    { hex: "#E8A838", label: "Amber" },
    { hex: "#E67E22", label: "Orange" },
    { hex: "#FF5722", label: "Deep Orange" },
    { hex: "#FFD700", label: "Gold" },
    { hex: "#6B8FD6", label: "Steel Blue" },
    { hex: "#607D8B", label: "Slate" },
];

const DEFAULT_CATEGORIES = [
    // Projects Tab
    { name: "TVC", slug: "tvc", type: "project_type", color: "#D84040", description: "Television Commercial" },
    { name: "MV Ca nhạc", slug: "mv-ca-nhac", type: "project_type", color: "#E91E63", description: "Music Video" },
    { name: "Corporate Video", slug: "corporate-video", type: "project_type", color: "#3498DB", description: "Phim doanh nghiệp" },
    { name: "Chụp ảnh", slug: "chup-anh", type: "project_type", color: "#4CAF50", description: "Photography" },
    { name: "Retainer", slug: "retainer", type: "project_type", color: "#9B59B6", description: "Quản lý kênh hàng tháng" },
    
    { name: "Gói quay 1 ngày", slug: "goi-quay-1-ngay", type: "service_rate_card", color: "#FF5722", description: "Dịch vụ quay phim theo ngày" },
    { name: "Gói thiết kế Key Visual", slug: "goi-thiet-ke-kv", type: "service_rate_card", color: "#00BCD4", description: "Thiết kế Key Visual" },
    { name: "Phí quản lý chiến dịch", slug: "phi-quan-ly-chien-dich", type: "service_rate_card", color: "#E67E22", description: "Campaign management fee" },

    // Clients Tab
    { name: "F&B", slug: "fb", type: "client_industry", color: "#4CAF50", description: "Ngành ẩm thực & ăn uống" },
    { name: "Thời trang", slug: "thoi-trang", type: "client_industry", color: "#E91E63", description: "Ngành thời trang" },
    { name: "Mỹ phẩm", slug: "my-pham", type: "client_industry", color: "#9B59B6", description: "Ngành mỹ phẩm & làm đẹp" },
    { name: "Bất động sản", slug: "bat-dong-san", type: "client_industry", color: "#E8A838", description: "Ngành bất động sản" },
    { name: "Công nghệ", slug: "cong-nghe", type: "client_industry", color: "#3498DB", description: "Ngành công nghệ & phần mềm" },

    { name: "VIP", slug: "vip", type: "client_tier", color: "#FFD700", description: "Khách hàng chi tiêu cao, ưu tiên nguồn lực" },
    { name: "SME", slug: "sme", type: "client_tier", color: "#6B8FD6", description: "Doanh nghiệp nhỏ và vừa" },
    { name: "Partner", slug: "partner", type: "client_tier", color: "#1ABC9C", description: "Đối tác chiến lược" },

    // Finance Tab
    { name: "Tiền thuê văn phòng", slug: "tien-thue-van-phong", type: "finance_opex", color: "#E67E22", description: "Chi phí văn phòng hàng tháng" },
    { name: "Phần mềm", slug: "phan-mem", type: "finance_opex", color: "#3498DB", description: "Phí bản quyền các phần mềm" },
    { name: "Điện / Nước", slug: "dien-nuoc", type: "finance_opex", color: "#00BCD4", description: "Chi phí điện nước sinh hoạt" },
    { name: "Lương cứng", slug: "luong-cung", type: "finance_opex", color: "#9B59B6", description: "Chi trả lương nhân viên cố định" },

    { name: "Tiền thuê Studio", slug: "tien-thue-studio", type: "finance_cogs", color: "#FF5722", description: "Chi phí thuê trường quay" },
    { name: "Thuê máy quay", slug: "thue-may-quay", type: "finance_cogs", color: "#E8A838", description: "Thiết bị ghi hình ghi âm" },
    { name: "Cát-xê diễn viên", slug: "cat-xe-dien-vien", type: "finance_cogs", color: "#E91E63", description: "Chi phí nhân sự diễn viên, talent" },
    { name: "Chi phí đi lại", slug: "chi-phi-di-lai", type: "finance_cogs", color: "#607D8B", description: "Chi phí vận chuyển, công tác" },

    { name: "Tiền mặt", slug: "tien-mat", type: "payment_method", color: "#4CAF50", description: "Thanh toán trực tiếp bằng tiền mặt" },
    { name: "Chuyển khoản ngân hàng", slug: "chuyen-khoan", type: "payment_method", color: "#3498DB", description: "Thanh toán bằng chuyển khoản" },
    { name: "Thẻ tín dụng doanh nghiệp", slug: "credit-card", type: "payment_method", color: "#9B59B6", description: "Thẻ thanh toán của công ty" },

    // HR Tab
    { name: "Đạo diễn (Director)", slug: "role-director", type: "hr_role", color: "#D84040", description: "Đạo diễn nghệ thuật" },
    { name: "Quay phim (Camop)", slug: "role-camop", type: "hr_role", color: "#E8A838", description: "Camera operator" },
    { name: "Dựng phim (Editor)", slug: "role-editor", type: "hr_role", color: "#3498DB", description: "Video editor" },
    { name: "Diễn viên (Talent)", slug: "role-talent", type: "hr_role", color: "#E91E63", description: "Diễn viên, mẫu ảnh, voice" },
    { name: "Makeup", slug: "role-makeup", type: "hr_role", color: "#9B59B6", description: "Trang điểm chuyên nghiệp" },
    { name: "Stylist", slug: "role-stylist", type: "hr_role", color: "#1ABC9C", description: "Định hình phong cách thời trang" },

    { name: "Premiere Pro", slug: "skill-premiere", type: "hr_skill", color: "#9B59B6", description: "Kỹ năng dựng phim Adobe Premiere" },
    { name: "After Effects", slug: "skill-ae", type: "hr_skill", color: "#3498DB", description: "Kỹ năng kỹ xảo hình ảnh" },
    { name: "DaVinci Resolve", slug: "skill-davinci", type: "hr_skill", color: "#4CAF50", description: "Kỹ năng chỉnh màu chuyên nghiệp" },
    { name: "3D Blender", slug: "skill-blender", type: "hr_skill", color: "#FF5722", description: "Kỹ năng thiết kế hoạt cảnh 3D" },
];

function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function parseCategoryMetadata(cat) {
    let color = "#D84040"; 
    let disabled = false;
    let descText = cat.description || "";

    if (cat.description) {
        try {
            const trimmed = cat.description.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                const parsed = JSON.parse(trimmed);
                color = parsed.color || color;
                disabled = !!parsed.disabled;
                descText = parsed.text || "";
            }
        } catch (e) {
            // Not JSON
        }
    }
    
    if (!cat.description || !cat.description.trim().startsWith("{")) {
        const hash = cat.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = ["#E91E63", "#FF5722", "#E8A838", "#4CAF50", "#1ABC9C", "#3498DB", "#9B59B6", "#6B8FD6"];
        color = colors[hash % colors.length];
    }
    
    return { color, disabled, text: descText };
}

const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};

export function CategoriesPage() {
    const navigate = useNavigate();
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("projects");
    
    // UI Forms / Control States
    const [isAddingSection, setIsAddingSection] = useState(null); // stores section type string
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [selectedColor, setSelectedColor] = useState("#D84040");

    const [editingCat, setEditingCat] = useState(null); // stores category object with temp edits
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        fetchApi("/categories")
            .then(data => {
                if (Array.isArray(data)) {
                    setCats(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSaveNewCategory = async (type) => {
        if (!newName.trim()) return;
        
        const slug = newName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
            
        const metadataString = JSON.stringify({
            color: selectedColor,
            disabled: false,
            text: newDesc.trim()
        });

        try {
            const payload = {
                name: newName.trim(),
                slug,
                type,
                description: metadataString
            };
            
            await fetchApi("/categories", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            
            // Refresh categories
            const catsData = await fetchApi('/categories');
            setCats(catsData);
            setIsAddingSection(null);
            setNewName("");
            setNewDesc("");
        } catch (err) {
            console.error("Failed to save new category:", err);
            alert(err instanceof Error ? err.message : "Failed to add category.");
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCat || !editingCat.name.trim()) return;
        
        const metadataString = JSON.stringify({
            color: editingCat.metaColor,
            disabled: !!editingCat.metaDisabled,
            text: editingCat.metaText.trim()
        });

        try {
            const payload = {
                name: editingCat.name.trim(),
                slug: editingCat.slug,
                type: editingCat.type,
                description: metadataString
            };
            
            await fetchApi(`/categories/${editingCat.slug}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            
            // Refresh categories
            const catsData = await fetchApi('/categories');
            setCats(catsData);
            setEditingCat(null);
        } catch (err) {
            console.error("Failed to update category:", err);
            alert(err instanceof Error ? err.message : "Failed to update category.");
        }
    };

    const handleToggleDisabled = async (cat, currentDisabled, color, text) => {
        const metadataString = JSON.stringify({
            color,
            disabled: !currentDisabled,
            text
        });

        try {
            const payload = {
                name: cat.name,
                slug: cat.slug,
                type: cat.type,
                description: metadataString
            };
            
            await fetchApi(`/categories/${cat.slug}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            
            // Refresh categories
            const catsData = await fetchApi('/categories');
            setCats(catsData);
        } catch (err) {
            console.error("Failed to toggle category disabled status:", err);
            alert(err instanceof Error ? err.message : "Failed to toggle status.");
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${cat.name}"?`)) return;

        try {
            await fetchApi(`/categories/${cat.slug}`, {
                method: "DELETE"
            });
            
            // Refresh categories
            const catsData = await fetchApi('/categories');
            setCats(catsData);
        } catch (err) {
            console.error("Failed to delete category:", err);
            alert(err instanceof Error ? err.message : "Không thể xóa danh mục này.");
        }
    };

    const seedDefaultCategories = async () => {
        setSeeding(true);
        let successCount = 0;
        try {
            for (const item of DEFAULT_CATEGORIES) {
                const exists = cats.some(c => c.slug === item.slug);
                if (!exists) {
                    const metadataString = JSON.stringify({
                        color: item.color,
                        disabled: false,
                        text: item.description
                    });
                    
                    await fetchApi("/categories", {
                        method: "POST",
                        body: JSON.stringify({
                            name: item.name,
                            slug: item.slug,
                            type: item.type,
                            description: metadataString
                        })
                    });
                    successCount++;
                }
            }
            
            if (successCount > 0) {
                const catsData = await fetchApi('/categories');
                setCats(catsData);
                alert(`Đã khởi tạo thành công ${successCount} danh mục mẫu!`);
            } else {
                alert("Tất cả danh mục mẫu đã tồn tại trong hệ thống.");
            }
        } catch (err) {
            console.error("Failed to seed default categories:", err);
            alert("Gặp lỗi trong quá trình khởi tạo dữ liệu mẫu.");
        } finally {
            setSeeding(false);
        }
    };

    const tabs = [
        { id: "projects", label: "Dự án & Dịch vụ", icon: Briefcase },
        { id: "clients", label: "Phân nhóm Khách hàng", icon: Users },
        { id: "finance", label: "Tài chính", icon: DollarSign },
        { id: "hr", label: "Chuyên môn Nhân sự", icon: Layers },
    ];

    function renderSection(title, type, icon) {
        const sectionCats = cats.filter(c => {
            if (type === "project_type") {
                return c.type === "project_type" || c.type === "format";
            }
            return c.type === type;
        });

        return (
            <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-2 border-b border-[#2A1F1F] pb-2">
                    {icon}
                    <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>{title}</h3>
                    <span className="text-xs text-gray-500 ml-auto">{sectionCats.length} tags</span>
                </div>

                <div className="flex flex-wrap gap-2.5 py-1">
                    {sectionCats.map(cat => {
                        const { color, disabled, text } = parseCategoryMetadata(cat);
                        
                        return (
                            <div 
                                key={cat.slug} 
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all relative group ${
                                    (type === "project_type" || type === "format") && !disabled ? "cursor-pointer hover:border-white/50" : "cursor-default"
                                }`}
                                style={{ 
                                    borderColor: disabled ? "rgba(80,80,80,0.3)" : color,
                                    background: disabled ? "rgba(40,40,40,0.15)" : hexToRgba(color, 0.08),
                                    opacity: disabled ? 0.55 : 1,
                                }}
                                onClick={(e) => {
                                    if ((type === "project_type" || type === "format") && !disabled) {
                                        if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
                                            navigate(`/admin/categories/${cat.slug}`);
                                        }
                                    }
                                }}
                            >
                                {/* Color dot status indicator */}
                                <div className="w-2 h-2 rounded-full" style={{ background: disabled ? "#555" : color, boxShadow: disabled ? "none" : `0 0 10px ${color}` }} />
                                
                                <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                                    {cat.name}
                                </span>

                                {text && (
                                    <span className="text-[10px] text-gray-500 max-w-[150px] truncate ml-0.5" title={text}>
                                        ({text})
                                    </span>
                                )}

                                {/* Hover actions slider */}
                                <div className="hidden group-hover:flex items-center gap-1.5 ml-2 pl-2 border-l border-white/10">
                                    <button 
                                        onClick={() => setEditingCat({ ...cat, metaColor: color, metaText: text, metaDisabled: disabled })} 
                                        className="p-0.5 rounded text-gray-500 hover:text-white transition-colors"
                                        title="Sửa"
                                    >
                                        <Pencil size={11} />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleDisabled(cat, disabled, color, text)} 
                                        className="p-0.5 rounded text-gray-500 hover:text-[#D84040] transition-colors"
                                        title={disabled ? "Kích hoạt" : "Vô hiệu hóa"}
                                    >
                                        {disabled ? <CheckCircle2 size={11} /> : <X size={11} />}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCategory(cat)} 
                                        className="p-0.5 rounded text-gray-500 hover:text-[#D84040] transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {sectionCats.length === 0 && (
                        <p className="text-xs text-gray-600 italic py-2">Chưa có danh mục nào trong nhóm này</p>
                    )}
                </div>

                {/* Inline Add Panel */}
                {isAddingSection === type ? (
                    <div className="p-4 rounded-xl border border-[#3A2A2A] space-y-3" style={{ background: "rgba(29, 22, 22, 0.4)" }}>
                        <p className="text-[11px] font-semibold uppercase text-white/50">Tạo mới hạng mục</p>
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                placeholder="Tên danh mục (Ví dụ: TVC)" 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)}
                                className="px-2.5 py-1.5 rounded outline-none" 
                                style={{ ...inputStyle, fontSize: "12px" }}
                            />
                            <input 
                                placeholder="Mô tả chi tiết" 
                                value={newDesc} 
                                onChange={(e) => setNewDesc(e.target.value)}
                                className="px-2.5 py-1.5 rounded outline-none" 
                                style={{ ...inputStyle, fontSize: "12px" }}
                            />
                        </div>
                        
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase mb-1.5">Màu sắc hiển thị</p>
                            <div className="flex gap-1.5 flex-wrap">
                                {COLOR_SWATCHES.map(s => (
                                    <button
                                        type="button"
                                        key={s.hex}
                                        onClick={() => setSelectedColor(s.hex)}
                                        style={{ 
                                            background: s.hex,
                                            transform: selectedColor === s.hex ? "scale(1.15)" : "scale(1)",
                                            border: selectedColor === s.hex ? "2px solid #fff" : "1px solid transparent"
                                        }}
                                        className="w-5 h-5 rounded-full transition-transform"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                            <button 
                                type="button"
                                onClick={() => setIsAddingSection(null)} 
                                className="text-xs text-gray-500 hover:text-white px-2 py-1"
                            >
                                Hủy
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleSaveNewCategory(type)} 
                                className="text-xs text-white bg-[#D84040] hover:bg-[#c03030] px-3.5 py-1.5 rounded font-semibold"
                            >
                                Thêm mới
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        type="button"
                        onClick={() => { setIsAddingSection(type); setNewName(""); setNewDesc(""); setSelectedColor("#D84040"); }} 
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D84040] border border-dashed border-[#3A2A2A] rounded-full px-4 py-1.5 mt-1 transition-all"
                    >
                        <Plus size={12} /> Thêm hạng mục
                    </button>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    return (
        <div className="px-8 py-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Categories
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        Thiết lập tùy chọn và quy hoạch dữ liệu hệ thống Media Agency
                    </p>
                </div>
                <button 
                    onClick={seedDefaultCategories} 
                    disabled={seeding}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#3A2A2A] transition-all"
                    style={{ background: seeding ? "rgba(36,28,28,0.2)" : "rgba(36, 28, 28, 0.4)", color: "#EEEEEE", fontSize: "13px" }}
                    onMouseEnter={(e) => { if(!seeding) e.currentTarget.style.borderColor = BRAND_RED; }}
                    onMouseLeave={(e) => { if(!seeding) e.currentTarget.style.borderColor = "#3A2A2A"; }}
                >
                    {seeding ? (
                        <><Loader2 size={14} className="animate-spin"/> Đang khởi tạo...</>
                    ) : (
                        <><Sparkles size={14} color="#E8A838"/> Khởi tạo dữ liệu mẫu</>
                    )}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-[#2A1F1F] mb-6">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => { setActiveTab(t.id); setIsAddingSection(null); }}
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

            {/* Tab Body */}
            <div className="space-y-6">
                {activeTab === "projects" && (
                    <>
                        {renderSection("Loại hình Dự án (Project Types)", "project_type", <Film size={15} color="#D84040"/>)}
                        {renderSection("Gói Dịch vụ & Báo giá gốc (Service Rate Cards)", "service_rate_card", <FileText size={15} color="#FF5722"/>)}
                    </>
                )}

                {activeTab === "clients" && (
                    <>
                        {renderSection("Ngành hàng (Industries)", "client_industry", <Briefcase size={15} color="#4CAF50"/>)}
                        {renderSection("Cấp độ Khách hàng (Client Tiers)", "client_tier", <Award size={15} color="#FFD700"/>)}
                    </>
                )}

                {activeTab === "finance" && (
                    <>
                        {renderSection("Nhóm Chi phí Vận hành (OPEX)", "finance_opex", <TrendingDown size={15} color="#E67E22"/>)}
                        {renderSection("Nhóm Chi phí Sản xuất (COGS)", "finance_cogs", <Camera size={15} color="#FF5722"/>)}
                        {renderSection("Phương thức Thanh toán", "payment_method", <DollarSign size={15} color="#4CAF50"/>)}
                    </>
                )}

                {activeTab === "hr" && (
                    <>
                        {renderSection("Vị trí chuyên môn (Roles)", "hr_role", <Users size={15} color="#3498DB"/>)}
                        {renderSection("Kỹ năng (Skills / Tags)", "hr_skill", <Zap size={15} color="#FF5722"/>)}
                    </>
                )}
            </div>

            {/* Editing Overlay Modal */}
            {editingCat && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#241C1C] border border-[#3A2A2A] rounded-xl p-5 w-80 shadow-2xl space-y-4">
                        <div>
                            <h3 className="text-[#EEEEEE] font-semibold text-sm">Chỉnh sửa danh mục</h3>
                            <p style={{ color: "#666", fontSize: "11px" }}>slug: {editingCat.slug}</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Tên hiển thị</label>
                                <input 
                                    value={editingCat.name} 
                                    onChange={(e) => setEditingCat(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 rounded outline-none"
                                    style={{ ...inputStyle, fontSize: "12px" }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Mô tả</label>
                                <input 
                                    value={editingCat.metaText} 
                                    onChange={(e) => setEditingCat(prev => ({ ...prev, metaText: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 rounded outline-none"
                                    style={{ ...inputStyle, fontSize: "12px" }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Màu sắc hiển thị</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {COLOR_SWATCHES.map(s => (
                                        <button
                                            type="button"
                                            key={s.hex}
                                            onClick={() => setEditingCat(prev => ({ ...prev, metaColor: s.hex }))}
                                            style={{ 
                                                background: s.hex,
                                                transform: editingCat.metaColor === s.hex ? "scale(1.15)" : "scale(1)",
                                                border: editingCat.metaColor === s.hex ? "2px solid #fff" : "1px solid transparent"
                                            }}
                                            className="w-5 h-5 rounded-full transition-transform"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button 
                                type="button"
                                onClick={() => setEditingCat(null)} 
                                className="text-xs text-gray-500 hover:text-white px-3 py-1.5"
                            >
                                Hủy
                            </button>
                            <button 
                                type="button"
                                onClick={handleUpdateCategory} 
                                className="text-xs text-white bg-[#D84040] hover:bg-[#c03030] px-4 py-1.5 rounded font-semibold"
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
