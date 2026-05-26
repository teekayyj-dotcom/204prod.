import { useEffect, useState, useRef } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Zap } from "lucide-react";
import { initFluid } from "../utils/fluid";


const LOGO_LETTERS = ["2", "0", "4", "P", "R", "O", "D", "."];

export function ClientLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const [time, setTime] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hideHeader, setHideHeader] = useState(false);
  const [letterOffsets, setLetterOffsets] = useState<Array<{ x: number; y: number; skewX: number; skewY: number }>>(
    Array(8).fill({ x: 0, y: 0, skewX: 0, skewY: 0 })
  );
  const spanRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const handleLogoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const newOffsets = LOGO_LETTERS.map((_, i) => {
      const span = spanRefs.current[i];
      if (!span) return { x: 0, y: 0, skewX: 0, skewY: 0 };

      const spanRect = span.getBoundingClientRect();
      const spanX = spanRect.left - rect.left + spanRect.width / 2;
      const spanY = spanRect.top - rect.top + spanRect.height / 2;

      const dx = mx - spanX;
      const dy = my - spanY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const maxDistance = 140; // radius of influence
      if (distance < maxDistance) {
        const force = 1 - distance / maxDistance; // 0 to 1
        
        // Pull towards the cursor
        const pullX = dx * force * 0.35;
        const pullY = dy * force * 0.35;
        
        // Skew to stretch dynamically
        const skewX = distance > 0 ? (dx / distance) * force * 15 : 0;
        const skewY = distance > 0 ? (dy / distance) * force * 15 : 0;

        return { x: pullX, y: pullY, skewX, skewY };
      }

      return { x: 0, y: 0, skewX: 0, skewY: 0 };
    });

    setLetterOffsets(newOffsets);
  };

  const handleLogoMouseLeave = () => {
    setLetterOffsets(Array(8).fill({ x: 0, y: 0, skewX: 0, skewY: 0 }));
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setHideHeader(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isLandingPage) return;

    const canvas = document.getElementById("fluid") as HTMLCanvasElement;
    if (!canvas) return;

    const cleanup = initFluid(canvas);
    return cleanup;
  }, [isLandingPage]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isLandingPage) return;
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    if (maxScroll > 50) {
      // Hide header when we have scrolled down near the bottom (within 100px of max scroll)
      setHideHeader(target.scrollTop >= maxScroll - 100);
    } else {
      setHideHeader(false);
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-black flex flex-col overscroll-none no-scrollbar"
    >
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-500 ease-in-out ${hideHeader ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
        <div className="w-full px-12 md:px-24 !py-6 grid grid-cols-5 items-center">
          <div className="flex justify-start">
            <NavLink to="/works" className="text-[15px] font-light tracking-wide hover:text-white/70 transition-colors text-white">
              Portfolio
            </NavLink>
          </div>

          <div className="flex justify-center">
            <NavLink to="/crew" className="text-[15px] font-light tracking-wide hover:text-white/70 transition-colors text-white">
              Crew
            </NavLink>
          </div>

          <div className="flex justify-center">
            <NavLink to="/">
              <img
                src="/favicon/android-chrome-512x512.png"
                alt="Logo"
                className="h-24 w-auto object-contain"
              />
            </NavLink>
          </div>

          <div className="flex justify-center">
            <NavLink to="/about" className="text-[15px] font-light tracking-wide hover:text-white/70 transition-colors text-white">
              About
            </NavLink>
          </div>

          <div className="flex justify-end">
            <NavLink to="/contact" className="text-[15px] font-light tracking-wide hover:text-white/70 transition-colors text-white">
              Contact
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Footer */}
      {isLandingPage ? (
        <footer className="absolute bottom-0 left-0 right-0 z-50 bg-transparent py-8 w-full px-12 md:px-24">
          <div className="flex flex-col md:flex-row justify-between items-center text-[13px] font-light text-white/50 w-full">
            <p>
              © {new Date().getFullYear()} 204prod All rights reserved.
            </p>

            <div className="flex items-center gap-12 mt-4 md:mt-0">
              <div className="flex items-center gap-6">
                <a href="https://www.instagram.com/204prod.vn/" className="hover:text-white transition-colors">Instagram</a>
                <a href="https://www.facebook.com/204prod.vn" className="hover:text-white transition-colors">Facebook</a>
              </div>

              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Services</a>
              </div>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="w-full shrink-0 relative flex flex-col justify-between px-12 md:px-24 py-16 md:py-20 text-white overflow-hidden select-none" style={{
          height: "100vh",
          minHeight: "100vh",
          backgroundImage: "url('/background/Footer-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}>
          {/* Canvas for WebGL fluid simulation smoke cursor */}
          <canvas id="fluid" className="absolute inset-0 w-full h-full pointer-events-none z-0" />

          {/* Top segment: Links (left) and Newsletter subscription (right) */}
          <div className="flex flex-col md:flex-row justify-between items-start w-full gap-12 mt-12 md:mt-6 relative z-10">
            {/* Left side links */}
            <div className="flex flex-col gap-1 md:gap-2">
              <NavLink to="/works" className="text-[44px] md:text-[60px] font-black text-white hover:text-white/60 transition-all tracking-tight leading-[1]">
                Work
              </NavLink>
              <NavLink to="/about" className="text-[44px] md:text-[60px] font-black text-white hover:text-white/60 transition-all tracking-tight leading-[1]">
                Studio
              </NavLink>
              <NavLink to="/contact" className="text-[44px] md:text-[60px] font-black text-white hover:text-white/60 transition-all tracking-tight leading-[1]">
                Contact
              </NavLink>
            </div>

            {/* Right newsletter */}
            <div className="flex flex-col gap-6 w-full max-w-[340px] pt-4 md:pt-2">
              <p className="text-[15px] md:text-[17px] text-white/80 font-light leading-relaxed">
                Get industry insights and creative inspiration straight to your inbox.
              </p>
              <div className="relative border-b border-white/20 pb-3 flex items-center justify-between">
                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-transparent text-white placeholder-white/30 text-[15px] outline-none border-none w-full pr-8"
                />
                <button className="text-white/60 hover:text-white transition-colors absolute right-0 bottom-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div 
            onMouseMove={handleLogoMouseMove}
            onMouseLeave={handleLogoMouseLeave}
            className="w-full flex justify-center items-center mt-auto mb-2 select-none relative z-10 cursor-pointer"
          >
            <h1 
              className="text-[18vw] md:text-[20vw] font-extrabold italic tracking-[-0.06em] uppercase text-white leading-none w-full py-2 select-none pointer-events-none whitespace-nowrap flex justify-center items-center"
              style={{ fontFamily: "'Monument Extended', sans-serif", fontWeight: 800, whiteSpace: "nowrap" }}
            >
              {LOGO_LETTERS.map((letter, idx) => (
                <span
                  key={idx}
                  ref={(el) => { spanRefs.current[idx] = el; }}
                  className="inline-block"
                  style={{
                    transform: `translate(${letterOffsets[idx].x}px, ${letterOffsets[idx].y}px) skew(${letterOffsets[idx].skewX}deg, ${letterOffsets[idx].skewY}deg)`,
                    transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                >
                  {letter}
                </span>
              ))}
            </h1>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row justify-between items-center text-[13px] md:text-[14px] font-light text-white/50 border-t border-white/10 pt-6 pb-2 w-full gap-4 relative z-10">
            <p>Copyright © {new Date().getFullYear()} 204prod.</p>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.015 9.015 0 018.716 6.747M12 3a9.015 9.015 0 00-8.716 6.747m17.432 0a9.005 9.005 0 01-17.432 0m17.432 0c-.397 2.215-2.52 3.996-5.216 3.996-2.696 0-4.819-1.78-5.216-3.996m10.432 0h-10.43" />
              </svg>
              <span>Hanoi, VN</span>
            </div>
            <p className="tabular-nums">{time}</p>
            <div className="flex items-center gap-6">
              <a href="https://www.instagram.com/204prod.vn/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a>
              <a href="https://www.facebook.com/204prod.vn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
