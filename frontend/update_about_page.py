import re

with open('src/modules/client-site/pages/AboutPage.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace('import { motion } from "framer-motion";', 'import { motion } from "framer-motion";\nimport { SpiralGallery } from "../../shared/components/SpiralGallery";')

# Define new section
new_section = """
          {/* Section: Behind The Scenes */}
          <motion.section 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="w-full relative overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
              
              {/* Left panel: Info */}
              <motion.div 
                className="lg:col-span-4 flex flex-col justify-between bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 md:p-8 z-10 min-h-[400px] lg:min-h-0"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-widest text-[#BC0A0A] font-semibold mb-2">Agency Study</span>
                  <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-1">Behind The Scenes</h2>
                  <p className="text-xs text-white/40 tracking-wider uppercase">Visual Breakdown & Concept Art</p>
                  
                  <p className="text-sm leading-relaxed text-white/70 font-light mt-6 mb-8">
                    An interactive exploration of cinematic lighting, material styling, and modular set designs. 
                    Use your <strong className="text-white font-medium">mouse wheel</strong> or <strong className="text-white font-medium">swipe vertically</strong> on the spiral to navigate through the assets.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/30 tracking-widest uppercase">Client</span>
                      <span className="text-xs font-medium text-white/90">204PROD.</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/30 tracking-widest uppercase">Category</span>
                      <span className="text-xs font-medium text-white/90">Creative Agency</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/30 tracking-widest uppercase">Format</span>
                      <span className="text-xs font-medium text-white/90">Cinematic Stills</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/30 tracking-widest uppercase">Aspect Ratio</span>
                      <span className="text-xs font-medium text-white/90">2.39:1 Anamorphic</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center gap-2 text-[10px] tracking-wider text-white/40 uppercase font-medium bg-white/5 py-2 px-3 rounded border border-white/5 self-start">
                  <span className="text-xs">🖱️</span> Drag anywhere on the spiral to rotate space
                </div>
              </motion.div>

              {/* Right panel: 3D Spiral */}
              <div className="lg:col-span-8 min-h-[500px] lg:min-h-[600px] w-full relative">
                <SpiralGallery urls={[
                  "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1535016120720-40c746a659ec?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?auto=format&fit=crop&w=1200&q=80"
                ]} />
              </div>
            </div>
          </motion.section>"""

# Find the partners section
pattern = r"\{/\* Section: Partners \*/\}.*?</motion\.section>"
new_content = re.sub(pattern, new_section, content, flags=re.DOTALL)

with open('src/modules/client-site/pages/AboutPage.tsx', 'w') as f:
    f.write(new_content)

print("AboutPage.tsx updated successfully.")
