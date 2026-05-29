import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight } from "lucide-react";

interface Project {
  slug: string;
  title: string;
  year: number;
  featured: boolean;
  client?: { name: string };
  cover_image?: string;
  cover_media?: { url: string; kind: string };
  video_url?: string;
  videoUrl?: string;
}

// Component render text lên canvas (Đưa ra ngoài để tránh bị remount mỗi khi chuột di chuyển)
const CanvasGlitchTitle = ({ text, isHovering }: { text: string, isHovering: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    const canvasShown = canvasRef.current;
    if (!canvasShown) return;
    const ctxShown = canvasShown.getContext('2d');
    if (!ctxShown) return;

    const canvasHidden = document.createElement('canvas');
    const ctxHidden = canvasHidden.getContext('2d');
    if (!ctxHidden) return;

    // Đo độ dài của text để thay đổi kích thước canvas động tránh bị crop
    const tempCtx = document.createElement('canvas').getContext('2d');
    if (!tempCtx) return;
    tempCtx.font = "900 110px ui-sans-serif, system-ui, sans-serif";
    const textWidth = tempCtx.measureText(text.toUpperCase()).width;

    const width = Math.max(1000, Math.ceil(textWidth + 240)); // padding 240px cho hiệu ứng glitch không bị mất rìa
    const height = 260;

    canvasShown.width = width;
    canvasShown.height = height;
    canvasHidden.width = width;
    canvasHidden.height = height;

    const glitch = () => {
      const gWidth = 150 + Math.random() * 200;
      const gHeight = 60 + Math.random() * 60;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const dx = x + (Math.random() * 60 - 30);
      const dy = y + (Math.random() * 40 - 20);

      ctxShown.clearRect(x, y, gWidth, gHeight);
      ctxShown.drawImage(canvasHidden, x, y, gWidth, gHeight, dx, dy, gWidth, gHeight);
    };

    const renderFrame = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const target = isHovering ? 1 : 0;
      const speed = 1 / 300; // 0.3s = 300ms

      if (progressRef.current < target) {
        progressRef.current = Math.min(1, progressRef.current + deltaTime * speed);
      } else if (progressRef.current > target) {
        progressRef.current = Math.max(0, progressRef.current - deltaTime * speed);
      }

      const p = progressRef.current;
      // Chuyển từ trắng (255, 255, 255) sang đỏ thuần (255, 0, 0 - #FF0000)
      const r = 255;
      const g = Math.round(255 - 255 * p);
      const b = Math.round(255 - 255 * p);

      ctxHidden.clearRect(0, 0, width, height);
      ctxHidden.textAlign = 'center';
      ctxHidden.textBaseline = 'middle';
      ctxHidden.font = '900 110px ui-sans-serif, system-ui, sans-serif';
      ctxHidden.fillStyle = `rgb(${r}, ${g}, ${b})`;

      ctxHidden.fillText(text.toUpperCase(), width / 2, height / 2 + 10);

      ctxShown.clearRect(0, 0, width, height);
      ctxShown.drawImage(canvasHidden, 0, 0);

      // Chỉ tạo hiệu ứng glitch trong lúc đang chuyển đổi màu (p nằm giữa 0 và 1)
      if (p > 0 && p < 1) {
        let i = 4; // Vẽ 4 frame glitch mỗi khung hình (do requestAnimationFrame chạy 60fps)
        while (i--) { glitch(); }
      }

      frameIdRef.current = requestAnimationFrame(renderFrame);
    };

    // Reset lastTimeRef khi restart
    lastTimeRef.current = performance.now();
    frameIdRef.current = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [text, isHovering]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-[95vw] w-auto h-auto object-contain cursor-none"
    />
  );
};

