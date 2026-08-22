import re

with open("frontend/src/modules/client-site/pages/LandingPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# We need to add viewMode state
state_code = """
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up">("down");
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<"hero" | "projects">("hero");
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
"""
content = re.sub(r'const \[projects, setProjects\].*?const containerRef = useRef<HTMLDivElement>\(null\);', state_code, content, flags=re.DOTALL)

# Update GSAP effect for viewMode
effect_code = """
  useEffect(() => {
    if (viewMode === "hero") {
      gsap.to(wrapperRef.current, { y: "0%", duration: 1, ease: "power3.inOut" });
      gsap.to(heroVideoRef.current, { y: "0%", duration: 1, ease: "power3.inOut" });
    } else {
      gsap.to(wrapperRef.current, { y: "-100%", duration: 1, ease: "power3.inOut" });
      gsap.to(heroVideoRef.current, { y: "30%", duration: 1, ease: "power3.inOut" }); // Parallax effect
    }
  }, [viewMode]);
"""
# insert right before the wheel handler
content = re.sub(r'(const lastScrollTime = useRef\(0\);)', effect_code + r'\n  \1', content)

# Update wheel handler
wheel_code = """
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    // Thêm cooldown 1 giây giữa các lần cuộn để tránh nhảy liên tục
    if (now - lastScrollTime.current < 1000) return;

    if (viewMode === "hero") {
      if (e.deltaY > 30) {
        setViewMode("projects");
        lastScrollTime.current = now;
      }
    } else {
      if (projects.length === 0) return;
      if (e.deltaY > 30) {
        setScrollDirection("down");
        setCurrentIndex((prev) => (prev + 1) % projects.length);
        lastScrollTime.current = now;
      } else if (e.deltaY < -30) {
        if (currentIndex === 0) {
          setViewMode("hero");
          lastScrollTime.current = now;
        } else {
          setScrollDirection("up");
          setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
          lastScrollTime.current = now;
        }
      }
    }
  };

  // Touch support
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY; // positive means swipe up (scroll down)
    const now = Date.now();
    if (now - lastScrollTime.current < 1000) return;
    
    if (Math.abs(deltaY) > 50) { // threshold
      if (viewMode === "hero") {
        if (deltaY > 0) {
          setViewMode("projects");
          lastScrollTime.current = now;
        }
      } else {
        if (projects.length === 0) return;
        if (deltaY > 0) {
          setScrollDirection("down");
          setCurrentIndex((prev) => (prev + 1) % projects.length);
          lastScrollTime.current = now;
        } else {
          if (currentIndex === 0) {
            setViewMode("hero");
            lastScrollTime.current = now;
          } else {
            setScrollDirection("up");
            setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
            lastScrollTime.current = now;
          }
        }
      }
    }
  };
"""
content = re.sub(r'const handleWheel = \(e: React.WheelEvent\) => \{.*?\n  \};\n', wheel_code, content, flags=re.DOTALL)

# Update return statement structure
# Wrap everything in a wrapper div with 200vh height

# Find the start of the return statement
# return (
#     <main
#       className="h-screen w-full bg-black relative overflow-hidden"
#       onWheel={handleWheel}
#       ref={containerRef}
#     >
#       {/* Background Media */}

return_code = """
  return (
    <main
      className="h-screen w-full bg-black relative overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      <div 
        ref={wrapperRef}
        className="w-full h-[200vh] flex flex-col absolute top-0 left-0"
      >
        {/* Hero Section */}
        <section className="w-full h-screen relative overflow-hidden flex items-center justify-center bg-black shrink-0">
          <video
            ref={heroVideoRef}
            src="https://www.w3schools.com/html/mov_bbb.mp4" 
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-[130vh] -top-[15vh] object-cover opacity-80 pointer-events-none"
          />
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          <div className="z-10 flex flex-col items-center justify-center text-center pointer-events-none">
            <h1 className="text-white text-5xl md:text-7xl font-light tracking-[0.2em] uppercase">
              204PROD.
            </h1>
            <p className="text-white/60 text-lg md:text-xl font-light tracking-[0.1em] mt-4">
              Scroll to explore
            </p>
          </div>
        </section>

        {/* Projects Section */}
        <section className="w-full h-screen relative shrink-0">
"""

# Replace the beginning of return
content = re.sub(
    r'return \(\s*<main[^>]*>.*?\{\/\* Background Media \*\/\}',
    return_code + '\n          {/* Background Media */}',
    content,
    flags=re.DOTALL
)

# Replace the end of the return statement
content = re.sub(
    r'  \);\n\}\n$',
    r'        </section>\n      </div>\n    </main>\n  );\n}\n',
    content
)

with open("frontend/src/modules/client-site/pages/LandingPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
