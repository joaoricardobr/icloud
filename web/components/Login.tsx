"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail,
    Lock,
    ArrowRight,
    ShieldCheck,
    Github,
    Globe,
    Eye,
    EyeOff,
    Cloud,
    Server,
    Smartphone,
    Star,
    Zap,
    LockKeyhole
} from "lucide-react";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

const FloatingIcon = ({ children, delay = 0, x = 0, y = 0 }: any) => (
    <motion.div
        animate={{
            y: [y, y - 20, y],
            x: [x, x + 10, x],
            rotate: [0, 5, -5, 0]
        }}
        transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
        className="absolute hidden lg:block opacity-20 text-white pointer-events-none"
        style={{ left: `${50 + x}%`, top: `${50 + y}%` }}
    >
        {children}
    </motion.div>
);

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "/";
        } catch (err: any) {
            setError("E-mail ou senha incorretos.");
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            window.location.href = "/";
        } catch (err: any) {
            setError("Erro ao autenticar com o Google.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-mesh-gradient overflow-hidden relative font-sans text-white">
            {/* Mesh Spheres */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [-100, 100, -100], y: [-50, 50, -50], scale: [1, 1.2, 1] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="mesh-sphere w-[500px] h-[500px] bg-blue-600/30 -top-20 -left-20"
                />
                <motion.div
                    animate={{ x: [100, -100, 100], y: [50, -50, 50], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 25, repeat: Infinity }}
                    className="mesh-sphere w-[600px] h-[600px] bg-purple-600/30 bottom-0 right-0"
                />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="mesh-sphere w-[400px] h-[400px] bg-pink-600/20 top-1/2 left-1/3"
                />
            </div>

            {/* Floating Icons */}
            <FloatingIcon x={-40} y={-30} delay={0}><Cloud size={48} /></FloatingIcon>
            <FloatingIcon x={35} y={-40} delay={1}><LockKeyhole size={40} /></FloatingIcon>
            <FloatingIcon x={-35} y={35} delay={2}><Server size={32} /></FloatingIcon>
            <FloatingIcon x={40} y={30} delay={3}><Smartphone size={56} /></FloatingIcon>
            <FloatingIcon x={10} y={-45} delay={4}><Zap size={24} /></FloatingIcon>
            <FloatingIcon x={-15} y={40} delay={5}><Star size={32} /></FloatingIcon>

            <div className="container max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                {/* Left Side: Branding & Info */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="hidden lg:flex flex-col gap-8 max-w-lg"
                >
                    <motion.div variants={staggerItem} className="flex items-center gap-4">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 1 }}
                            className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 cursor-pointer"
                        >
                            <Cloud className="text-white" size={32} />
                        </motion.div>
                        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
                            CloudLocal<span className="text-blue-400">.</span>
                        </h1>
                    </motion.div>

                    <div className="space-y-6">
                        <motion.h2 variants={staggerItem} className="text-6xl font-black leading-[1.05] tracking-tight">
                            Redefina sua <br />
                            <span className="text-vibrant-gradient">
                                experiência digital.
                            </span>
                        </motion.h2>
                        <motion.p variants={staggerItem} className="text-xl text-slate-300 font-medium leading-relaxed max-w-md">
                            A nuvem pessoal definitiva. Rápida, privada e envolvente. Seus arquivos em qualquer lugar, com o estilo que você merece.
                        </motion.p>
                    </div>

                    <motion.div variants={staggerItem} className="flex flex-wrap gap-4 mt-4">
                        {[
                            { icon: ShieldCheck, text: "Privacidade Militar", color: "text-blue-400" },
                            { icon: Zap, text: "Ultra Rápido", color: "text-amber-400" },
                            { icon: Globe, text: "Acesso Global", color: "text-emerald-400" }
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3 glass-premium rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-default group">
                                <feat.icon className={cn(feat.color, "group-hover:scale-110 transition-transform")} size={20} />
                                <span className="font-bold text-sm tracking-wide">{feat.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Right Side: LOGIN CARD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md"
                >
                    <div className="glass-premium p-8 md:p-12 rounded-[50px] border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        {/* Glow effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[60px] group-hover:bg-blue-500/30 transition-all duration-700" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[60px] group-hover:bg-purple-500/30 transition-all duration-700" />

                        <div className="mb-10 text-center lg:text-left relative">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="inline-block mb-4 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]"
                            >
                                Secure Access Gateway
                            </motion.div>
                            <h2 className="text-3xl font-black text-white">Bem-vindo<span className="text-blue-400">.</span></h2>
                            <p className="text-slate-400 mt-2 font-medium">Faça login na sua infraestrutura privada.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6 relative">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">Terminal ID (Email)</label>
                                <div className="relative group/input font-mono">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        placeholder="user@clouddesk.private"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Access Key (Senha)</label>
                                    <button type="button" className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors">Recover</button>
                                </div>
                                <div className="relative group/input font-mono">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-3"
                                    >
                                        <ShieldCheck size={18} className="text-red-500 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase tracking-widest text-sm"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Authorize Access
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="my-10 flex items-center gap-4">
                            <div className="h-px bg-white/5 flex-1" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">External Auth</span>
                            <div className="h-px bg-white/5 flex-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative">
                            <motion.button
                                onClick={handleGoogleLogin}
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3.5 rounded-2xl font-bold text-slate-300 transition-all text-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 5.04c1.94 0 3.5.68 4.67 1.81l3.48-3.48C17.91 1.25 15.21 0 12 0 7.31 0 3.32 2.67 1.38 6.58l4.08 3.16C6.44 7.08 8.96 5.04 12 5.04z" />
                                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.37-4.87 3.37-8.49z" />
                                    <path fill="#FBBC05" d="M5.46 14.26c-.24-.71-.38-1.47-.38-2.26 0-.79.14-1.55.38-2.26L1.38 6.58C.5 8.35 0 10.12 0 12c0 1.88.5 3.65 1.38 5.42l4.08-3.16z" />
                                    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.66-2.84c-1.1.74-2.51 1.18-4.29 1.18-3.04 0-5.62-2.04-6.54-4.8l-4.08 3.16C3.32 21.33 7.31 24 12 24z" />
                                </svg>
                                Google
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3.5 rounded-2xl font-bold text-slate-300 transition-all text-sm"
                                onClick={() => alert("GitHub logic coming soon!")}
                            >
                                <Github size={20} />
                                GitHub
                            </motion.button>
                        </div>

                        <div className="mt-10 text-center">
                            <span className="text-slate-500 text-xs font-bold">New operator? </span>
                            <button className="text-blue-400 font-black text-xs hover:text-blue-300 transition-colors uppercase tracking-widest ml-1">Request Token</button>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-10 flex flex-col items-center gap-4 text-slate-500"
                    >
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/50">
                                <Lock Keyhole size={12} />
                                AES-256 Encrypted
                            </span>
                            <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                V2.4.0 Node-Alpha
                            </span>
                        </div>
                        <p className="text-[10px] font-medium opacity-30 text-center max-w-[200px]">
                            Propriedade privada. Acesso não autorizado será reportado ao firewall central.
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            <style jsx>{`
                .bg-mesh-gradient {
                    background-color: #020617;
                    background-image: 
                        radial-gradient(at 0% 0%, hsla(220,100%,10%,1) 0, transparent 50%), 
                        radial-gradient(at 50% 0%, hsla(280,100%,10%,1) 0, transparent 50%), 
                        radial-gradient(at 100% 0%, hsla(220,100%,10%,1) 0, transparent 50%),
                        radial-gradient(at 0% 100%, hsla(280,100%,10%,1) 0, transparent 50%),
                        radial-gradient(at 100% 100%, hsla(220,100%,10%,1) 0, transparent 50%);
                }
            `}</style>
        </div>
    );
}
