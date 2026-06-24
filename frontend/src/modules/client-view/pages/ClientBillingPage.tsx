import { useState } from "react";
import { Receipt, CreditCard, Download, CheckCircle, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";

interface Invoice {
    id: string;
    project: string;
    term: string;
    amount: string;
    amountVal: number;
    status: "Paid" | "Pending" | "Overdue";
    dueDate: string;
}

export function ClientBillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([
        { id: "204-INV-098", project: "Vingroup — TVC Q2", term: "Tạm ứng 50% đợt 1", amount: "82.500.000 đ", amountVal: 82500000, status: "Paid", dueDate: "15/05/2026" },
        { id: "204-INV-104", project: "Highlands — Rebranding", term: "Thanh toán đợt 2 (Hậu kỳ)", amount: "45.000.000 đ", amountVal: 45000000, status: "Pending", dueDate: "29/06/2026" },
        { id: "204-INV-088", project: "F88 — Social Retainer Q2", term: "Chi phí bổ sung phát sinh", amount: "12.000.000 đ", amountVal: 12000000, status: "Overdue", dueDate: "10/06/2026" }
    ]);

    const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

    const handlePay = (id: string) => {
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "Paid" } : inv));
        setPaymentSuccess(id);
        setTimeout(() => setPaymentSuccess(null), 3000);
    };

    // Calculate billing stats
    const totalAmount = invoices.reduce((acc, curr) => acc + curr.amountVal, 0);
    const paidAmount = invoices.filter(inv => inv.status === "Paid").reduce((acc, curr) => acc + curr.amountVal, 0);
    const pendingAmount = invoices.filter(inv => inv.status !== "Paid").reduce((acc, curr) => acc + curr.amountVal, 0);

    const formatCurrency = (val: number) => {
        return val.toLocaleString("vi-VN") + " đ";
    };

    return (
        <div className="p-8 space-y-8" style={{ color: "#EEEEEE" }}>
            {/* Header */}
            <div className="flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#D8404022", border: "1px solid #D8404044" }}
                >
                    <Receipt size={22} style={{ color: "#D84040" }} />
                </div>
                <div>
                    <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>CLIENT PORTAL</p>
                    <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Hóa đơn & Thanh toán</h1>
                </div>
            </div>

            {/* Billing Stats Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { label: "Tổng giá trị hợp đồng", value: formatCurrency(totalAmount), color: "#EEEEEE", bg: "rgba(29, 22, 22, 0.4)" },
                    { label: "Đã thanh toán", value: formatCurrency(paidAmount), color: "#4CAF50", bg: "rgba(76,175,80,0.05)" },
                    { label: "Dư nợ chưa thanh toán", value: formatCurrency(pendingAmount), color: "#FFC107", bg: "rgba(255,193,7,0.05)" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl p-5 flex flex-col gap-2 border border-[#2E2020]/60 backdrop-blur-md"
                        style={{ background: stat.bg }}
                    >
                        <span style={{ color: "#666", fontSize: "12px", fontWeight: 500 }}>{stat.label}</span>
                        <p style={{ color: stat.color, fontSize: "24px", fontWeight: 700 }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Payment success alert banner */}
            {paymentSuccess && (
                <div className="p-4 rounded-xl flex items-center gap-3 bg-[#4CAF50]/10 border border-[#4CAF50]/30 animate-pulse text-[#4CAF50] text-xs">
                    <CheckCircle size={16} />
                    <span>Thanh toán thành công hóa đơn #{paymentSuccess}! Trạng thái đã được cập nhật thành đã thanh toán.</span>
                </div>
            )}

            {/* Invoices List */}
            <div className="rounded-xl overflow-hidden backdrop-blur-md" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}>
                <div className="px-6 py-4 border-b border-[#2E2020]/60">
                    <h3 className="font-semibold text-sm">Danh sách hóa đơn thanh toán</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2A1F1F]" style={{ color: "#666", fontSize: "11px", textTransform: "uppercase" }}>
                                <th className="px-6 py-4">Mã HĐ</th>
                                <th className="px-6 py-4">Dự án</th>
                                <th className="px-6 py-4">Đợt thanh toán</th>
                                <th className="px-6 py-4">Số tiền</th>
                                <th className="px-6 py-4">Hạn thanh toán</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => {
                                const isPaid = inv.status === "Paid";
                                const isOverdue = inv.status === "Overdue";
                                const statusColor = isPaid ? "#4CAF50" : isOverdue ? "#F44336" : "#FFC107";
                                const StatusIcon = isPaid ? CheckCircle : isOverdue ? AlertTriangle : Clock;

                                return (
                                    <tr
                                        key={inv.id}
                                        className="border-b border-[#2E2020]/60 text-xs transition-colors hover:bg-rgba(42, 31, 31, 0.5)"
                                    >
                                        <td className="px-6 py-4 font-mono font-medium">{inv.id}</td>
                                        <td className="px-6 py-4 font-semibold">{inv.project}</td>
                                        <td className="px-6 py-4 text-gray-400">{inv.term}</td>
                                        <td className="px-6 py-4 font-semibold">{inv.amount}</td>
                                        <td className="px-6 py-4 text-gray-400">{inv.dueDate}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                                                style={{ background: `${statusColor}18`, color: statusColor }}
                                            >
                                                <StatusIcon size={10} />
                                                {isPaid ? "Đã thanh toán" : isOverdue ? "Quá hạn" : "Chờ thanh toán"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => alert(`Bắt đầu tải hóa đơn ${inv.id}.pdf`)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2A1F1F]/50 border border-white/5 hover:bg-[#3A2A2A]/70 text-white/70 transition-colors"
                                                    title="Tải hóa đơn"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                {!isPaid && (
                                                    <button
                                                        onClick={() => handlePay(inv.id)}
                                                        className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold bg-[#D84040] hover:bg-[#c03030] text-white transition-all shadow-md shadow-[#D84040]/15"
                                                    >
                                                        <CreditCard size={12} />
                                                        Thanh toán
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick documents area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-xl p-5 border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(29, 22, 22, 0.4)" }}>
                    <h3 className="font-semibold text-sm mb-3">Tài liệu pháp lý & Hợp đồng</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                        Bạn có thể tải trực tiếp file scan hợp đồng kinh tế đã ký cùng các biên bản nghiệm thu bàn giao đính kèm.
                    </p>
                    <div className="space-y-2">
                        {[
                            { name: "Hợp đồng sản xuất phim TVC Vingroup.pdf", size: "2.4 MB" },
                            { name: "Phụ lục hợp đồng Highlands Rebranding.pdf", size: "1.1 MB" }
                        ].map((doc) => (
                            <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg bg-[#241C1C]/40 border border-[#2E2020]/50 text-xs backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{doc.name}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{doc.size}</p>
                                </div>
                                <button
                                    onClick={() => alert(`Bắt đầu tải ${doc.name}`)}
                                    className="p-1.5 rounded bg-[#2A1F1F]/50 border border-white/5 hover:bg-[#3A2A2A]/70 text-white/80 transition-colors"
                                >
                                    <Download size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl p-5 border border-[#2E2020]/60 backdrop-blur-md flex flex-col justify-between" style={{ background: "rgba(29, 22, 22, 0.4)" }}>
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Thông tin xuất hóa đơn đỏ (VAT)</h3>
                        <div className="space-y-2 text-xs text-gray-400">
                            <p><span className="font-semibold text-gray-300">Tên đơn vị:</span> CÔNG TY CỔ PHẦN SẢN XUẤT TRUYỀN THÔNG 204</p>
                            <p><span className="font-semibold text-gray-300">Mã số thuế:</span> 0108920404</p>
                            <p><span className="font-semibold text-gray-300">Địa chỉ:</span> Tòa nhà 204 Production, Quận 3, TP. Hồ Chí Minh</p>
                            <p><span className="font-semibold text-gray-300">Số tài khoản:</span> 19034204555888 - Techcombank chi nhánh Sài Gòn</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-[#2A1F1F] flex justify-between items-center text-xs text-gray-500">
                        <span>Cần thay đổi thông tin xuất hóa đơn?</span>
                        <a href="/client/support" className="text-[#D84040] hover:underline flex items-center gap-0.5 font-semibold">
                            Gửi yêu cầu AM <ArrowUpRight size={11} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
