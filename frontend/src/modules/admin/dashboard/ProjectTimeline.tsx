import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { timelineData } from "../data/mockData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: "#2A1F1F", border: "1px solid #8E1616" }}
      >
        <p style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>{label}</p>
        <p style={{ color: "#EEEEEE", fontSize: "12px" }}>
          Projects: {payload[0]?.value}
        </p>
        <p style={{ color: "#EEEEEE", fontSize: "12px" }}>
          Revenue: ${payload[1]?.value?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function ProjectTimeline() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#241C1C", border: "1px solid #2E2020" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>
            Project Timeline
          </h3>
          <p style={{ color: "#888", fontSize: "12px" }} className="mt-0.5">
            Monthly project volume & revenue — 2025
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#D84040" }} />
            <span style={{ color: "#888", fontSize: "11px" }}>Projects</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#8E1616" }} />
            <span style={{ color: "#888", fontSize: "11px" }}>Revenue</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="projectsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D84040" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#D84040" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8E1616" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#8E1616" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A1F1F" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#666", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#666", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#666", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="projects"
            stroke="#D84040"
            strokeWidth={2.5}
            fill="url(#projectsGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#D84040", stroke: "#1D1616", strokeWidth: 2 }}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="#8E1616"
            strokeWidth={2}
            fill="url(#revenueGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#8E1616", stroke: "#1D1616", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
