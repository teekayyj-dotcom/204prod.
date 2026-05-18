import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { testimonials } from "../data/mockData";
import { useNavigate } from "react-router";

export function ClientTestimonials() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));

  const t = testimonials[current];

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#241C1C", border: "1px solid #2E2020" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>
          Client Testimonials
        </h3>
        <button
          onClick={() => navigate("/admin/clients")}
          style={{ color: "#D84040", fontSize: "13px" }}
          className="transition-opacity hover:opacity-70 mr-2"
        >
          View All
        </button>
        <div className="flex gap-2">
          <button
            onClick={prev}
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
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={next}
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
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          key={current}
          className="animate-fade-in"
        >
          {/* Stars */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} size={14} fill="#D84040" color="#D84040" />
            ))}
          </div>

          {/* Quote */}
          <div className="mb-5 relative">
            <span
              className="absolute -top-2 -left-1"
              style={{ color: "#8E1616", fontSize: "48px", lineHeight: 1, fontFamily: "Georgia, serif" }}
            >
              "
            </span>
            <p
              className="pl-6"
              style={{ color: "#CCC", fontSize: "14px", lineHeight: "1.7", fontStyle: "italic" }}
            >
              {t.quote}
            </p>
          </div>

          {/* Author */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}
            >
              {t.avatar}
            </div>
            <div>
              <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{t.client}</p>
              <p style={{ color: "#D84040", fontSize: "12px" }}>{t.company}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 justify-center mt-4">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? "20px" : "6px",
              height: "6px",
              background: i === current ? "#D84040" : "#3A2A2A",
            }}
          />
        ))}
      </div>
    </div>
  );
}
