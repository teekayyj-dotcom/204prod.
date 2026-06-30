import { useState, useEffect } from "react";

export function AboutPage() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animations slightly after mount
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .about-section {
          animation: aboutFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-sec-1 { animation-delay: 200ms; }
        .delay-sec-2 { animation-delay: 400ms; }
        .delay-sec-3 { animation-delay: 600ms; }
      `}} />
      <div className="pt-[120px] md:pt-[180px] px-6 md:px-12 max-w-[1600px] mx-auto pb-24 min-h-[80vh] overflow-hidden">
        {/* Hero Text */}
        <h2
          className="text-[clamp(1.6rem,4vw,3.8rem)] leading-[1.05] tracking-tight font-[450] mb-20 md:mb-28 text-white/90 text-justify md:text-left"
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

        <div className="grid grid-cols-1 gap-20 md:gap-28 mt-12">
          {/* Section: Service */}
          <section className="about-section delay-sec-1 border-t border-white/10 pt-12">
            <h3 className="text-3xl md:text-4xl font-light mb-8 text-white uppercase tracking-wider">Service</h3>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/70 leading-relaxed text-justify md:text-left max-w-4xl">
              Our services are a fluid bridge between strategy and art, designed to adapt and elevate. We don't just provide production; we offer a versatile ecosystem of high-end cinematography and photography that transforms abstract brand identities into immersive experiences.
            </p>
          </section>

          {/* Section: Partners */}
          <section className="about-section delay-sec-2 border-t border-white/10 pt-12">
            <h3 className="text-3xl md:text-4xl font-light mb-6 text-white uppercase tracking-wider">Partners</h3>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/70 leading-relaxed text-justify md:text-left max-w-4xl mb-12">
              Collaboration is the heartbeat of our craft. We believe in the power of a shared pulse, where corporate precision meets the raw energy of cultural expression. Every alliance we forge is more than a project—it is a collective step toward a new visual era.
            </p>

            {/* Client Logos Grid */}
            <div className="flex flex-wrap justify-start items-center gap-6 md:gap-8">
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
          </section>
        </div>
      </div>
    </main>
  );
}

