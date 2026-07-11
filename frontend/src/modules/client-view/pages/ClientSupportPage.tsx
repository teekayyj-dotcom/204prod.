import { useState } from "react";
import { Headphones, Mail, Phone, MessageSquare, Send, CheckCircle } from "lucide-react";

export function ClientSupportPage() {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setSubject("");
            setMessage("");
        }, 5000);
    };

    return (
        <div className="p-8 space-y-8" style={{ color: "#EEEEEE" }}>
            {/* Header */}
            <div className="flex items-center gap-4">
                <div>
                    <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>CLIENT PORTAL</p>
                    <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Hỗ trợ & Liên hệ</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div
                    className="lg:col-span-1 rounded-xl p-6 border border-[#2E2020]/60 flex flex-col items-center justify-between text-center backdrop-blur-md"
                    style={{ background: "rgba(29, 22, 22, 0.4)" }}
                >
                    <div className="space-y-4 w-full">
                        <p style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                            Account Manager của bạn
                        </p>
                        
                        {/* Avatar */}
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="w-full h-full rounded-full flex items-center justify-center bg-[#8E1616] text-white text-3xl font-bold border-2 border-[#D84040]">
                                SK
                            </div>
                            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#4CAF50] border-2 border-[#1C1616]" title="Đang trực tuyến" />
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-gray-200">Sarah Kim</h3>
                            <p className="text-xs text-[#D84040] mt-0.5">Account Manager / Project Lead</p>
                        </div>

                        <div className="p-4 rounded-lg bg-[#241C1C]/40 border border-[#2E2020]/50 text-xs text-gray-400 leading-relaxed text-left backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                            "Chào bạn! Mình là Sarah Kim, phụ trách quản lý dự án và các vấn đề nghiệm thu của bạn tại 204 Production. Hãy để lại tin nhắn hoặc gọi điện trực tiếp nếu bạn cần trợ giúp nhé!"
                        </div>
                    </div>

                    <div className="w-full space-y-2.5 mt-6 pt-6 border-t border-[#2E2020]/60 text-left text-xs text-gray-400">
                        <a
                            href="mailto:sarah.kim@204prod.io"
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-[#241C1C]/40 border border-[#2E2020]/50 transition-colors hover:text-white hover:border-[#D84040]/70 backdrop-blur-sm"
                        >
                            <Mail size={14} className="text-[#D84040]" />
                            <span>sarah.kim@204prod.io</span>
                        </a>
                        <a
                            href="tel:0909204204"
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-[#241C1C]/40 border border-[#2E2020]/50 transition-colors hover:text-white hover:border-[#D84040]/70 backdrop-blur-sm"
                        >
                            <Phone size={14} className="text-[#D84040]" />
                            <span>090 920 4204</span>
                        </a>
                    </div>
                </div>

                <div
                    className="lg:col-span-2 rounded-xl p-6 border border-[#2E2020]/60 flex flex-col justify-between backdrop-blur-md"
                    style={{ background: "rgba(29, 22, 22, 0.4)" }}
                >
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-base flex items-center gap-2">
                                <MessageSquare size={16} className="text-[#D84040]" />
                                Gửi yêu cầu hỗ trợ nhanh
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Yêu cầu của bạn sẽ được chuyển đến Account Manager. Chúng tôi cam kết phản hồi trong vòng 30 phút trong giờ làm việc.
                            </p>
                        </div>

                        {sent && (
                            <div className="p-4 rounded-lg flex items-center gap-3 bg-[#4CAF50]/15 border border-[#4CAF50]/30 text-[#4CAF50] text-xs">
                                <CheckCircle size={16} className="flex-shrink-0" />
                                <span>Cảm ơn bạn! Yêu cầu hỗ trợ đã được chuyển tiếp thành công đến Sarah Kim. AM sẽ liên hệ lại với bạn sớm nhất.</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Tiêu đề yêu cầu</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Ví dụ: Thay đổi điều khoản xuất hóa đơn đỏ đợt 2"
                                    className="w-full px-3 py-2 rounded-lg outline-none bg-[#141010]/40 border border-[#2E2020]/60 text-xs transition-colors focus:border-[#D84040] focus:bg-[#141010]/60 placeholder:text-gray-600 backdrop-blur-md"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Nội dung chi tiết</label>
                                <textarea
                                    rows={6}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Nêu rõ yêu cầu của bạn, ví dụ các chỉnh sửa storyboard hay các câu hỏi về tiến độ kỹ thuật..."
                                    className="w-full px-3 py-2 rounded-lg outline-none bg-[#141010]/40 border border-[#2E2020]/60 text-xs resize-none transition-colors focus:border-[#D84040] focus:bg-[#141010]/60 placeholder:text-gray-600 backdrop-blur-md"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold bg-[#D84040] hover:bg-[#c03030] text-white transition-all shadow-md shadow-[#D84040]/15"
                            >
                                <Send size={12} />
                                Gửi yêu cầu
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
