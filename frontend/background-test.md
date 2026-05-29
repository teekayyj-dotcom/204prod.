javascript: 
        const imageUrls = [
'https://images.unsplash.com/photo-1638959882708-9503b1cd595f?w=800&q=80',
'https://images.unsplash.com/photo-1644469709847-454ef12d5144?w=800&q=80',
'https://images.unsplash.com/photo-1731848356615-90cba9fdc862?w=800&q=80',
'https://images.unsplash.com/photo-1688388040015-c3985c83a12d?w=800&q=80',
'https://images.unsplash.com/photo-1726591383648-5b5cbe1da1a2?w=800&q=80',
'https://images.unsplash.com/photo-1651745314014-a9432659af40?w=800&q=80',
'https://images.unsplash.com/photo-1635585244467-134d68caad51?w=800&q=80',
'https://images.unsplash.com/photo-1517498327491-f903e1e281cd?w=800&q=80',
'https://images.unsplash.com/photo-1584969405346-5230ae2bc4fc?w=800&q=80',
'https://images.unsplash.com/photo-1615212049275-95561aebe1b4?w=800&q=80',
'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80',
'https://images.unsplash.com/photo-1516727003284-a96541e51e9c?w=800&q=80',
'https://images.unsplash.com/photo-1530735038726-a73fd6e6a349?w=800&q=80',
'https://images.unsplash.com/photo-1548918901-9b31223c5c3a?w=800&q=80',
'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
'https://images.unsplash.com/photo-1553544260-f87e671974ee?w=800&q=80',
'https://images.unsplash.com/photo-1512084747998-038941f49b84?w=800&q=80',
'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&q=80',
'https://images.unsplash.com/photo-1532170579297-281918c8ae72?w=800&q=80',
'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=800&q=80',
'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&q=80',
'https://images.unsplash.com/photo-1593010932917-92bd21088dee?w=800&q=80',
        ];
        
        const numberOfImages = imageUrls.length;
        let scene, camera, renderer, spiralMesh, tiltGroup, shaderMaterial;
        let scrollOffset = 0;
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let dragRotation = { x: 0, z: 0 };
        let baseRotation = { x: 0, z: 0 };
        let imageRatios = [];
        
        let inertiaParams = {
            friction: 0.94,
            strength: 0.8,
            maxSpeed: 0.05,
            directionSmoothing: 0.92,
            scrollSensitivity: 0.0008
        };
        
        let config = {
            imageHeight: 7,
            curvature: -0.030,
            gapSize: 0,
            spiralRadius: 3.5,
            spiralTurns: 2.8 + (numberOfImages - 21) * 0.1,
            spiralHeight: 12 + (numberOfImages - 21) * 0.25,
            centerX: 2.2,
            centerY: 4.38,
            centerZ: 0
        };

        let originalPositions = [];
        
        let targetVelocity = 0;
        let currentVelocity = 0;
        let lastDelta = 0;

        let touchStartY = 0;
        let touchLastY = 0;
        let touchVelocity = 0;
        let touchAcceleration = 0;
        let isTouching = false;
        let lastTouchTimestamp = 0;
				console.log("&Toc on codepen - https://codepen.io/ol-ivier");
        
        function setupTouchControls() {
            const container = document.getElementById('webgl-container');
            container.style.pointerEvents = 'auto';
            
            container.addEventListener('touchstart', (e) => {
                e.preventDefault();
                isTouching = true;
                touchStartY = e.touches[0].clientY;
                touchLastY = touchStartY;
                touchVelocity = 0;
                touchAcceleration = 0;
                lastTouchTimestamp = performance.now();
                container.style.cursor = 'grabbing';
            }, { passive: false });
            
            container.addEventListener('touchmove', (e) => {
                if (!isTouching) return;
                e.preventDefault();
                
                const now = performance.now();
                let deltaTime = Math.min(32, now - lastTouchTimestamp);
                if (deltaTime < 1) deltaTime = 16;
                lastTouchTimestamp = now;
                
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - touchLastY;
                
                const rawVelocity = deltaY * inertiaParams.scrollSensitivity * inertiaParams.strength * 0.5;
                touchVelocity = touchVelocity * 0.7 + rawVelocity * 0.3;
                
                let deltaScroll = deltaY * inertiaParams.scrollSensitivity * inertiaParams.strength * 0.8;
                scrollOffset += deltaScroll;
                updateUVOffset();
                
                touchLastY = currentY;
            }, { passive: false });
            
            container.addEventListener('touchend', (e) => {
                e.preventDefault();
                isTouching = false;
                container.style.cursor = 'grab';
                
                if (Math.abs(touchVelocity) > 0.001) {
                    targetVelocity = touchVelocity * 1.2;
                    targetVelocity = Math.max(-inertiaParams.maxSpeed * 1.5, Math.min(inertiaParams.maxSpeed * 1.5, targetVelocity));
                }
                touchVelocity = 0;
            });
            
            let touchDragStartX = 0;
            let touchDragStartY = 0;
            let isDraggingTouch = false;
            
            container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    isDraggingTouch = true;
                    touchDragStartX = e.touches[1].clientX;
                    touchDragStartY = e.touches[1].clientY;
                }
            });
            
            container.addEventListener('touchmove', (e) => {
                if (isDraggingTouch && e.touches.length === 2) {
                    e.preventDefault();
                    const dx = e.touches[1].clientX - touchDragStartX;
                    const dy = e.touches[1].clientY - touchDragStartY;
                    dragRotation.z += dx * 0.003;
                    dragRotation.x -= dy * 0.003;
                    dragRotation.x = Math.max(-0.35, Math.min(0.35, dragRotation.x));
                    dragRotation.z = Math.max(-0.35, Math.min(0.35, dragRotation.z));
                    tiltGroup.rotation.x = baseRotation.x + dragRotation.x;
                    tiltGroup.rotation.z = baseRotation.z + dragRotation.z;
                    touchDragStartX = e.touches[1].clientX;
                    touchDragStartY = e.touches[1].clientY;
                }
            });
            
            container.addEventListener('touchend', (e) => {
                isDraggingTouch = false;
            });
        }
        
        function updateTouchInertia() {
            if (!isTouching) {
                touchVelocity *= 0.95;
                if (Math.abs(touchVelocity) > 0.0001) {
                    scrollOffset += touchVelocity * 0.5;
                    updateUVOffset();
                } else {
                    touchVelocity = 0;
                }
            }
        }
        
        function rebuildGeometry() {
            if (!spiralMesh) return;
            
            const totalSlots = imageRatios.length;
            const widths = imageRatios.map(r => r * config.imageHeight);
            const totalWidth = widths.reduce((a, b) => a + b, 0);
            const segmentsW = 200 + totalSlots * 20;
            const segmentsH = 24;
            
            const geometry = new THREE.PlaneGeometry(totalWidth, config.imageHeight, segmentsW, segmentsH);
            const positions = geometry.attributes.position;
            const uvs = geometry.attributes.uv;
            
            let origX = [];
            let origY = [];
            for (let i = 0; i < positions.count; i++) {
                origX.push(positions.getX(i));
                origY.push(positions.getY(i));
            }
            
            let cumulative = [0];
            for (let i = 0; i < totalSlots; i++) {
                cumulative.push(cumulative[i] + widths[i] / totalWidth);
            }
            
            const imageRatio = 1 - config.gapSize;
            
            for (let i = 0; i < uvs.count; i++) {
                let u = uvs.getX(i);
                u = Math.max(0, Math.min(0.999999, u));
                
                let found = false;
                for (let j = 0; j < totalSlots; j++) {
                    if (u >= cumulative[j] && u < cumulative[j + 1]) {
                        let localU = (u - cumulative[j]) / (cumulative[j + 1] - cumulative[j]);
                        
                        if (localU > imageRatio) {
                            uvs.setX(i, cumulative[j + 1] - 0.001);
                        } else {
                            let scaledU = localU / imageRatio;
                            const edgeMargin = 0.001;
                            scaledU = Math.max(edgeMargin, Math.min(1 - edgeMargin, scaledU));
                            let newU = cumulative[j] + scaledU * (cumulative[j + 1] - cumulative[j]);
                            uvs.setX(i, newU);
                        }
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    uvs.setX(i, cumulative[totalSlots] - 0.001);
                }
            }
            
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                const nx = x / (totalWidth / 2);
                const curve = config.curvature * 0.4 * (nx * nx - 1);
                positions.setXYZ(i, x, y, -curve);
            }
            
            for (let i = 0; i < positions.count; i++) {
                const x = origX[i];
                const y = origY[i];
                let t = (x + totalWidth / 2) / totalWidth;
                t = Math.max(0, Math.min(1, t));
                
                const angle = t * Math.PI * 2 * config.spiralTurns;
                const radius = config.spiralRadius * (1 - t * 0.12);
                let px = Math.sin(angle) * radius;
                let pz = Math.cos(angle) * radius;
                let py = (t - 0.5) * config.spiralHeight + y * 0.35;
                
                if (!originalPositions[i]) {
                    originalPositions[i] = { 
                        x: px, y: py, z: pz, 
                        offsetX: (Math.random() - 0.5) * 0.001, 
                        offsetY: (Math.random() - 0.5) * 0.001, 
                        offsetZ: (Math.random() - 0.5) * 0.001 
                    };
                }
                
                px += originalPositions[i].offsetX;
                py += originalPositions[i].offsetY;
                pz += originalPositions[i].offsetZ;
                
                positions.setXYZ(i, px, py, pz);
            }
            
            geometry.computeVertexNormals();
            
            const oldGeo = spiralMesh.geometry;
            spiralMesh.geometry = geometry;
            if (oldGeo) oldGeo.dispose();
            
            if (shaderMaterial) {
                shaderMaterial.uniforms.gap.value = config.gapSize;
            }
        }
        
        function updateUVOffset() {
            if (!shaderMaterial) return;
            let offset = scrollOffset;
            while (offset >= 1.0) offset -= 1.0;
            while (offset < 0) offset += 1.0;
            shaderMaterial.uniforms.offset.value = offset;
        }

        function createMasterTexture() {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const baseHeight = 500;
                let loaded = 0;
                let images = [];

                imageUrls.forEach((url, idx) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';

                    img.onload = () => {
                        const ratio = img.naturalWidth / img.naturalHeight;
                        imageRatios[idx] = ratio;
                        const width = baseHeight * ratio;
                        
                        images[idx] = { img, width, height: baseHeight };

                        loaded++;

                        if (loaded === numberOfImages) {
                            const totalWidth = images.reduce((sum, i) => sum + i.width, 0);
                            canvas.width = totalWidth;
                            canvas.height = baseHeight;
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            
                            let offsetX = 0;
                            images.forEach((data) => {
                                if (data && data.img) {
                                    ctx.drawImage(data.img, offsetX, 0, data.width, data.height);
                                }
                                offsetX += data.width;
                            });
                            
                            const tex = new THREE.CanvasTexture(canvas);
                            tex.wrapS = THREE.RepeatWrapping;
                            tex.wrapT = THREE.ClampToEdgeWrapping;
                            tex.minFilter = THREE.LinearFilter;
                            tex.magFilter = THREE.LinearFilter;
                            tex.generateMipmaps = false;
                            resolve(tex);
                        }
                    };

                    img.onerror = () => {
                        imageRatios[idx] = 0.8;
                        loaded++;
                        if (loaded === numberOfImages) {
                            const tex = new THREE.CanvasTexture(canvas);
                            resolve(tex);
                        }
                    };

                    img.src = url;
                });
            });
        }

        async function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000);
            
            camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 3.5, 9);
            
            renderer = new THREE.WebGLRenderer({ 
                canvas: document.getElementById('webgl-canvas'), 
                antialias: true
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            const ambient = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambient);
            const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
            mainLight.position.set(5, 8, 5);
            scene.add(mainLight);
            
            tiltGroup = new THREE.Group();
            baseRotation = { x: -0.18, z: 0.12 };
            tiltGroup.rotation.x = baseRotation.x;
            tiltGroup.rotation.z = baseRotation.z;
            scene.add(tiltGroup);
            
            const texture = await createMasterTexture();
            
            shaderMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: texture },
                    gap: { value: config.gapSize },
                    offset: { value: 0.0 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D map;
                    uniform float gap;
                    uniform float offset;
                    varying vec2 vUv;
                    
                    void main() {
                        float u = vUv.x + offset;
                        
                        if (u >= 1.0) u -= 1.0;
                        if (u < 0.0) u += 1.0;
                        
                        vec4 color = texture2D(map, vec2(u, vUv.y));
                        gl_FragColor = color;
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide
            });
            
            spiralMesh = new THREE.Mesh(new THREE.BufferGeometry(), shaderMaterial);
            spiralMesh.position.set(config.centerX, config.centerY, config.centerZ);
            spiralMesh.rotation.x = 0.35;
            spiralMesh.rotation.y = 0;
            tiltGroup.add(spiralMesh);
            
            rebuildGeometry();
            
            window.addEventListener('resize', onResize);
            setupFluidInertia();
            setupDrag();
            setupArrowKeysZoom();
            setupTouchControls(); 
            createBTSPanel();
            
            animate();
        }

        function createBTSPanel() {
            const container = document.getElementById('webgl-container') || document.body;
            
            const bts = document.createElement('div');
            bts.id = 'bts-sidebar';
            
            bts.innerHTML = `
                <div class="bts-header">
                    <span class="bts-tag">Production Study</span>
                    <h1 class="bts-title">Behind the Scenes</h1>
                    <p class="bts-subtitle">Visual Breakdown & Concept Art</p>
                </div>
                
                <div class="bts-content">
                    <p class="bts-desc">
                        An interactive exploration of cinematic lighting, material styling, and modular set designs. 
                        Use the <strong>mouse wheel</strong> or <strong>drag vertically</strong> to navigate the asset spiral.
                    </p>
                    
                    <div class="bts-meta-grid">
                        <div class="bts-meta-item">
                            <span class="bts-meta-label">Camera</span>
                            <span class="bts-meta-val">RED V-Raptor 8K</span>
                        </div>
                        <div class="bts-meta-item">
                            <span class="bts-meta-label">Color Space</span>
                            <span class="bts-meta-val">ACEScg / Rec.709</span>
                        </div>
                        <div class="bts-meta-item">
                            <span class="bts-meta-label">Ratio</span>
                            <span class="bts-meta-val">2.39:1 Anamorphic</span>
                        </div>
                        <div class="bts-meta-item">
                            <span class="bts-meta-label">Format</span>
                            <span class="bts-meta-val">Cinematic Film Stills</span>
                        </div>
                    </div>
                </div>
                
                <div class="bts-footer">
                    <div class="bts-control-hint">
                        <span class="bts-hint-icon">🖱️</span> Drag anywhere to rotate & tilt 3D spiral
                    </div>
                </div>
            `;
            container.appendChild(bts);
        }
        
        function setupFluidInertia() {
            let lastTimestamp = 0;
            let acceleration = 0;
            
            window.addEventListener('wheel', (e) => {
                e.preventDefault();
                
                const now = performance.now();
                let deltaTime = Math.min(32, now - lastTimestamp);
                if (deltaTime < 1) deltaTime = 16;
                lastTimestamp = now;
                
                const rawDelta = e.deltaY * inertiaParams.scrollSensitivity * inertiaParams.strength;
                
                let maxAccel = 0.015;
                let deltaAccel = rawDelta - acceleration;
                deltaAccel = Math.max(-maxAccel, Math.min(maxAccel, deltaAccel));
                acceleration += deltaAccel;
                
                acceleration = Math.max(-0.03, Math.min(0.03, acceleration));
                
                let targetDelta = acceleration;
                targetVelocity = targetVelocity * inertiaParams.directionSmoothing + targetDelta * (1 - inertiaParams.directionSmoothing);
                
                targetVelocity = Math.max(-inertiaParams.maxSpeed, Math.min(inertiaParams.maxSpeed, targetVelocity));
                
            }, { passive: false });
            
            function updateInertia() {
                targetVelocity *= inertiaParams.friction;
                
                currentVelocity = currentVelocity * 0.85 + targetVelocity * 0.15;
                
                if (Math.abs(currentVelocity) > 0.0001) {
                    scrollOffset += currentVelocity;
                    updateUVOffset();
                } else {
                    currentVelocity = 0;
                    targetVelocity = 0;
                    acceleration = 0;
                }
                
                updateTouchInertia();
            }
            
            window._updateInertia = updateInertia;
        }
        
       
        
        function setupArrowKeysZoom() {
            let zoomLevel = 1.0;
            const minZoom = 0.84;
            const maxZoom = 1;
            
            window.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    zoomLevel += 0.05;
                    if (zoomLevel > maxZoom) zoomLevel = maxZoom;
                    camera.position.z = 9 / zoomLevel;
                    camera.position.y = 3.5 / zoomLevel;
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    zoomLevel -= 0.05;
                    if (zoomLevel < minZoom) zoomLevel = minZoom;
                    camera.position.z = 9 / zoomLevel;
                    camera.position.y = 3.5 / zoomLevel;
                }
            });
        }
        
        function setupDrag() {
            const container = document.getElementById('webgl-container');
            container.style.pointerEvents = 'auto';
            container.style.cursor = 'grab';
            
            container.addEventListener('mousedown', (e) => {
                isDragging = true;
                previousMousePosition = { x: e.clientX, y: e.clientY };
                container.style.cursor = 'grabbing';
                e.preventDefault();
            });
            
            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - previousMousePosition.x;
                const dy = e.clientY - previousMousePosition.y;
                dragRotation.z += dx * 0.002;
                dragRotation.x -= dy * 0.002;
                dragRotation.x = Math.max(-0.35, Math.min(0.35, dragRotation.x));
                dragRotation.z = Math.max(-0.35, Math.min(0.35, dragRotation.z));
                tiltGroup.rotation.x = baseRotation.x + dragRotation.x;
                tiltGroup.rotation.z = baseRotation.z + dragRotation.z;
                previousMousePosition = { x: e.clientX, y: e.clientY };
            });
            
            window.addEventListener('mouseup', () => { 
                isDragging = false;
                container.style.cursor = 'grab';
            });
        }
        
        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        function animate() {
            requestAnimationFrame(animate);
            
            if (window._updateInertia) {
                window._updateInertia();
            }
            
            renderer.render(scene, camera);
        }
        
        init();

