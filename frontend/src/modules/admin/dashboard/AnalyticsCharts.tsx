import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { fetchApi } from "../utils/apiClient";

export function AnalyticsCharts() {
  const [cashflowData, setCashflowData] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<any>("/finance/revenue").then((revenueData) => {
      const stacked = revenueData?.monthly_stacked || [];
      const expenses = revenueData?.monthly_expenses_trend || [];
      
      // Merge by month
      const months = Array.from(new Set([...stacked.map((s: any) => s.month), ...expenses.map((e: any) => e.month)]));
      
      const flow = months.map(m => {
        const s = stacked.find((item: any) => item.month === m) || {};
        const e = expenses.find((item: any) => item.month === m) || {};
        
        const inflow = (s.project || 0) + (s.retainer || 0) + (s.media || 0);
        const outflow = (e.opex || 0) + (e.cogs || 0) + (e.misc || 0);
        
        return {
          name: m,
          Inflow: inflow * 1_000_000,
          Outflow: outflow * 1_000_000
        };
      });
      
      setCashflowData(flow);
    }).catch(console.error);
  }, []);

  const formatVND = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr`;
    return value.toLocaleString();
  };

  return (
    <div className="w-full">
      {/* Cashflow Chart */}
      <div style={{ background: "rgba(29, 22, 22, 0.6)", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", borderRadius: "14px", padding: "20px" }}>
        <div className="flex justify-between items-center mb-6">
          <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Biểu đồ Dòng tiền (Cashflow)</h3>
          <span style={{ color: "#888", fontSize: "12px" }}>Các tháng gần đây</span>
        </div>
        <div style={{ height: "350px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatVND} />
              <Tooltip 
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{ background: "#1f1f1f", border: "1px solid #333", borderRadius: "8px", color: "#eee" }}
                formatter={(value: number) => [formatVND(value), undefined]}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Bar dataKey="Inflow" name="Tiền vào" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="Outflow" name="Tiền ra" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
