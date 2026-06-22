import { useState, useEffect } from "react";

export function AboutPage() {
  const [activeTab, setActiveTab] = useState<"contact" | "partners" | "service">("contact");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animations slightly after mount
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const tabClass = (tabName: "contact" | "partners" | "service") =>
    `px-5 py-2 rounded-full transition-all text-[10px] md:text-xs uppercase tracking-widest font-bold ${
      activeTab === tabName
        ? "bg-white text-black"
        : "text-white/60 hover:text-white"
    }`;

  const maskWord = (word: string, delayClass: string) => (
    <span className="inline-flex overflow-hidden align-bottom pb-[0.2em] mb-[-0.2em]">
      <span
        className={`inline-block text-[#BC0A0A] font-semibold transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${delayClass} ${
          animate ? "translate-y-0" : "translate-y-[120%]"
        }`}
      >
        {word}
      </span>
    </span>
  );

  return (
    <main className="home-shell bg-[#050505] min-h-screen">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes aboutFadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
      <div className="pt-[120px] md:pt-[180px] px-6 md:px-12 max-w-[1600px] mx-auto pb-24 min-h-[80vh] overflow-hidden">
        {/* Hero Text */}
        <h2
          className="text-[clamp(1.6rem,4vw,3.8rem)] leading-[1.05] tracking-tight font-[450] mb-16 md:mb-24 text-white/90 text-justify md:text-left"
          style={{ letterSpacing: "-0.03em" }}
        >
          A vision is only as powerful as the network that carries it. At 204PROD., we build a{" "}
          {maskWord("collective", "delay-[700ms]")} transcending{" "}
          {maskWord("boundaries", "delay-[750ms]")}
          , from corporate giants to the raw pulse of{" "}
          {maskWord("underground", "delay-[800ms]")} {maskWord("culture", "delay-[850ms]")}
          . We bridge global standards and {maskWord("local", "delay-[900ms]")}{" "}
          {maskWord("soul", "delay-[950ms]")}, ensuring every alliance is an{" "}
          {maskWord("evolution", "delay-[1000ms]")}. Collaborating with those who dare to lead, we translate
          disparate ambitions into a {maskWord("unified", "delay-[1050ms]")}{" "}
          {maskWord("visual", "delay-[1100ms]")} {maskWord("language", "delay-[1150ms]")}. We don't just reach
          milestones; we redefine the trajectory of storytelling, moving {maskWord("4ward", "delay-[1200ms]")}{" "}
          with every partnership we forge.
        </h2>

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-16 border-b border-white/10 pb-4 sticky top-[10vh] z-10 bg-[#050505]/80 backdrop-blur-md">
          <button className={tabClass("contact")} onClick={() => setActiveTab("contact")}>
            Contact
          </button>
          <button className={tabClass("partners")} onClick={() => setActiveTab("partners")}>
            Partners
          </button>
          <button className={tabClass("service")} onClick={() => setActiveTab("service")}>
            Service
          </button>
        </div>

        {/* Tab Content: Contact */}
        <div
          className={activeTab === "contact" ? "block" : "hidden"}
          style={activeTab === "contact" ? { animation: "aboutFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" } : undefined}
        >
          <h3 className="text-3xl md:text-4xl font-light mb-6 md:mb-8 text-white">Contact</h3>
          <div className="flex flex-col text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/70 leading-tight">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-2 py-3 border-b border-white/10 hover:bg-white/5 transition-colors items-center">
              <div className="text-white/40 mb-1 md:mb-0">Direct</div>
              <div className="font-medium text-white/90">
                <a
                  href="mailto:204prod.work@gmail.com"
                  className="hover:text-white underline decoration-white/30 underline-offset-4 uppercase text-[10px] md:text-xs"
                >
                  204PROD.WORK@GMAIL.COM
                </a>
              </div>
              <div className="md:text-right">
                <a href="tel:+84989143490" className="hover:text-white inline-block text-[10px] md:text-xs">
                  +84 989 143 490
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-2 py-3 border-b border-white/10 hover:bg-white/5 transition-colors items-center">
              <div className="text-white/40 mb-1 md:mb-0">Location</div>
              <div className="font-medium text-white/90 md:col-span-2 text-[10px] md:text-xs leading-relaxed uppercase">
                139 THAO NGUYEN, ECOPARK TOWNSHIP,
                <br />
                HUNG YEN, VIETNAM
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-2 py-3 border-b border-white/10 hover:bg-white/5 transition-colors items-start">
              <div className="text-white/40 mb-3 md:mb-0 pt-1">Socials</div>
              <div className="font-medium text-white/90 md:col-span-2 flex flex-col gap-2 uppercase text-[10px] md:text-xs">
                <a href="https://facebook.com/204prod.vn" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  FACEBOOK.COM/204PROD.VN
                </a>
                <a href="https://instagram.com/204prod.vn/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  INSTAGRAM.COM/204PROD.VN/
                </a>
                <a href="https://vimeo.com/204prodvn" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  VIMEO.COM/204PRODVN
                </a>
                <a href="https://youtube.com/@204prodvn" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  YOUTUBE.COM/@204PRODVN
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content: Partners */}
        <div
          className={activeTab === "partners" ? "block" : "hidden"}
          style={activeTab === "partners" ? { animation: "aboutFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" } : undefined}
        >
          <h3 className="text-3xl md:text-4xl font-light mb-8 md:mb-12 text-white">Partners</h3>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/70 leading-relaxed text-justify md:text-left max-w-4xl">
            Collaboration is the heartbeat of our craft. We believe in the power of a shared pulse, where corporate precision meets the raw energy of cultural expression. Every alliance we forge is more than a project—it is a collective step toward a new visual era.
          </p>

          {/* Client Logos Grid */}
          <div className="mt-8 md:mt-12 flex flex-wrap justify-start items-center gap-4 md:gap-6">
            {[
              { name: "BUV", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/BUV.png?updatedAt=1775621132850" },
              { name: "HERITIER", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/Heritier.png?updatedAt=1775622723734" },
              { name: "BA", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/BA.png?updatedAt=1775619884908" },
              { name: "YASKAWA", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/YASKAWA.png?updatedAt=1775619786172" },
              { name: "VJE", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/VJE.png?updatedAt=1775619786078" },
              { name: "GENSTOCK", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/GENSTOCK.png?updatedAt=1775619786019" },
              { name: "YELCH", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/YELCH.png?updatedAt=1775619785979" },
              { name: "CASTEM", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/CASTEM.png?updatedAt=1775619785559" },
              { name: "NGỌC DƯỠNG ĐƯỜNG", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/ND%C4%90.png?updatedAt=1775578052342" },
              { name: "VINFAST", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/VF.png?updatedAt=1775578052278" },
              { name: "VIVA MUSICA", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/VIVA.png?updatedAt=1775578052276" },
              { name: "KNOTE", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/KNOTE.png?updatedAt=1775578052219" },
              { name: "TECHCOMBANK", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/TECHCOMBANK.png?updatedAt=1775578052249" },
              { name: "GAFO", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/GAFO.png?updatedAt=1775578052264" },
              { name: "KIOTVIET", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/KIOTVIET.png?updatedAt=1775578052144" },
              { name: "CANADA WIND", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/CW.png?updatedAt=1775578052094" },
              { name: "GREENFIELD", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/GREENFIELD.png?updatedAt=1775578052051" },
              { name: "CASLA", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/CASLA.png?updatedAt=1775578052019" },
              { name: "ARTSY", url: "https://ik.imagekit.io/204prod/CLIENT%20LOGO/ARTSY.png?updatedAt=1775578051728" },
            ].map((logo) => (
              <div
                key={logo.name}
                className="flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity duration-300"
              >
                <img
                  src={logo.url}
                  alt={logo.name}
                  className="h-10 sm:h-12 md:h-14 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tab Content: Service */}
        <div
          className={activeTab === "service" ? "block" : "hidden"}
          style={activeTab === "service" ? { animation: "aboutFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" } : undefined}
        >
          <h3 className="text-3xl md:text-4xl font-light mb-8 md:mb-12 text-white">Service</h3>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/70 leading-relaxed text-justify md:text-left max-w-4xl">
            Our services are a fluid bridge between strategy and art, designed to adapt and elevate. We don't just provide production; we offer a versatile ecosystem of high-end cinematography and photography that transforms abstract brand identities into immersive experiences.
          </p>
        </div>
      </div>
    </main>
  );
}