export function LandingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up">("down");
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/projects");
        if (response.ok) {
          const data: Project[] = await response.json();
          const featured = data.filter((p) => p.featured);
          setProjects(featured);
        } else {
          setProjects([]);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const lastScrollTime = useRef(0);

  const handleWheel = (e: React.WheelEvent) => {
    if (projects.length === 0) return;

    const now = Date.now();
    // Thêm cooldown 1 giây giữa các lần cuộn để tránh nhảy liên tục
    if (now - lastScrollTime.current < 1000) return;

    if (e.deltaY > 30) {
      setScrollDirection("down");
      setCurrentIndex((prev) => (prev + 1) % projects.length);
      lastScrollTime.current = now;
    } else if (e.deltaY < -30) {
      setScrollDirection("up");
      setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
      lastScrollTime.current = now;
    }
  };

  const currentProject = projects[currentIndex];
  const videoUrl = currentProject?.video_url || currentProject?.videoUrl || "";
  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  const vmMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
  const embedUrl = ytMatch
    ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&playsinline=1&enablejsapi=1`
    : vmMatch
      ? `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&muted=1&loop=1&controls=0&background=1`
      : null;

  const isEmbedVideo = !!embedUrl;
  const isDirectVideo = !!videoUrl && !embedUrl;

  const coverMedia = currentProject?.cover_media || (currentProject?.cover_image ? { url: currentProject.cover_image, kind: "image" } : null);

  return (
    <main
      className="h-screen w-full bg-black relative overflow-hidden"
      onWheel={handleWheel}
      ref={containerRef}
    >
      {/* Background Media */}
      {isEmbedVideo ? (
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="absolute inset-0 w-full h-full opacity-60 pointer-events-none scale-105"
          style={{ border: "none" }}
          allow="autoplay; fullscreen; picture-in-picture"
          title={currentProject.title}
        />
      ) : isDirectVideo ? (
        <video
          key={videoUrl}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />
      ) : coverMedia?.url ? (
        coverMedia.kind === "video" ? (
          <video
            key={coverMedia.url}
            src={coverMedia.url}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
          />
        ) : (
          <img
            key={coverMedia.url}
            src={coverMedia.url}
            alt={currentProject.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
          />
        )
      ) : (
        <div className="absolute inset-0 w-full h-full bg-zinc-900 pointer-events-none" />
      )}

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {currentProject ? (
          <Link
            key={currentIndex}
            to={`/works/${currentProject.slug}`}
            className="group flex flex-col items-center justify-center text-center pointer-events-auto cursor-none select-none"
            style={{
              "--landing-anim": scrollDirection === "down" ? "landingDropDown" : "landingFlyIn",
              textDecoration: "none"
            } as React.CSSProperties}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <style>{`
              @keyframes landingDropDown {
                0% { transform: translateY(-50px) scale(0.96); opacity: 0; filter: blur(8px); }
                100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
              }
              @keyframes landingFlyIn {
                0% { transform: translateY(50px) scale(0.96); opacity: 0; filter: blur(8px); }
                100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
              }
              .animate-item-client {
                animation: var(--landing-anim) 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-delay: 0ms;
              }
              .animate-item-title {
                animation: var(--landing-anim) 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-delay: 80ms;
              }
              .animate-item-year {
                animation: var(--landing-anim) 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
                animation-delay: 160ms;
              }
            `}</style>
            <div className="animate-item-client text-white/80 text-lg md:text-xl tracking-widest uppercase mb-2 transition-colors group-hover:text-[#FF0000]">
              {typeof currentProject.client === "object"
                ? currentProject.client?.name
                : currentProject.client || "Client"}
            </div>

            <div className="animate-item-title">
              <CanvasGlitchTitle text={currentProject.title} isHovering={isHovering} />
            </div>

            <div className="animate-item-year text-white/80 text-lg md:text-xl tracking-widest mt-2 transition-colors group-hover:text-[#FF0000]">
              {currentProject.year}
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-white/30 text-3xl font-light tracking-[0.2em] uppercase">
              204PROD.
            </h2>
            <p className="text-white/20 text-sm font-light tracking-[0.1em] mt-2">
              No featured projects found
            </p>
          </div>
        )}
      </div>

      {/* Right Indicators */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none">
        {projects.map((_, idx) => (
          <div
            key={idx}
            className={`w-1 transition-all duration-300 ${idx === currentIndex ? "h-12 bg-white" : "h-4 bg-white/30"
              }`}
          />
        ))}
      </div>

      {/* Custom Cursor */}
      {projects.length > 0 && (
        <div
          className={`fixed pointer-events-none z-50 flex items-center justify-center gap-1.5 rounded-full border border-white/30 bg-black/50 backdrop-blur-sm px-3 py-1.5 text-white transition duration-150 ease-out ${mousePos.y < 120 ? "opacity-0 scale-90" : "opacity-100 scale-100"
            }`}
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: "translate(12px, 12px)",
          }}
        >
          {isHovering ? (
            <>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                View More
              </span>
              <ArrowRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Scroll
              </span>
              <ArrowDown className="w-3 h-3" />
            </>
          )}
        </div>
      )}
    </main>
  );
}
