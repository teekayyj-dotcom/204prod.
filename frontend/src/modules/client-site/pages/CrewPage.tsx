import { useState, useEffect, useRef } from "react";
import gsap from "gsap-trial";
import { CrewDetail } from "./CrewDetail";
import { useParams, useNavigate } from "react-router-dom";

export function CrewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hoveredCrew, setHoveredCrew] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crewData, setCrewData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/v1/crew")
      .then(res => res.json())
      .then(data => {
        const mappedData = data.map((c: any) => {
          let avatarUrl = c.avatar;
          if (avatarUrl && avatarUrl.includes("ik.imagekit.io")) {
            // Ensure high quality for sharper images
            const baseUrl = avatarUrl.split('?')[0];
            avatarUrl = `${baseUrl}?tr=w-1200,f-auto,q-100`;
          } else if (!avatarUrl) {
            avatarUrl = "https://ik.imagekit.io/204prod/CREW/default.jpg?tr=w-1200,f-auto,q-100";
          }

          return {
            ...c,
            id: c.id.toString(),
            img: avatarUrl,
            socials: [],
          };
        });
        setCrewData(mappedData);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (hoveredCrew) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [hoveredCrew]);

  useEffect(() => {
    setHoveredCrew(null);
  }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const boxSize = 35; // Decreased grid size for a finer effect

    // Set logical dimensions to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const m = { x: canvas.width / 2, y: canvas.height / 2, s: 1.5, x2: canvas.width / 2, y2: canvas.height / 2 };
    const xTo = gsap.quickTo(m, "x", { duration: 1, ease: "expo" });
    const yTo = gsap.quickTo(m, "y", { duration: 1, ease: "expo" });
    const sTo = gsap.quickTo(m, "s", { duration: 2, ease: "power2" });

    let boxes: Array<{ x: number; y: number; d: number; s: number }> = [];

    const img = new Image();
    img.crossOrigin = "anonymous";

    let isLoaded = false;
    const handleLoad = () => {
      if (isLoaded) return;
      isLoaded = true;
      initGrid();
      gsap.ticker.add(update);
    };

    img.onload = handleLoad;
    img.src = "https://ik.imagekit.io/204prod/CREW/CREW.jpg?tr=w-1920,f-auto,q-80";

    if (img.complete) {
      handleLoad();
    }

    function initGrid() {
      if (!canvas) return;
      boxes = [];
      const w = canvas.width;
      const h = canvas.height;
      for (let x = 0; x <= w; x += boxSize) {
        for (let y = 0; y <= h; y += boxSize) {
          boxes.push({ x, y, d: 0, s: 0 });
        }
      }
    }

    function update() {
      if (!isLoaded || !ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      const d = Math.hypot(m.x - m.x2, m.y - m.y2);
      sTo(d / Math.max(w, h) * 2);
      ctx.clearRect(0, 0, w, h);

      // Calculations to fit the image on the screen using object-cover logic
      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

      if (imgRatio > canvasRatio) {
        sWidth = img.height * canvasRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / canvasRatio;
        sy = (img.height - sHeight) / 2;
      }

      // Draw background image scaled cover
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, w, h);

      // Draw magnified grid boxes
      boxes.forEach((c) => {
        c.d = Math.hypot(c.x - m.x, c.y - m.y);
        const clampRatio = m.s > 0.0001 ? (c.d / Math.max(w, h) / m.s) : 1e9;
        c.s = 1 - gsap.utils.clamp(0, 1, clampRatio);
        if (isNaN(c.s) || c.s < 0.001) return;

        const zoomStrength = 0.55; // 0 = no zoom, 0.55 = ~2.2x zoom
        const boxScaled = boxSize * c.s * zoomStrength;

        // Map the grid coordinate dynamically to the source image position
        const srcX = sx + (c.x + boxScaled / 2) * (sWidth / w);
        const srcY = sy + (c.y + boxScaled / 2) * (sHeight / h);
        const srcW = (boxSize - boxScaled) * (sWidth / w);
        const srcH = (boxSize - boxScaled) * (sHeight / h);

        ctx.drawImage(
          img,
          srcX,
          srcY,
          srcW,
          srcH,
          c.x,
          c.y,
          boxSize,
          boxSize
        );
      });
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      m.x2 = e.clientX - rect.left;
      m.y2 = e.clientY - rect.top;
      xTo(m.x2);
      yTo(m.y2);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initGrid();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", handleResize);

    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [id]);

  const activeMember = id ? crewData.find(c => c.id === id) : null;
  const hoverMember = hoveredCrew ? crewData.find(c => c.id === hoveredCrew) : null;
  const showDetail = !!activeMember;

  return (
    <main className="home-shell bg-[#050505] min-h-screen">
      {!showDetail ? (
        <div id="crew-list-view">
          <style>{`
            #overlay-crew-cloud:hover button {
              transition-delay: 0s !important;
              transition-duration: 150ms !important;
            }
          `}</style>
          <section className="relative min-h-screen px-6 flex items-center justify-center overflow-hidden bg-[#050505]">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover brightness-[0.35] saturate-[0.9] scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#050505] via-[#050505]/80 via-30% to-transparent z-10 pointer-events-none" />
            </div>
            <div className="relative z-20 w-full max-w-[1600px] mx-auto grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-[0.4rem] gap-x-4 md:gap-x-[1.2rem] lg:gap-x-6 lg:gap-y-[0.35rem] items-center group" id="overlay-crew-cloud">
              {crewData.map((member, index) => (
                <button
                  key={member.id}
                  className="relative inline-flex items-center gap-[0.6rem] max-[768px]:gap-2 w-fit text-[clamp(1.6rem,2.8vw,3rem)] max-[768px]:text-[clamp(1.4rem,5vw,2.2rem)] max-[480px]:text-[clamp(1.6rem,7vw,2.5rem)] leading-none tracking-[-0.045em] text-white/95 cursor-pointer transition-[opacity,transform] duration-300 ease-in-out bg-transparent border-0 p-0 font-inherit text-left hover:translate-x-[10px] max-[768px]:hover:translate-x-0 group-hover:opacity-[0.32] hover:!opacity-100"
                  style={{ transitionDelay: `${0.1 + index * 0.05}s` }}
                  onMouseEnter={() => setHoveredCrew(member.id)}
                  onMouseLeave={() => setHoveredCrew(null)}
                  onClick={() => {
                    setHoveredCrew(null);
                    navigate(`/crew/${member.id}`);
                  }}
                >
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-[clamp(28px,1.8vw,36px)] h-[clamp(28px,1.8vw,36px)] rounded-full object-cover object-[center_20%] border border-white/18 shadow-[0_8px_28px_rgba(0,0,0,0.35)] shrink-0"
                  />
                  {member.name}
                </button>
              ))}
            </div>
          </section>

          {/* Hover Preview */}
          <div
            className={`fixed w-[180px] aspect-[4/5] pointer-events-none rounded-[20px] overflow-hidden z-[130] bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.38)] border border-white/12 transition-[opacity,transform] duration-200 ease-out max-md:hidden ${hoveredCrew ? "opacity-100" : "opacity-0"
              }`}
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: `translate(-50%, -50%) scale(${hoveredCrew ? 1 : 0.94})`,
            }}
          >
            {hoverMember && (
              <>
                <img src={hoverMember.img} alt={hoverMember.name} className="w-full h-full object-cover object-[center_20%]" />
                <div className="absolute left-[14px] bottom-[12px] right-[14px] text-[0.66rem] tracking-[0.14em] uppercase text-white/78 [text-shadow:0_4px_14px_rgba(0,0,0,0.8)]">{hoverMember.role}</div>
              </>
            )}
          </div>
        </div>
      ) : (
        <CrewDetail activeMember={activeMember} onBack={() => navigate("/crew")} />
      )}
    </main>
  );
}
