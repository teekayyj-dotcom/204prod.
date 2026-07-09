import { TrendingUp, AlertCircle, DollarSign, Target, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchApi } from "../utils/apiClient";

export function OverviewMetrics() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<any>("/projects/all").then(data => setProjects(data)).catch(console.error);
    fetchApi<any>("/finance/revenue").then(setRevenue).catch(console.error);
    fetchApi<any[]>("/finance/expenses").then(setExpenses).catch(console.error);
  }, []);

  const formatVND = (amount: number) => {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}T`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}Tr`;
    return `${amount.toLocaleString()}đ`;
  };

  // 1. Tiền mặt khả dụng = Collected - Total Expenses
  const collected = revenue?.receivables?.collected || 0;
  const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const cashOnHand = collected - totalExpenses;

  // 2. Nợ phải thu = Pending + Overdue
  const pending = revenue?.receivables?.pending || 0;
  const overdue = revenue?.receivables?.overdue || 0;
  const totalReceivables = pending + overdue;

  // 3. Lợi nhuận ròng
  const netProfit = collected - totalExpenses;

  // 4. Tỷ lệ chốt Sale (Win-rate)
  const activeAndCompleted = projects.filter(p => !["Canceled", "Đã hủy"].includes(p.status)).length;
  const winRate = projects.length > 0 ? Math.round((activeAndCompleted / projects.length) * 100) : 0;

  const statCards = [
    { 
      label: "Tiền mặt khả dụng", 
      value: formatVND(cashOnHand), 
      change: "+0", positive: true, path: "/admin/finance",
      icon: <DollarSign size={18} color="#D84040" />,
      color: cashOnHand >= 0 ? "#4ade80" : "#ef4444" 
    },
    { 
      label: "Nợ phải thu", 
      value: formatVND(totalReceivables), 
      change: `Trong đó ${formatVND(overdue)} quá hạn`, positive: false, path: "/admin/finance/revenue",
      icon: <AlertCircle size={18} color={overdue > 0 ? "#ef4444" : "#888"} />,
      color: overdue > 0 ? "#ef4444" : "#EEEEEE"
    },
    { 
      label: "Lợi nhuận ròng (Tạm tính)", 
      value: formatVND(netProfit), 
      change: "+0", positive: true, path: "/admin/finance/expenses",
      icon: <Target size={18} color="#fbbf24" />,
      color: netProfit >= 0 ? "#fbbf24" : "#ef4444"
    },
    { 
      label: "Tỷ lệ chốt Sale", 
      value: `${winRate}%`, 
      change: `${activeAndCompleted}/${projects.length} Hợp đồng`, positive: true, path: "/admin/crm",
      icon: <Briefcase size={18} color="#60a5fa" />,
      color: "#60a5fa"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          onClick={() => navigate(card.path)}
          className="rounded-xl p-5 cursor-pointer backdrop-blur-md transition-all duration-300"
          style={{ 
            background: "rgba(29, 22, 22, 0.6)", 
            border: "none",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: "#888", fontSize: "13px", fontWeight: 500 }}>
              {card.label}
            </p>
            {card.icon}
          </div>
          <p style={{ color: card.color, fontSize: "28px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            {card.value}
          </p>
          <div className="flex items-center gap-1 mt-2 opacity-80">
            <span style={{ color: card.positive ? "#888" : "#ef4444", fontSize: "12px" }}>
              {card.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}