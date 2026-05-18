import { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Plus, Loader2 } from "lucide-react";
import { clients, categories } from "../data/mockData";

interface FormData {
  title: string;
  client: string;
  category: string;
  status: string;
  dueDate: string;
  budget: string;
  description: string;
}

interface Props {
  onClose: () => void;
  onAdd?: (data: FormData) => void;
}

export function AddProjectModal({ onClose, onAdd }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setSuccess(true);
    onAdd?.(data);
    setTimeout(onClose, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#241C1C", border: "1px solid #3A2A2A" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #2A1F1F" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#D84040" }}
            >
              <Plus size={16} color="#fff" />
            </div>
            <h2 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>
              Add New Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "#2A1F1F", color: "#888" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#8E1616";
              (e.currentTarget as HTMLElement).style.color = "#EEEEEE";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#2A1F1F";
              (e.currentTarget as HTMLElement).style.color = "#888";
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="block mb-1.5">
              Project Title *
            </label>
            <input
              {...register("title", { required: "Title is required" })}
              placeholder="e.g. Nexus Brand Refresh"
              className="w-full px-3 py-2.5 rounded-lg outline-none transition-colors"
              style={{
                background: "#1D1616",
                border: `1px solid ${errors.title ? "#D84040" : "#3A2A2A"}`,
                color: "#EEEEEE",
                fontSize: "14px",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D84040")}
              onBlur={(e) => (e.target.style.borderColor = errors.title ? "#D84040" : "#3A2A2A")}
            />
            {errors.title && (
              <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Client + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="block mb-1.5">
                Client *
              </label>
              <select
                {...register("client", { required: "Client is required" })}
                className="w-full px-3 py-2.5 rounded-lg outline-none appearance-none"
                style={{
                  background: "#1D1616",
                  border: `1px solid ${errors.client ? "#D84040" : "#3A2A2A"}`,
                  color: "#EEEEEE",
                  fontSize: "14px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#D84040")}
                onBlur={(e) => (e.target.style.borderColor = errors.client ? "#D84040" : "#3A2A2A")}
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="block mb-1.5">
                Category *
              </label>
              <select
                {...register("category", { required: "Category is required" })}
                className="w-full px-3 py-2.5 rounded-lg outline-none appearance-none"
                style={{
                  background: "#1D1616",
                  border: `1px solid ${errors.category ? "#D84040" : "#3A2A2A"}`,
                  color: "#EEEEEE",
                  fontSize: "14px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#D84040")}
                onBlur={(e) => (e.target.style.borderColor = errors.category ? "#D84040" : "#3A2A2A")}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status + Due Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="block mb-1.5">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full px-3 py-2.5 rounded-lg outline-none appearance-none"
                style={{
                  background: "#1D1616",
                  border: "1px solid #3A2A2A",
                  color: "#EEEEEE",
                  fontSize: "14px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#D84040")}
                onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="block mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                {...register("dueDate")}
                className="w-full px-3 py-2.5 rounded-lg outline-none"
                style={{
                  background: "#1D1616",
                  border: "1px solid #3A2A2A",
                  color: "#EEEEEE",
                  fontSize: "14px",
                  colorScheme: "dark",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#D84040")}
                onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="block mb-1.5">
              Budget
            </label>
            <input
              {...register("budget")}
              placeholder="e.g. $25,000"
              className="w-full px-3 py-2.5 rounded-lg outline-none"
              style={{
                background: "#1D1616",
                border: "1px solid #3A2A2A",
                color: "#EEEEEE",
                fontSize: "14px",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D84040")}
              onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="block mb-1.5">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Brief project overview..."
              className="w-full px-3 py-2.5 rounded-lg outline-none resize-none"
              style={{
                background: "#1D1616",
                border: "1px solid #3A2A2A",
                color: "#EEEEEE",
                fontSize: "14px",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D84040")}
              onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg transition-colors"
              style={{ background: "#2A1F1F", color: "#999", border: "1px solid #3A2A2A", fontSize: "14px" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#EEEEEE")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#999")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
              style={{
                background: success ? "#4CAF50" : "#D84040",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                opacity: submitting ? 0.8 : 1,
              }}
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : success ? (
                "Project Added!"
              ) : (
                "Add Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