css:
  @import url('https://fonts.googleapis.com/css2?family=Monoton&display=swap');
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: black;
            color: white;
            min-height: 100vh;
            overflow-x: hidden;
            height: 100vh;
            overflow-y: hidden;
        }

        #webgl-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        }

        #webgl-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            outline: none;
        }

        #credits {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgb(30 30 30 / .9);
            padding: 8px 12px;
            border-radius: 6px;
            color: #fff;
            font-size: 14px;
            z-index: 2;
        }

        #instructions {
            position: fixed;
            max-width: 251px;
            top: 20px;
            right: 20px;
            background: rgb(30 30 30 / .9);
            padding: 8px 12px;
            border-radius: 6px;
            color: #fff;
            font-family: "Monoton", sans-serif;
            text-transform: uppercase;
            font-size: 3em;
            text-align: right;
            z-index: 2;
        }

        @media (max-width: 768px) {
            #instructions {
                display: none;
            }
        }

        .copy {
            position: fixed;
            top: 20px;
            left: 20px;
            color: #000;
            background: rgb(255 255 255 / .7);
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 2;
        }

				.infos {
    position: fixed;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    z-index: 10;
    background: #fff;
    padding: 8px;
    border-radius: 8px;
    font-size: 13px;
    color: #000;
    cursor: pointer
		}

        a {
        color: tomato;
        text-decoration: none;
        }

        a:hover {
        color: #10cbea;;
        transition: all 1s ease;
        }
        
       
    