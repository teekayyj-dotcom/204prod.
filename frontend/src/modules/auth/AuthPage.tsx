import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Gauge, Eye, EyeOff, Check, X, Shield, Lock, User, Mail } from "lucide-react";

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

export function AuthPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Mode determination
    const isLogin = location.pathname === "/login";
    const isRegister = location.pathname === "/register";
    const isChangePassword = location.pathname === "/change-password";

    // Form inputs state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password requirements verification
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isMinLength = password.length >= 14;

    // Canvas animation background setup
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
            // Create a main mouse repeller at index 0, and dynamic orbiting ones
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
            // Scale font size to be bigger
            const fontSize = Math.min(w * 0.22, 220);
            ctx.font = `900 ${fontSize}px "Space Grotesk", sans-serif, Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // Thicker stroke width for bolder text shape outline
            ctx.lineWidth = 4.5;
            ctx.strokeStyle = "white";
            ctx.strokeText(config.text, w / 2, h / 2);
            ctx.restore();

            const imageData = ctx.getImageData(0, 0, w, h);
            particles = [];

            // Step density based on width to optimize rendering performance
            const step = w < 768 ? 6 : 4;
            for (let x = 0; x < w; x += step) {
                for (let y = 0; y < h; y += step) {
                    const idx = (x + w * y) * 4;
                    // Check opacity values of stroke path to spawn particle spikes
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

            // Loop updates
            tick = now / 40;
            hue += colorConfig.hueSpeed;
            const currentHue = Math.sin(hue) * colorConfig.hueRange + colorConfig.baseHue;
            ctx.strokeStyle = `hsla(${currentHue}, ${colorConfig.colorSaturation}%, 50%, ${colorConfig.particleOpacity})`;

            // Update planet orbits
            const len = planets.length;
            for (let i = 1; i < len; i++) {
                const angle = ((Math.PI * 2) / (len - 1)) * i;
                const x = A * Math.sin(a * (tick / 150) + angle) + w / 2;
                const y = B * Math.sin(b * (tick / 150) + angle) + h / 2;
                planets[i].pos.x = x;
                planets[i].pos.y = y;
            }

            // Draw line particle vector offsets
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

    // Form submission processing
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isRegister || isChangePassword) {
            if (!hasUppercase || !hasNumber || !isMinLength) {
                alert("Mật khẩu không đáp ứng đầy đủ yêu cầu bảo mật.");
                return;
            }
            if (password !== confirmPassword) {
                alert("Mật khẩu xác nhận không trùng khớp.");
                return;
            }
        }

        let successMsg = "";
        let redirectPath = "/";

        if (isLogin) {
            successMsg = "Đăng nhập thành công!";
            // Redirect to admin if username starts with admin, otherwise client
            redirectPath = username.toLowerCase().startsWith("admin") ? "/admin" : "/client";
        } else if (isRegister) {
            successMsg = "Đăng ký tài khoản thành công! Quay lại đăng nhập.";
            redirectPath = "/login";
        } else if (isChangePassword) {
            successMsg = "Cập nhật mật khẩu thành công! Hãy đăng nhập lại.";
            redirectPath = "/login";
        }

        alert(successMsg);
        navigate(redirectPath);
    };

    return (
        <div className="min-h-screen w-screen relative overflow-hidden bg-[#0A0707] flex items-center justify-center font-sans">
            {/* Moving text particle canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* Visual contrast shader overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/85 z-10 pointer-events-none" />

            {/* Outer Wrapper */}
            <div className="relative z-20 w-full max-w-[440px] mx-4 flex flex-col items-center">

                {/* Brand Header Logo */}
                <div
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 mb-7 cursor-pointer hover:opacity-80 transition-all select-none"
                >
                    <span className="text-3xl font-black tracking-tighter text-white font-[Space_Grotesk]">
                        204PROD<span className="text-[#D84040]">.</span>
                    </span>
                </div>

                {/* Form Card (Glassmorphism Layout matching user screen) */}
                <div className="w-full bg-[#1D1616]/30 backdrop-blur-xl border border-[#2E2020] rounded-3xl p-8 shadow-2xl space-y-6">
                    <div className="text-center space-y-1.5">
                        <h2 className="text-xl font-bold text-[#EEEEEE] font-[Outfit]">
                            {isLogin && "Đăng nhập tài khoản"}
                            {isRegister && "Tạo tài khoản mới"}
                            {isChangePassword && "Thay đổi mật khẩu"}
                        </h2>
                        <p className="text-[12px] text-gray-500 leading-normal max-w-[280px] mx-auto">
                            {isLogin && "Truy cập phòng chiếu và quản lý dự án nghệ thuật của bạn"}
                            {isRegister && "Trở thành đối tác hoặc thành viên của 204prod."}
                            {isChangePassword && "Thiết lập lại mật khẩu mới cho tài khoản của bạn"}
                        </p>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username Input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tên đăng nhập hoặc Email</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="example@204prod.vn"
                                    className="w-full bg-[#141010]/40 backdrop-blur-md border border-[#2E2020]/60 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-[#D84040] focus:bg-[#141010]/60 text-white placeholder:text-gray-600 transition-all font-medium hover:bg-[#141010]/55 hover:border-[#2E2020] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                                    required
                                />
                                <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                            </div>
                        </div>

                        {/* Old Password Input (Only for Change Password Mode) */}
                        {isChangePassword && (
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Mật khẩu hiện tại</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        placeholder="••••••••••••••"
                                        className="w-full bg-[#141010]/40 backdrop-blur-md border border-[#2E2020]/60 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-[#D84040] focus:bg-[#141010]/60 text-white placeholder:text-gray-600 transition-all font-medium hover:bg-[#141010]/55 hover:border-[#2E2020] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                                        required
                                    />
                                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                                </div>
                            </div>
                        )}

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                {isLogin && "Mật khẩu"}
                                {isRegister && "Tạo mật khẩu bảo mật"}
                                {isChangePassword && "Mật khẩu mới"}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••••"
                                    className="w-full bg-[#141010]/40 backdrop-blur-md border border-[#2E2020]/60 rounded-xl pl-10 pr-10 py-3 text-xs outline-none focus:border-[#D84040] focus:bg-[#141010]/60 text-white placeholder:text-gray-600 transition-all font-medium hover:bg-[#141010]/55 hover:border-[#2E2020] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                                    required
                                />
                                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 p-0.5"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements Bullet points (For Register / Change Password) */}
                        {(isRegister || isChangePassword) && (
                            <div className="p-3 bg-[#141010]/30 backdrop-blur-md rounded-xl border border-[#2E2020]/45 space-y-2 select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Yêu cầu mật khẩu:</span>
                                <ul className="space-y-1.5 text-[11px] font-medium">
                                    <li className={`flex items-center gap-2 ${hasUppercase ? "text-[#4CAF50]" : "text-gray-500"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? "bg-[#4CAF50]" : "bg-gray-700"}`} />
                                        <span>Có ít nhất 1 chữ cái viết hoa</span>
                                    </li>
                                    <li className={`flex items-center gap-2 ${hasNumber ? "text-[#4CAF50]" : "text-gray-500"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? "bg-[#4CAF50]" : "bg-gray-700"}`} />
                                        <span>Có ít nhất 1 chữ số</span>
                                    </li>
                                    <li className={`flex items-center gap-2 ${isMinLength ? "text-[#4CAF50]" : "text-gray-500"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isMinLength ? "bg-[#4CAF50]" : "bg-gray-700"}`} />
                                        <span>Có độ dài tối thiểu 14 ký tự</span>
                                    </li>
                                </ul>
                            </div>
                        )}

                        {/* Confirm Password Input (Only for Register / Change Password Mode) */}
                        {(isRegister || isChangePassword) && (
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••••••••"
                                        className="w-full bg-[#141010]/40 backdrop-blur-md border border-[#2E2020]/60 rounded-xl pl-10 pr-10 py-3 text-xs outline-none focus:border-[#D84040] focus:bg-[#141010]/60 text-white placeholder:text-gray-600 transition-all font-medium hover:bg-[#141010]/55 hover:border-[#2E2020] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                                        required
                                    />
                                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 p-0.5"
                                    >
                                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Submit CTA Button */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#D84040] hover:bg-[#c03030] rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-[#D84040]/15 hover:shadow-lg hover:shadow-[#D84040]/25"
                        >
                            {isLogin && "Đăng nhập"}
                            {isRegister && "Đăng ký tài khoản"}
                            {isChangePassword && "Cập nhật mật khẩu"}
                        </button>

                        {/* Google Sign In/Up Button */}
                        {!isChangePassword && (
                            <>
                                <div className="flex items-center gap-3 py-1">
                                    <div className="flex-1 border-t border-[#2E2020]/60"></div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hoặc</span>
                                    <div className="flex-1 border-t border-[#2E2020]/60"></div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        alert(`${isLogin ? "Đăng nhập" : "Đăng ký"} bằng tài khoản Google thành công!`);
                                        navigate("/client");
                                    }}
                                    className="w-full py-2.5 bg-[#141010]/45 backdrop-blur-md hover:bg-[#2A1F1F]/60 border border-[#2E2020]/60 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                        />
                                    </svg>
                                    <span>{isLogin ? "Đăng nhập bằng Google" : "Đăng ký bằng Google"}</span>
                                </button>
                            </>
                        )}
                    </form>

                    {/* Mode links redirect footer */}
                    <div className="pt-4 border-t border-[#2E2020]/50 text-center text-xs space-y-2 select-none">
                        {isLogin && (
                            <>
                                <div className="text-gray-500">
                                    Chưa có tài khoản?{" "}
                                    <Link to="/register" className="text-[#D84040] hover:underline font-bold">Đăng ký ngay</Link>
                                </div>
                                <div>
                                    <Link to="/change-password" className="text-gray-400 hover:underline font-semibold">Đổi mật khẩu tài khoản</Link>
                                </div>
                            </>
                        )}

                        {isRegister && (
                            <div className="text-gray-500">
                                Đã có tài khoản?{" "}
                                <Link to="/login" className="text-[#D84040] hover:underline font-bold">Đăng nhập</Link>
                            </div>
                        )}

                        {isChangePassword && (
                            <div className="text-gray-500">
                                Quay lại trang{" "}
                                <Link to="/login" className="text-[#D84040] hover:underline font-bold">Đăng nhập</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
