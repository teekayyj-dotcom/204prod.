import { motion, type Variants } from "framer-motion";
import { SpiralGallery } from "../../../shared/components/SpiralGallery";
import { useState, useEffect } from "react";
import { fetchApi } from "../../admin/utils/apiClient";

export function AboutPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    },
  };

  const highlightVariants: Variants = {
    hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
    },
  };

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
  };

  const textArray = [
    "A", "vision", "is", "only", "as", "powerful", "as", "the", "network", "that", "carries", "it.", 
    "At", "204PROD.,", "we", "build", "a", 
    { word: "collective", highlight: true }, "transcending", { word: "boundaries", highlight: true }, ",", 
    "from", "corporate", "giants", "to", "the", "raw", "pulse", "of", 
    { word: "underground", highlight: true }, { word: "culture", highlight: true }, ".", 
    "We", "bridge", "global", "standards", "and", { word: "local", highlight: true }, { word: "soul", highlight: true }, ",", 
    "ensuring", "every", "alliance", "is", "an", { word: "evolution", highlight: true }, ".", 
    "Collaborating", "with", "those", "who", "dare", "to", "lead,", "we", "translate", "disparate", "ambitions", "into", "a", 
    { word: "unified", highlight: true }, { word: "visual", highlight: true }, { word: "language", highlight: true }, ".", 
    "We", "don't", "just", "reach", "milestones;", "we", "redefine", "the", "trajectory", "of", "storytelling,", "moving", 
    { word: "4ward", highlight: true }, "with", "every", "partnership", "we", "forge."
  ];

  const [partners, setPartners] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    fetchApi('/projects/clients/all')
      .then((data: any[]) => {
        const mapped = data
          .filter(c => c.logo_media_url)
          .map(c => ({
            name: c.name,
            url: c.logo_media_url
          }));
        setPartners(mapped);
      })
      .catch(err => console.error("Failed to load clients:", err));
  }, []);

  const mid = Math.ceil(partners.length / 2);
  const row1 = partners.slice(0, mid);
  const row2 = partners.slice(mid);

  const getRepeated = (arr: any[]) => {
    if (arr.length === 0) return [];
    let repeated = [...arr];
    while (repeated.length < 12) {
      repeated = [...repeated, ...arr];
    }
    return repeated;
  };

  const repeatedRow1 = getRepeated(row1);
  const repeatedRow2 = getRepeated(row2);

  return (
    <main className="home-shell bg-[#050505] min-h-screen text-white/90 selection:bg-[#BC0A0A] selection:text-white">
      <div className="px-6 md:px-12 max-w-[1600px] mx-auto pb-24 overflow-hidden">
        
        {/* Animated Hero Text Container - 100vh */}
        <div className="min-h-[100dvh] flex flex-col justify-center pt-24 pb-12">
          <motion.h2
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-[clamp(1.6rem,4vw,3.8rem)] leading-[1.15] tracking-tight font-[450] text-justify md:text-left flex flex-wrap gap-x-[0.25em] gap-y-2"
            style={{ letterSpacing: "-0.02em" }}
          >
          {textArray.map((item, index) => {
            if (typeof item === "string") {
              return (
                <motion.span key={index} variants={textVariants} className="inline-block">
                  {item}
                </motion.span>
              );
            } else {
              return (
                <span key={index} className="inline-flex overflow-hidden align-bottom">
                  <motion.span
                    variants={highlightVariants}
                    className="inline-block text-[#BC0A0A] font-semibold"
                  >
                    {item.word}
                  </motion.span>
                </span>
              );
            }
          })}
          </motion.h2>
        </div>

        <div className="flex flex-col gap-24 mt-12 md:mt-24">
          
          {/* Section: Service */}
          <motion.section 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="w-full"
          >
            <h3 className="text-2xl md:text-3xl font-light mb-6 text-white uppercase tracking-wider relative after:content-[''] after:absolute after:-bottom-4 after:left-0 after:w-12 after:h-px after:bg-[#BC0A0A]">
              Service
            </h3>
            <p className="text-sm uppercase tracking-[0.15em] text-white/60 leading-relaxed mt-10 max-w-4xl">
              Our services are a fluid bridge between strategy and art, designed to adapt and elevate. We don't just provide production; we offer a versatile ecosystem of high-end cinematography and photography that transforms abstract brand identities into immersive experiences.
            </p>
          </motion.section>

          {/* Section: Client */}
          <motion.section 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="w-full"
          >
            <h3 className="text-2xl md:text-3xl font-light mb-6 text-white uppercase tracking-wider relative after:content-[''] after:absolute after:-bottom-4 after:left-0 after:w-12 after:h-px after:bg-[#BC0A0A]">
              Client
            </h3>
            
            <div 
              className="mt-16 md:mt-24 flex flex-col gap-12 relative overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)"
              }}
            >
              
              {/* Line 1 - Scrolling Left */}
              {repeatedRow1.length > 0 && (
                <motion.div 
                  className="flex w-max gap-16 md:gap-24 pr-16 md:pr-24"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ repeat: Infinity, ease: "linear", duration: 35 }}
                >
                  {[...repeatedRow1, ...repeatedRow1].map((partner, index) => (
                    <div 
                      key={`row1-${index}`}
                      className="w-[120px] md:w-[160px] aspect-[3/2] relative flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 opacity-40 hover:opacity-100 flex-shrink-0"
                    >
                      <img 
                        src={partner.url} 
                        alt={`${partner.name} logo`} 
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Line 2 - Scrolling Right */}
              {repeatedRow2.length > 0 && (
                <motion.div 
                  className="flex w-max gap-16 md:gap-24 pr-16 md:pr-24"
                  animate={{ x: ["-50%", "0%"] }}
                  transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
                >
                  {[...repeatedRow2, ...repeatedRow2].map((partner, index) => (
                    <div 
                      key={`row2-${index}`}
                      className="w-[120px] md:w-[160px] aspect-[3/2] relative flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 opacity-40 hover:opacity-100 flex-shrink-0"
                    >
                      <img 
                        src={partner.url} 
                        alt={`${partner.name} logo`} 
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.section>        </div>
      </div>
    </main>
  );
}
