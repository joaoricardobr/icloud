"use client";

import { useState } from "react";
import {
    auth
} from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { motion } from "framer-motion";
import { LogIn, Github, Mail, Lock, Chrome } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError("Credenciais inválidas. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError("Erro ao entrar com Google.");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1113] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/80 dark:bg-[#15181C]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-2xl shadow-blue-500/5 relative">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-blue-500/20">C</div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 italic">CloudDesk Hybrid</h1>
                        <p className="text-zinc-500 text-sm mt-2">Acesse seus discos locais de qualquer lugar</p>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    placeholder="admin@exemplo.com"
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-500 font-medium ml-1">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
                            Entrar
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-[#15181C] px-3 text-zinc-400">Ou continuar com</span></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-3 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                    >
                        <Chrome className="w-5 h-5 text-blue-500" />
                        Google
                    </button>
                </div>
            </motion.div>

            <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
}
