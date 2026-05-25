import { useEffect, useState, useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { mockFeaturedProjects } from "../data/mockProjects";

interface Project {
  slug: string;
  title: string;
  year: number;
  featured: boolean;
  client?: { name: string };
  cover_media?: { url: string; kind: string };
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

    const width = 1000;
    const height = 250;
    
    canvasShown.width = width;
    canvasShown.height = height;
    canvasHidden.width = width;
    canvasHidden.height = height;

    const glitch = () => {
      const gWidth = 100 + Math.random() * 150;
      const gHeight = 50 + Math.random() * 50;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const dx = x + (Math.random() * 40 - 20);
      const dy = y + (Math.random() * 30 - 15);

      ctxShown.clearRect(x, y, gWidth, gHeight);
      ctxShown.drawImage(canvasHidden, x, y, gWidth, gHeight, dx, dy, gWidth, gHeight);
    };

    const renderFrame = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const target = isHovering ? 1 : 0;
      const speed = 1 / 300; // 0.7s = 700ms
      
      if (progressRef.current < target) {
        progressRef.current = Math.min(1, progressRef.current + deltaTime * speed);
      } else if (progressRef.current > target) {
        progressRef.current = Math.max(0, progressRef.current - deltaTime * speed);
      }

      const p = progressRef.current;
      // Chuyển từ trắng (255, 255, 255) sang đỏ (239, 68, 68 - Tailwind red-500)
      const r = Math.round(255 + (239 - 255) * p);
      const g = Math.round(255 + (68 - 255) * p);
      const b = Math.round(255 + (68 - 255) * p);

      ctxHidden.clearRect(0, 0, width, height);
      ctxHidden.textAlign = 'center';
      ctxHidden.textBaseline = 'middle';
      ctxHidden.font = 'bold 100px ui-sans-serif, system-ui, sans-serif';
      ctxHidden.fillStyle = `rgb(${r}, ${g}, ${b})`;

      ctxHidden.fillText(text.toUpperCase(), width / 2, height / 2);
      
      ctxShown.clearRect(0, 0, width, height);
      ctxShown.drawImage(canvasHidden, 0, 0);

      // Chỉ tạo hiệu ứng glitch trong lúc đang chuyển đổi màu (p nằm giữa 0 và 1)
      if (p > 0 && p < 1) {
        let i = 4; // Vẽ 4 frame glitch mỗi khung hình (do requestAnimationFrame chạy 60fps)
        while(i--) { glitch(); }
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
      className="max-w-full w-[800px] h-auto object-contain cursor-none" 
      style={{ aspectRatio: '1000/250' }} 
    />
  );
};

export function LandingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:8000/projects");
        if (response.ok) {
          const data: Project[] = await response.json();
          const featured = data.filter((p) => p.featured);
          setProjects(featured.length > 0 ? featured : mockFeaturedProjects);
        } else {
          setProjects(mockFeaturedProjects);
        }
      } catch (err) {
        console.error("Failed to fetch projects, using mock data instead", err);
        setProjects(mockFeaturedProjects as unknown as Project[]);
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
      setCurrentIndex((prev) => (prev + 1) % projects.length);
      lastScrollTime.current = now;
    } else if (e.deltaY < -30) {
      setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
      lastScrollTime.current = now;
    }
  };

  const currentProject = projects[currentIndex];

  return (
    <main
      className="h-screen w-full bg-black relative overflow-hidden"
      onWheel={handleWheel}
      ref={containerRef}
    >
      {/* Background Video */}
      {currentProject?.cover_media?.url ? (
        <video
          key={currentProject.cover_media.url}
          src={currentProject.cover_media.url}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-zinc-900 pointer-events-none" />
      )}

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {currentProject && (
          <div
            className="group flex flex-col items-center justify-center text-center pointer-events-auto"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="text-white/80 text-lg md:text-xl tracking-widest uppercase mb-2 transition-colors group-hover:text-red-500">
              {currentProject.client?.name || "Client"}
            </div>
            
            <CanvasGlitchTitle text={currentProject.title} isHovering={isHovering} />

            <div className="text-white/80 text-lg md:text-xl tracking-widest mt-2 transition-colors group-hover:text-red-500">
              {currentProject.year}
            </div>
          </div>
        )}
      </div>

      {/* Right Indicators */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none">
        {projects.map((_, idx) => (
          <div
            key={idx}
            className={`w-1 transition-all duration-300 ${
              idx === currentIndex ? "h-12 bg-white" : "h-4 bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Custom Cursor */}
      <div
        className={`fixed pointer-events-none z-50 flex items-center justify-center gap-1.5 rounded-full border border-white/30 bg-black/50 backdrop-blur-sm px-3 py-1.5 text-white transition duration-150 ease-out ${
          mousePos.y < 120 ? "opacity-0 scale-90" : "opacity-100 scale-100"
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
    </main>
  );
}
