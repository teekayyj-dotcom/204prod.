import { ArrowLeft } from "lucide-react";

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
          .parallax-scene-container 
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
          background: 
            conic-gradient(from 90deg at var(--l) var(--l), 
                rgba(255, 255, 255, 0.08) 25%, transparent 0%) 
              0 / var(--g) var(--g), 
            var(--back);
          
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
          opacity: calc(min(var(--i, -1) + 1, 1));
          content: '';
          pointer-events: none;
          z-index: 1;
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
                  "--back": `url(${activeMember.img}) 50% 15% / cover no-repeat`
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
      </div>
    </div>
  );
}