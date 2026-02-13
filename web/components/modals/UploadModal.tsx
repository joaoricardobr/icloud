"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Computer, HardDrive, File, Folder, Check, AlertCircle, Plus } from "lucide-react";
import { modalBackdrop, modalContent } from "@/lib/animations";
import FolderPicker from "../FolderPicker";
import { cn } from "@/lib/utils";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: FileList | null, destination: string) => Promise<void>;
    disks: any[];
    currentPath: string;
    onOpenCreateFolder: () => void;
}

export default function UploadModal({
    isOpen,
    onClose,
    onUpload,
    disks,
    currentPath,
    onOpenCreateFolder
}: UploadModalProps) {
    const [source, setSource] = useState<"local" | "disk">("local");
    const [type, setType] = useState<"files" | "folder">("files");
    const [destination, setDestination] = useState(currentPath);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setError("");
        setIsUploading(true);
        try {
            await onUpload(files, destination);
            onClose();
        } catch (err: any) {
            setError(err.message || "Erro no upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            if (folderInputRef.current) folderInputRef.current.value = "";
        }
    };

    const triggerUpload = () => {
        if (!destination) {
            setError("Por favor, selecione o destino do upload");
            return;
        }

        if (source === "disk") {
            setError("Upload de Disco para Disco ainda será implementado (Ref: Importar)");
            return;
        }

        if (type === "folder") {
            folderInputRef.current?.click();
        } else {
            fileInputRef.current?.click();
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
                        className="bg-white rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.15)] w-full max-w-2xl overflow-hidden border border-white flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Hidden Inputs */}
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <input
                            type="file"
                            multiple
                            /* @ts-ignore */
                            webkitdirectory=""
                            directory=""
                            className="hidden"
                            ref={folderInputRef}
                            onChange={handleFileChange}
                        />

                        {/* Header */}
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                                    <Upload size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Fazer Upload</h2>
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">Envie seus arquivos para a nuvem</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all hover:scale-110 active:scale-95"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[60vh] scrollbar-hide">
                            <div className="space-y-8">
                                {/* Source Selection */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origem</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setSource("local")}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all group",
                                                source === "local" ? "border-blue-600 bg-blue-50/50 text-blue-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <Computer size={24} className={cn(source === "local" ? "text-blue-600" : "group-hover:text-slate-600")} />
                                            <span className="text-sm font-black">LOCAL</span>
                                        </button>
                                        <button
                                            onClick={() => setSource("disk")}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all group",
                                                source === "disk" ? "border-blue-600 bg-blue-50/50 text-blue-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <HardDrive size={24} className={cn(source === "disk" ? "text-blue-600" : "group-hover:text-slate-600")} />
                                            <span className="text-sm font-black">DISCO</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">O que enviar?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setType("files")}
                                            className={cn(
                                                "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                                                type === "files" ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <File size={18} />
                                            <span className="text-xs font-bold">ARQUIVOS</span>
                                        </button>
                                        <button
                                            onClick={() => setType("folder")}
                                            className={cn(
                                                "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                                                type === "folder" ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <Folder size={18} />
                                            <span className="text-xs font-bold">PASTA</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                            <Plus size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 tracking-tight">Criar uma pasta?</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Crie um destino novo antes do upload</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onOpenCreateFolder}
                                        className="w-full py-3 bg-white hover:bg-blue-600 hover:text-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                    >
                                        Nova Pasta de Destino
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Local de Destino</label>
                                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                                        {destination || "Selecione..."}
                                    </div>
                                </div>
                                <FolderPicker
                                    disks={disks}
                                    initialPath={destination}
                                    onSelect={setDestination}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50/50 border-t border-slate-50 mt-auto">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 mb-6"
                                >
                                    <AlertCircle size={18} />
                                    {error}
                                </motion.div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-5 rounded-[24px] font-black text-slate-400 hover:bg-white transition-all active:scale-95"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={triggerUpload}
                                    disabled={isUploading}
                                    className="flex-[2] bg-blue-600 text-white py-5 rounded-[24px] font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                                >
                                    {isUploading ? (
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Upload size={22} />
                                            INICIAR UPLOAD
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
