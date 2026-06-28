import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { auth } from "../../shared/config/firebase";
import { fetchApi } from "../admin/utils/apiClient";

export function PendingApprovalPage() {
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const checkStatus = async () => {
        if (!auth.currentUser) return;
        setIsRefreshing(true);
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            const response = await fetchApi<{ access_token: string, user: { role: string } }>("/auth/firebase", {
                method: "POST",
                body: JSON.stringify({ 
                    id_token: idToken,
                    display_name: auth.currentUser.displayName,
                    photo_url: auth.currentUser.photoURL
                }),
            });
            
            const newRole = response.user.role;
            localStorage.setItem("token", response.access_token);
            localStorage.setItem("role", newRole);
            
            if (newRole !== "pending") {
                if (newRole === "client") navigate("/client");
                else if (newRole === "crew" || newRole === "editor") navigate("/crew");
                else navigate("/admin");
            }
        } catch (error) {
            console.error("Error checking status:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        // Automatically check status when component mounts
        const timeout = setTimeout(() => {
            checkStatus();
        }, 1000);
        return () => clearTimeout(timeout);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#0A0707] flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ color: "#EEEEEE" }}>
            {/* Ambient Background */}
            <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-[#D84040]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-[#8E1616]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="z-10 bg-[#1D1616]/60 border border-[#2E2020] rounded-2xl p-10 max-w-md w-full text-center backdrop-blur-xl shadow-2xl">
                <div className="w-20 h-20 bg-[#D84040]/10 border border-[#D84040]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock size={36} className="text-[#D84040]" />
                </div>
                <h1 className="text-2xl font-bold mb-3" style={{ color: "#EEEEEE" }}>Tài khoản đang chờ duyệt</h1>
                <p className="text-[#888] text-sm leading-relaxed mb-8">
                    Tài khoản của bạn đã được khởi tạo thành công nhưng chưa được cấp quyền truy cập. Vui lòng đợi quản trị viên phê duyệt vai trò của bạn trước khi tiếp tục.
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={checkStatus}
                        disabled={isRefreshing}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold transition-all relative overflow-hidden group"
                        style={{ background: "#D84040", color: "#EEEEEE" }}
                    >
                        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                        {isRefreshing ? "Đang kiểm tra..." : "Kiểm tra lại trạng thái"}
                    </button>

                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold transition-all hover:bg-[#2A1F1F]"
                        style={{ background: "#241C1C", color: "#888", border: "1px solid #3A2A2A" }}
                    >
                        <LogOut size={18} />
                        Quay lại trang Đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
}
