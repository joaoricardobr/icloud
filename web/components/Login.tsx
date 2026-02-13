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
    Smartphone
} from "lucide-react";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

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
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError("E-mail ou senha incorretos.");
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError("Erro ao autenticar com o Google.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden relative font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-400 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-400 rounded-full blur-[120px]"
                />
            </div>

            <div className="container max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                {/* Left Side: Branding & Info */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="hidden lg:flex flex-col gap-8 max-w-lg"
                >
                    <motion.div variants={staggerItem} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                            <Cloud className="text-white" size={28} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">CloudLocal<span className="text-blue-600">.</span></h1>
                    </motion.div>

                    <div className="space-y-6">
                        <motion.h2 variants={staggerItem} className="text-5xl font-black text-slate-900 leading-[1.1]">
                            Sua nuvem <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                privada e segura.
                            </span>
                        </motion.h2>
                        <motion.p variants={staggerItem} className="text-lg text-slate-600 leading-relaxed">
                            Gerencie seus arquivos locais com o poder da nuvem. Acesso remoto, segurança criptografada e uma interface que você vai amar.
                        </motion.p>
                    </div>

                    <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
                        {[
                            { icon: ShieldCheck, text: "Segurança Total", color: "text-green-600", bg: "bg-green-100" },
                            { icon: Server, text: "Hospedagem Local", color: "text-blue-600", bg: "bg-blue-100" },
                            { icon: Smartphone, text: "Mobile Ready", color: "text-purple-600", bg: "bg-purple-100" },
                            { icon: Globe, text: "Acesso Global", color: "text-orange-600", bg: "bg-orange-100" }
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", feat.bg)}>
                                    <feat.icon className={feat.color} size={20} />
                                </div>
                                <span className="font-bold text-slate-700 text-sm">{feat.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Right Side: LOGIN FORM */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white/70 backdrop-blur-2xl p-8 md:p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white relative">
                        {/* Security Badge */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-200">
                            <ShieldCheck size={14} />
                            SSL Protegido
                        </div>

                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-2xl font-black text-slate-900">Bem-vindo de volta!</h2>
                            <p className="text-slate-500 mt-2 font-medium">Faça login para gerenciar seus dados.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        placeholder="exemplo@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Senha</label>
                                    <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700">Esqueceu?</button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Sua senha secreta"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"
                                    >
                                        <ShieldCheck size={16} className="text-red-400" />
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-200/50 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Entrar na Nuvem
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="my-8 flex items-center gap-4">
                            <div className="h-px bg-slate-100 flex-1" />
                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Ou continue com</span>
                            <div className="h-px bg-slate-100 flex-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <motion.button
                                onClick={handleGoogleLogin}
                                whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-3 border border-slate-200 py-3 rounded-2xl font-bold text-slate-700 transition-all"
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
                                whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-3 border border-slate-200 py-3 rounded-2xl font-bold text-slate-700 transition-all"
                                onClick={() => alert("Github login em breve!")}
                            >
                                <Github size={20} />
                                Github
                            </motion.button>
                        </div>

                        <p className="text-center mt-10 text-slate-500 text-sm font-medium">
                            Não tem uma conta? <button className="text-blue-600 font-black hover:underline">Solicitar acesso</button>
                        </p>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-slate-400">
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck size={12} />
                            Criptografia Grau Militar
                        </span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            © 2026 CloudLocal
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
