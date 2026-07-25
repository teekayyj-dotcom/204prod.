import re

with open('src/modules/client-site/pages/ProjectDetail.tsx', 'r') as f:
    lines = f.readlines()

# We need to insert the import for SpiralGallery
import_added = False
for i, line in enumerate(lines):
    if "import * as THREE from 'three';" in line:
        lines.insert(i + 1, "import { SpiralGallery } from '../../../shared/components/SpiralGallery';\n")
        import_added = True
        break

if not import_added:
    lines.insert(2, "import { SpiralGallery } from '../../../shared/components/SpiralGallery';\n")

# Find the start of the useEffect to remove (the one with canvasRef.current)
start_idx = -1
for i, line in enumerate(lines):
    if "useEffect(() => {" in line and "const canvas = canvasRef.current;" in lines[i+1]:
        start_idx = i
        break

# Find the end of this useEffect
end_idx = -1
braces = 0
for i in range(start_idx, len(lines)):
    line = lines[i]
    braces += line.count('{')
    braces -= line.count('}')
    if braces == 0 and "}, [project, project?.behindTheScenes, project?.image]);" in line:
        end_idx = i
        break

# We need to keep the `urls` extraction logic since we need to pass it to the new component
url_extraction = """
  let urls = (project?.behindTheScenes || []).map((img: any) => img.url);
  if (urls.length === 0) {
    urls = [project?.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"];
  }
"""

# Replace the giant useEffect and the two unused refs
# Find the refs:
ref_start = -1
for i in range(start_idx - 10, start_idx):
    if "const canvasRef = useRef<HTMLCanvasElement>(null);" in lines[i]:
        ref_start = i
        break

lines_to_keep_before = lines[:ref_start]
lines_to_keep_after = lines[end_idx+1:]

new_lines = lines_to_keep_before + [url_extraction] + lines_to_keep_after

# Now we need to replace the rendering logic
# Find the right panel
right_panel_start = -1
for i, line in enumerate(new_lines):
    if "{/* Right panel: Three.js WebGL canvas */}" in line:
        right_panel_start = i
        break

right_panel_end = -1
braces = 0
for i in range(right_panel_start + 1, len(new_lines)):
    line = new_lines[i]
    if "<motion.div" in line:
        braces += 1
    if "</motion.div>" in line:
        braces -= 1
        if braces == -1: # We started without counting the first motion.div open tag in right_panel_start line if it was multi-line. Wait, right_panel_start just has the comment.
            pass
    # A safer way to find the end is to look for the end of the section or next component
    # Actually, looking at ProjectDetail, it's:
    # {/* Right panel: Three.js WebGL canvas */}
    # <motion.div ...>
    #   <canvas ... />
    #   ...
    # </motion.div>
    # 
    # </div>
    # </section>

# A simpler regex substitution for the right panel:
content_str = "".join(new_lines)
pattern = r"\{/\* Right panel: Three\.js WebGL canvas \*/\}.*?</motion\.div>"
replacement = r"""{/* Right panel: Three.js WebGL canvas */}
          <div className="lg:col-span-8 h-full min-h-[500px] lg:min-h-[600px]">
            <SpiralGallery urls={urls} />
          </div>"""
new_content_str = re.sub(pattern, replacement, content_str, flags=re.DOTALL)

with open('src/modules/client-site/pages/ProjectDetail.tsx', 'w') as f:
    f.write(new_content_str)

print("ProjectDetail.tsx updated successfully.")
