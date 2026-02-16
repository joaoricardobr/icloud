"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Computer, HardDrive, File, Folder, Check, AlertCircle, Plus, UploadCloud } from "lucide-react";
import { modalBackdrop, modalContent } from "@/lib/animations";
import FolderPicker from "../FolderPicker";
import { cn, formatBytes } from "@/lib/utils";
import { useEffect } from "react";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[] | FileList | null, destination: string) => Promise<void>;
    disks: any[];
    currentPath: string;
    onOpenCreateFolder: () => void;
    initialFiles?: FileList | null;
}

export default function UploadModal({
    isOpen,
    onClose,
    onUpload,
    disks,
    currentPath,
    onOpenCreateFolder,
    initialFiles
}: UploadModalProps) {
    const [source, setSource] = useState<"local" | "disk">("local");
    const [type, setType] = useState<"files" | "folder">("files");
    const [destination, setDestination] = useState(currentPath);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const [filesToUpload, setFilesToUpload] = useState<File[]>(
        initialFiles ? Array.from(initialFiles) : []
    );
    const [isDragging, setIsDragging] = useState(false);

    // Sync files when modal opens with new selection
    useEffect(() => {
        if (initialFiles) {
            setFilesToUpload(prev => {
                const newFiles = Array.from(initialFiles);
                const uniqueNewFiles = newFiles.filter(nf => !prev.some(pf => pf.name === nf.name && pf.size === nf.size));
                return [...prev, ...uniqueNewFiles];
            });
        }
    }, [initialFiles]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setFilesToUpload(prev => {
            const newFiles = Array.from(files);
            const uniqueNewFiles = newFiles.filter(nf => !prev.some(pf => pf.name === nf.name && pf.size === nf.size));
            return [...prev, ...uniqueNewFiles];
        });

        // Reset input so same file can be selected again if needed
        e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setFilesToUpload(prev => {
                const newFiles = Array.from(files);
                const uniqueNewFiles = newFiles.filter(nf => !prev.some(pf => pf.name === nf.name && pf.size === nf.size));
                return [...prev, ...uniqueNewFiles];
            });
        }
    };

    const triggerUpload = async () => {
        if (!destination) {
            setError("Por favor, selecione o destino do upload");
            return;
        }

        if (filesToUpload.length === 0) {
            setError("Nenhum arquivo selecionado");
            return;
        }

        setError("");
        setIsUploading(true);
        try {
            await onUpload(filesToUpload, destination);
            onClose();
            setFilesToUpload([]); // Clear after success
        } catch (err: any) {
            setError(err.message || "Erro no upload");
        } finally {
            setIsUploading(false);
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
                        className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.15)] w-full max-w-2xl overflow-hidden border border-white dark:border-slate-800 flex flex-col"
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
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 dark:from-blue-900/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 dark:shadow-none">
                                    <Upload size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Fazer Upload</h2>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Envie seus arquivos para a nuvem</p>
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
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[60vh] scrollbar-hide">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fila de Upload</label>
                                        {filesToUpload.length > 0 && (
                                            <button
                                                onClick={() => setFilesToUpload([])}
                                                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest"
                                            >
                                                Limpar tudo
                                            </button>
                                        )}
                                    </div>
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={cn(
                                            "rounded-3xl border-2 border-dashed p-4 min-h-[200px] max-h-[350px] overflow-y-auto space-y-2 transition-all duration-300 relative",
                                            isDragging
                                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.02]"
                                                : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                                        )}
                                    >
                                        {filesToUpload.length > 0 ? (
                                            <div className="space-y-2">
                                                {filesToUpload.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-700 group">
                                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                            <File size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{f.name}</p>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{formatBytes(f.size)}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setFilesToUpload(prev => prev.filter((_, idx) => idx !== i))}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                                                <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
                                                    <UploadCloud size={40} className="text-blue-500" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Arraste seus arquivos</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1">ou selecione manualmente</p>
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="mt-4 text-[10px] bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 dark:shadow-none hover:scale-110 transition-transform"
                                                >
                                                    Selecionar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {filesToUpload.length > 0 && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-400 hover:text-blue-500 transition-all bg-white dark:bg-transparent"
                                        >
                                            + Adicionar mais arquivos
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-[32px] border border-blue-100 dark:border-blue-900/30 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-white dark:border-slate-700">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-none">Pasta de destino inexistente?</h4>
                                            <button
                                                onClick={onOpenCreateFolder}
                                                className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest hover:underline mt-2 flex items-center gap-1"
                                            >
                                                Criar nova pasta <div className="w-1 h-1 rounded-full bg-blue-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Destino no Storage</label>
                                    <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl truncate max-w-[180px] shadow-sm flex items-center gap-2" title={destination}>
                                        <HardDrive size={10} />
                                        {destination || "Raiz"}
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 dark:bg-slate-900/50 p-1 rounded-[32px] border border-slate-100 dark:border-slate-800 h-[300px]">
                                    <FolderPicker
                                        disks={disks}
                                        initialPath={destination}
                                        onSelect={setDestination}
                                    />
                                </div>
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
                                    className="flex-1 py-5 rounded-[24px] font-black text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95"
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
