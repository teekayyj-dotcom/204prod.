import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
interface Social {
  icon: string;
  url: string;
}

interface CrewMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  img: string;
  socials?: Social[];
}

interface CrewDetailProps {
  activeMember: CrewMember | null;
  onBack: () => void;
}

export function CrewDetail({ activeMember, onBack }: CrewDetailProps) {
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const navigate = useNavigate();
  const [transitioningProject, setTransitioningProject] = useState<string | null>(null);

  const handleProjectClick = (e: React.MouseEvent, slug: string) => {
    if (transitioningProject) {
      e.preventDefault();
      return;
    }
    
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    
    e.preventDefault();
    setTransitioningProject(slug);

    let card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    
    const clone = card.cloneNode(true) as HTMLElement;
    document.body.appendChild(clone);
    
    card.style.opacity = '0';
    clone.style.transform = 'none';

    gsap.set(clone, {
      position: "fixed",
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 9999,
      margin: 0,
      pointerEvents: "none",
      borderRadius: window.getComputedStyle(card).borderRadius
    });

    const textElements = clone.querySelectorAll("h3, p, span, div.absolute");
    if (textElements.length > 0) {
      gsap.to(textElements, { opacity: 0, duration: 0.3 });
    }

    document.body.classList.add("is-transitioning");

    gsap.to(clone, {
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
      duration: 1.0,
      ease: "power3.inOut",
      onComplete: () => {
        document.body.classList.remove("is-transitioning");
        navigate(`/works/${slug}`);
        
        gsap.to(clone, {
          opacity: 0,
          duration: 0.6,
          delay: 0.6,
          onComplete: () => clone.remove()
        });
      }
    });
  };

  useEffect(() => {
    if (!activeMember) return;
    
    fetch("/api/v1/projects/all")
      .then(res => res.json())
      .then(data => {
        const projArray = Array.isArray(data) ? data : (data.items || []);
        const filtered = projArray.filter((p: any) => {
          if (!p.published) return false;
          
          let hasCredit = false;
          
          // Check structured_credits first
          if (Array.isArray(p.structured_credits) && p.structured_credits.length > 0) {
            hasCredit = p.structured_credits.some((sc: any) => String(sc.crew_id) === String(activeMember.id));
          }
          
          // Fallback to name checking if not found in structured_credits
          if (!hasCredit && Array.isArray(p.credits)) {
            hasCredit = p.credits.some((c: string) => 
              c.toLowerCase().includes(activeMember.name.toLowerCase())
            );
          }
          
          return hasCredit;
        });
        setAssignedProjects(filtered);
      })
      .catch(console.error);
  }, [activeMember]);

  if (!activeMember) return null;

  return (
    <div id="crew-detail-view" className="text-white pt-32 min-h-screen relative">
      <style>{`
        .parallax-scene-container {
          width: 100%;
          max-width: 460px;
          aspect-ratio: 4/5;
        }
        @media (max-width: 1024px) {
          .parallax-scene-container {
            max-width: 380px;
          }
        }

        .parallax-scene {
          --ma: 15deg; /* Max rotation angle */
          --oz: 4em;   /* Pivot distance */
          --fn: cubic-bezier(.175, .885, .32, 1.275);
          --g: 24px;   /* Grid background size */
          --l: 1px;    /* Grid line weight */
          
          display: grid;
          width: 100%;
          height: 100%;
          perspective: 65em;
          color: #eee;
          
          /* Default center coordinates when not hovered */
          --i: calc(0.5 * (var(--n) - 1));
          --j: calc(0.5 * (var(--n) - 1));
        }

        .parallax-scene > * {
          grid-area: 1 / 1;
        }

        .parallax-grid {
          display: grid;
          grid-template-columns: repeat(var(--n), 1fr);
          grid-template-rows: repeat(var(--n), 1fr);
          z-index: 20; /* Keep hover grid on top of card content */
        }

        .parallax-grid .parallax-cell {
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        /* Hover bindings mapping 16 cells to grid coordinates */
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(1):hover) { --i: 0; --j: 0; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(2):hover) { --i: 1; --j: 0; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(3):hover) { --i: 2; --j: 0; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(4):hover) { --i: 3; --j: 0; }

        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(5):hover) { --i: 0; --j: 1; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(6):hover) { --i: 1; --j: 1; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(7):hover) { --i: 2; --j: 1; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(8):hover) { --i: 3; --j: 1; }

        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(9):hover) { --i: 0; --j: 2; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(10):hover) { --i: 1; --j: 2; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(11):hover) { --i: 2; --j: 2; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(12):hover) { --i: 3; --j: 2; }

        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(13):hover) { --i: 0; --j: 3; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(14):hover) { --i: 1; --j: 3; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(15):hover) { --i: 2; --j: 3; }
        .parallax-scene:has(.parallax-grid > .parallax-cell:nth-child(16):hover) { --i: 3; --j: 3; }

        .parallax-card {
          --di: calc(2 * var(--i) / (var(--n) - 1) - 1);
          --dj: calc(1 - 2 * var(--j) / (var(--n) - 1));
          
          width: 100%;
          height: 100%;
          border-radius: 0.75rem;
          overflow: hidden;
          position: relative;
          
          transform-origin: 50% 50% var(--oz);
          transform-style: preserve-3d;
          transform: 
            rotateX(calc(var(--dj) * var(--ma)))
            rotateY(calc(var(--di) * var(--ma)));
          
          box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.6);
          background: var(--back);
          
          transition: transform 0.4s var(--fn);
        }

        /* Shine overlay */
        .parallax-card::before {
          position: absolute;
          inset: 0;
          margin: -50% -50%;
          translate: calc(var(--di, 0) * -40%) calc(var(--dj, 0) * 40%);
          background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
          transition: inherit;
          transition-property: translate, opacity;
          opacity: 0;
          content: '';
          pointer-events: none;
          z-index: 1;
        }

        .parallax-scene:hover .parallax-card::before {
          opacity: 1;
        }

        /* Grid overlay */
        .parallax-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            conic-gradient(from 90deg at var(--l) var(--l), 
                rgba(255, 255, 255, 0.08) 25%, transparent 0%) 
              0 / var(--g) var(--g);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 2;
        }

        .parallax-scene:hover .parallax-card::after {
          opacity: 1;
        }
      `}</style>
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white uppercase tracking-widest text-xs mb-12 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Crew
        </button>

        <div className="flex flex-col md:flex-row md:items-stretch gap-12">
          <div className="flex-1 flex justify-center items-end max-[1024px]:order-first max-[1024px]:items-center">
            <div className="parallax-scene-container">
              <div
                className="parallax-scene"
                style={{
                  "--n": 4,
                  "--back": `url("${activeMember.img}") 50% 15% / cover no-repeat`
                } as React.CSSProperties}
              >
                <div className="parallax-card" />
                <div className="parallax-grid">
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <div key={idx} className="parallax-cell" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <h1 className="font-[450] tracking-tighter whitespace-nowrap mb-2" style={{ fontSize: "clamp(2.5rem, 5vw, 6.5rem)", letterSpacing: "-0.04em" }}>
              {activeMember.name}
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-6 font-[300]">
              {activeMember.role}
            </p>
            <p className="text-sm leading-relaxed mb-8 max-w-xl text-white/80 uppercase tracking-wide text-justify">
              {activeMember.bio}
            </p>

            <div className="flex gap-4">
              {activeMember.socials?.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <i className={`bi ${social.icon} text-xl`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Works Gallery */}
        {assignedProjects.length > 0 && (
          <div className="mt-24 pb-24 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-[450] tracking-tighter text-white mb-10 uppercase">Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
              {assignedProjects.map(p => {
                 const imageUrl = (p.cover_media && p.cover_media.url) || p.cover_image || (p.cover_media && p.cover_media.thumbnail_url);
                 return (
                  <Link 
                    key={p.slug} 
                    to={`/works/${p.slug}`} 
                    onClick={(e) => handleProjectClick(e, p.slug)}
                    className="group block"
                  >
                    <div className="aspect-video bg-white/5 rounded-lg overflow-hidden mb-4 relative">
                      {imageUrl ? (
                        <img src={imageUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">No Cover</div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                    </div>
                    <h3 className="text-white text-lg font-medium tracking-tight mb-1">{p.title}</h3>
                    <p className="text-white/50 text-xs uppercase tracking-widest">{p.client || p.category || "Project"}</p>
                  </Link>
                 );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}