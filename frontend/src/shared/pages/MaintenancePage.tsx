import React, { useEffect, useRef } from 'react';
import { Instagram, Facebook, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';

// Vector class for the canvas particle simulation
class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(v: Vector): Vector {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    addTo(v: Vector): void {
        this.x += v.x;
        this.y += v.y;
    }

    sub(v: Vector): Vector {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    getLength(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    setLength(len: number): void {
        const currentLen = this.getLength();
        if (currentLen > 0) {
            this.x = (this.x / currentLen) * len;
            this.y = (this.y / currentLen) * len;
        }
    }
}

// Repeller Planet class
class Planet {
    pos: Vector;
    g: number;

    constructor(x: number, y: number, g: number) {
        this.pos = new Vector(x, y);
        this.g = g;
    }
}

// Particle class forming the text
class Particle {
    pos: Vector;
    vel: Vector;

    constructor(x: number, y: number, spikeLength: number) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, spikeLength);
    }

    move(force: Vector, spikeLength: number): void {
        if (force) {
            this.vel.addTo(force);
        }
        if (this.vel.getLength() > spikeLength) {
            this.vel.setLength(spikeLength);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        const p2 = this.pos.add(this.vel);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
}

export function MaintenancePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);

        const config = {
            text: "204PROD.",
            widthToSpikeLengthRatio: 0.054
        };

        const colorConfig = {
            particleOpacity: 0.18,
            baseHue: 350,
            hueRange: 9,
            hueSpeed: 0.02,
            colorSaturation: 100,
        };

        let hue = colorConfig.baseHue;
        let particles: Particle[] = [];
        let spikeLength = w * config.widthToSpikeLengthRatio;
        let planets: Planet[] = [];
        let A = w / 2.2;
        let B = h / 2.2;
        let a = 3;
        let b = 2;
        let tick = 0;
        let animationFrameId: number;

        // Initialize Planets
        const setup = () => {
            planets = [];
            planets.push(new Planet(w / 2, h / 2, 4500));

            const orbitsCount = 4;
            for (let i = 0; i < orbitsCount; i++) {
                planets.push(new Planet(50 + i * 150, h / 2, 1200));
            }
            drawText();
        };

        const drawText = () => {
            if (!ctx) return;
            ctx.save();
            const fontSize = Math.min(w * 0.22, 220);
            ctx.font = `900 ${fontSize}px "Space Grotesk", sans-serif, Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 4.5;
            ctx.strokeStyle = "white";
            ctx.strokeText(config.text, w / 2, h / 2);
            ctx.restore();

            const imageData = ctx.getImageData(0, 0, w, h);
            particles = [];

            const step = w < 768 ? 6 : 4;
            for (let x = 0; x < w; x += step) {
                for (let y = 0; y < h; y += step) {
                    const idx = (x + w * y) * 4;
                    if (imageData.data[idx + 3] > 120) {
                        particles.push(new Particle(x, y, spikeLength));
                    }
                }
            }
            ctx.clearRect(0, 0, w, h);
        };

        const reset = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            spikeLength = w * config.widthToSpikeLengthRatio;
            A = w / 2.3;
            B = h / 2.3;
            setup();
        };

        const mousemove = (event: MouseEvent) => {
            if (planets[0]) {
                planets[0].pos.x = event.clientX;
                planets[0].pos.y = event.clientY;
            }
        };

        const draw = (now: number) => {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);

            tick = now / 40;
            hue += colorConfig.hueSpeed;
            const currentHue = Math.sin(hue) * colorConfig.hueRange + colorConfig.baseHue;
            ctx.strokeStyle = `hsla(${currentHue}, ${colorConfig.colorSaturation}%, 50%, ${colorConfig.particleOpacity})`;

            const len = planets.length;
            for (let i = 1; i < len; i++) {
                const angle = ((Math.PI * 2) / (len - 1)) * i;
                const x = A * Math.sin(a * (tick / 150) + angle) + w / 2;
                const y = B * Math.sin(b * (tick / 150) + angle) + h / 2;
                planets[i].pos.x = x;
                planets[i].pos.y = y;
            }

            particles.forEach((p) => {
                planets.forEach((planet) => {
                    const d = p.pos.sub(planet.pos);
                    const length = d.getLength();
                    let forceStrength = planet.g / length;
                    if (forceStrength > 35) {
                        forceStrength = 35;
                    }
                    d.setLength(forceStrength);
                    p.move(d, spikeLength);
                });
                p.draw(ctx);
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener("resize", reset);
        window.addEventListener("mousemove", mousemove);

        reset();
        animationFrameId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", reset);
            window.removeEventListener("mousemove", mousemove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#0A0707] text-white overflow-x-hidden p-4 font-sans">
            {/* Moving text particle canvas */}
            <canvas ref={canvasRef} className="fixed inset-0 z-0" />

            {/* Visual contrast shader overlays */}
            <div className="fixed inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/85 z-10 pointer-events-none" />

            {/* Main Content Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-20 max-w-3xl text-center flex flex-col items-center p-4"
            >
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[#EEEEEE]">
                    Site Under Construction
                </h1>

                <div className="text-gray-400 text-lg md:text-xl space-y-2 font-medium mb-12">
                    <p>Our website is currently undergoing scheduled maintenance.</p>
                    <p>Thank you for your understanding.</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-gray-400 text-sm">
                    {[
                        { Icon: Instagram, href: 'https://www.instagram.com/204prod.vn/', label: 'Instagram' },
                        { Icon: Facebook, href: 'https://www.facebook.com/204prod.vn/', label: 'Facebook' },
                        { Icon: Youtube, href: 'https://www.youtube.com/@204prodvn', label: 'Youtube' },
                    ].map((social, i) => (
                        <a
                            key={i}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 hover:text-white transition-colors duration-300"
                        >
                            <social.Icon className="w-7 h-7" />
                            <span className="text-base">{social.label}</span>
                        </a>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
