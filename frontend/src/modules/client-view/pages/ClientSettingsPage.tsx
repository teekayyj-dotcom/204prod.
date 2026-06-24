import { Settings, Shield, Bell, Eye } from "lucide-react";

export function ClientSettingsPage() {
    return (
        <div className="p-8 space-y-8" style={{ color: "#EEEEEE" }}>
            {/* Header */}
            <div className="flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#D8404022", border: "1px solid #D8404044" }}
                >
                    <Settings size={22} style={{ color: "#D84040" }} />
                </div>
                <div>
                    <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>CLIENT</p>
                    <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Cài đặt</h1>
                </div>
            </div>

            {/* Content settings */}
            <div className="rounded-xl overflow-hidden max-w-2xl backdrop-blur-md" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}>
                {[
                    { icon: Bell, label: "Thông báo dự án", sub: "Nhận cập nhật về các mốc nghiệm thu và đề xuất mới qua email.", on: true },
                    { icon: Shield, label: "Bảo mật tài khoản", sub: "Đổi mật khẩu và quản lý thiết bị truy cập cổng đối tác.", on: false },
                    { icon: Eye, label: "Quyền xem dự án", sub: "Xem danh sách nhân sự được cấp quyền theo dõi tiến độ.", on: true },
                ].map((item, i, arr) => (
                    <div
                        key={item.label}
                        className="flex items-center gap-4 px-6 py-5"
                        style={{ borderBottom: i < arr.length - 1 ? "1px solid #2A1F1F" : "none" }}
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#2A1F1F" }}>
                            <item.icon size={15} style={{ color: item.on ? "#D84040" : "#555" }} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm">{item.label}</h3>
                            <p className="text-xs mt-1" style={{ color: "#555" }}>{item.sub}</p>
                        </div>
                        <button
                            className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                            style={{ background: item.on ? "#D84040" : "#2A1F1F" }}
                        >
                            <div
                                className="absolute top-0.5 w-4 h-4 rounded-full transition-all bg-white"
                                style={{ left: item.on ? "calc(100% - 18px)" : "2px" }}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
