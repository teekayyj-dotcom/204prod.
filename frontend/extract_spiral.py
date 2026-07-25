import re

with open('src/modules/client-site/pages/ProjectDetail.tsx', 'r') as f:
    lines = f.readlines()

# Extract useEffect for canvas (lines 28-514 approx)
# Find start of useEffect
start_idx = -1
for i, line in enumerate(lines):
    if "useEffect(() => {" in line and "const canvas = canvasRef.current;" in lines[i+1]:
        start_idx = i
        break

# Find end of useEffect
end_idx = -1
braces = 0
for i in range(start_idx, len(lines)):
    line = lines[i]
    braces += line.count('{')
    braces -= line.count('}')
    if braces == 0 and "}, [project, project?.behindTheScenes, project?.image]);" in line:
        end_idx = i
        break

use_effect_lines = lines[start_idx:end_idx+1]
# We need to replace the dependencies
use_effect_lines[-1] = "  }, [urls]);\n"

# Remove the project specific url handling inside the useEffect
# Lines to remove:
# let urls = (project.behindTheScenes || []).map((img: any) => img.url);
# if (urls.length === 0) {
#   urls = [project.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"];
# }
new_use_effect_lines = []
skip = False
for line in use_effect_lines:
    if "let urls = (project.behindTheScenes" in line:
        skip = True
        new_use_effect_lines.append("    let activeUrls = [...urls];\n")
        new_use_effect_lines.append("    if (activeUrls.length === 0) { activeUrls = [\"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80\"]; }\n")
        continue
    if skip:
        if "urls = urls.slice(0, 24);" in line:
            skip = False
            new_use_effect_lines.append("    while (activeUrls.length > 0 && activeUrls.length < 15) {\n")
            new_use_effect_lines.append("      activeUrls = [...activeUrls, ...activeUrls];\n")
            new_use_effect_lines.append("    }\n")
            new_use_effect_lines.append("    activeUrls = activeUrls.slice(0, 24);\n")
            new_use_effect_lines.append("    const numberOfImages = activeUrls.length;\n")
        continue
    if "urls.length" in line and not skip:
        # these instances should probably use activeUrls now
        line = line.replace("urls.length", "activeUrls.length")
    if "urls," in line and not skip:
        line = line.replace("urls,", "activeUrls,")
    if "urls =" in line and not skip:
        line = line.replace("urls = ", "activeUrls = ")
    new_use_effect_lines.append(line)

use_effect_body = "".join(new_use_effect_lines)

# Create SpiralGallery.tsx
component_code = f"""import React, {{ useEffect, useRef }} from 'react';
import {{ motion }} from 'framer-motion';
import * as THREE from 'three';

interface SpiralGalleryProps {{
  urls: string[];
  className?: string;
}}

export function SpiralGallery({{ urls, className = "" }}: SpiralGalleryProps) {{
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

{use_effect_body}

  return (
    <motion.div 
      ref={{containerRef}}
      className={{`relative min-h-[500px] lg:min-h-[600px] bg-zinc-950/20 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center cursor-grab active:cursor-grabbing group shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] ${{className}}`}}
      initial={{{{ opacity: 0, x: 30 }}}}
      whileInView={{{{ opacity: 1, x: 0 }}}}
      viewport={{{{ once: true }}}}
      transition={{{{ duration: 0.8 }}}}
    >
      <canvas ref={{canvasRef}} className="absolute inset-0 w-full h-full outline-none" />
      
      {{/* Subtle overlay hint */}}
      <div className="absolute bottom-4 right-4 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 text-[9px] tracking-widest uppercase text-white/50 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-sans">
        <div className="w-1.5 h-1.5 rounded-full bg-[#EB5B00] animate-pulse" />
        Interactive 3D Spiral
      </div>
    </motion.div>
  );
}}
"""

with open('src/shared/components/SpiralGallery.tsx', 'w') as f:
    f.write(component_code)

print("Created SpiralGallery.tsx successfully.")
