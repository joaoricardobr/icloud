"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderPlus, Check, AlertCircle } from "lucide-react";
import { modalBackdrop, modalContent } from "@/lib/animations";
import FolderPicker from "../FolderPicker";

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, path: string) => Promise<void>;
    disks: any[];
    currentPath: string;
}

export default function CreateFolderModal({
    isOpen,
    onClose,
    onCreate,
    disks,
    currentPath
}: CreateFolderModalProps) {
    const [folderName, setFolderName] = useState("");
    const [selectedPath, setSelectedPath] = useState(currentPath);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) {
            setError("Por favor, digite o nome da pasta");
            return;
        }
        if (!selectedPath) {
            setError("Por favor, selecione um local de destino");
            return;
        }

        setError("");
        setIsSubmitting(true);
        try {
            await onCreate(folderName.trim(), selectedPath);
            setFolderName("");
            onClose();
        } catch (err: any) {
            setError(err.message || "Erro ao criar pasta");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={modalBackdrop}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[110] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        variants={modalContent}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.15)] w-full max-w-lg overflow-hidden border border-white dark:border-slate-800 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 dark:from-blue-900/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 dark:shadow-none">
                                    <FolderPlus size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Nova Pasta</h2>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Organize seus arquivos</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all hover:scale-110 active:scale-95"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3"
                                >
                                    <AlertCircle size={18} />
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Pasta</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    placeholder="Ex: Documentos Importantes, Fotos 2024..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-4 px-6 text-lg font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Local de Destino</label>
                                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                                        {selectedPath || "Selecione..."}
                                    </div>
                                </div>
                                <FolderPicker
                                    disks={disks}
                                    initialPath={selectedPath}
                                    onSelect={setSelectedPath}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 rounded-2xl font-black text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check size={20} />
                                            CRIAR AGORA
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
