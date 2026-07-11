import { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Plus, Loader2, User, Building2, Phone, Mail } from "lucide-react";
import { fetchApi } from "../utils/apiClient";

interface FormData {
    name: string;
    contact: string;
    phone: string;
    email: string;
}

interface Props {
    onClose: () => void;
    onAdd?: (client: any) => void;
}

export function AddClientModal({ onClose, onAdd }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        try {
            const slug = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            
            const payload = {
                name: data.name,
                slug,
                contact: data.contact || null,
                phone: data.phone || null,
                email: data.email || null,
                status: "Lead"
            };

            const newClient = await fetchApi("/projects/clients", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            setSuccess(true);
            onAdd?.(newClient);
            setTimeout(onClose, 1000);
        } catch (error) {
            console.error("Error creating client:", error);
            alert("Lỗi khi tạo Client (có thể trùng tên).");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: "#1D1616", border: "1px solid #3A2A2A" }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: "1px solid #2A1F1F" }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(216, 64, 64, 0.15)" }}
                        >
                            <Building2 size={16} color="#D84040" />
                        </div>
                        <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>
                            Thêm Client mới
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:bg-white/5"
                        style={{ color: "#888" }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(76, 175, 80, 0.15)" }}>
                                <CheckCircle2 size={32} color="#4CAF50" />
                            </div>
                            <h3 style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }} className="mb-2">Thành công!</h3>
                            <p style={{ color: "#888", fontSize: "14px" }}>Đã thêm client mới thành công.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="flex items-center gap-2 mb-1.5">
                                    <Building2 size={14} color="#D84040"/> Tên Client / Doanh nghiệp *
                                </label>
                                <input
                                    {...register("name", { required: "Tên Client là bắt buộc" })}
                                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                                    style={{
                                        background: "#151010",
                                        border: `1px solid ${errors.name ? "#D84040" : "#3A2A2A"}`,
                                        color: "#EEEEEE",
                                        fontSize: "14px",
                                    }}
                                    placeholder="Ví dụ: 204PROD."
                                />
                                {errors.name && (
                                    <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="flex items-center gap-2 mb-1.5">
                                    <User size={14} color="#D84040"/> Người đại diện <span style={{ color: "#888", fontWeight: 400 }}>(Tùy chọn)</span>
                                </label>
                                <input
                                    {...register("contact")}
                                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                                    style={{ background: "#151010", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "14px" }}
                                    placeholder="Tên người đại diện"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="flex items-center gap-2 mb-1.5">
                                        <Phone size={14} color="#D84040"/> Số điện thoại <span style={{ color: "#888", fontWeight: 400 }}>(Tùy chọn)</span>
                                    </label>
                                    <input
                                        {...register("phone")}
                                        className="w-full px-3 py-2.5 rounded-lg outline-none"
                                        style={{ background: "#151010", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "14px" }}
                                        placeholder="Số điện thoại"
                                    />
                                </div>
                                <div>
                                    <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="flex items-center gap-2 mb-1.5">
                                        <Mail size={14} color="#D84040"/> Email <span style={{ color: "#888", fontWeight: 400 }}>(Tùy chọn)</span>
                                    </label>
                                    <input
                                        {...register("email")}
                                        className="w-full px-3 py-2.5 rounded-lg outline-none"
                                        style={{ background: "#151010", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "14px" }}
                                        placeholder="Email liên hệ"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-lg font-medium transition-colors"
                                    style={{ background: "#2A1F1F", color: "#EEEEEE", border: "1px solid #3A2A2A" }}
                                >
                                    Huỷ bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-lg font-medium transition-opacity flex justify-center items-center gap-2"
                                    style={{ background: "#D84040", color: "#FFFFFF" }}
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : "Thêm Client"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
