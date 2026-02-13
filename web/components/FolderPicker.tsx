"use client";

import { useState, useEffect } from "react";
import { Folder, ChevronRight, HardDrive, Search, ChevronLeft } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Disk {
    name: string;
    mount: string;
}

interface FolderItem {
    name: string;
    path: string;
}

interface FolderPickerProps {
    disks: Disk[];
    initialPath?: string;
    onSelect: (path: string) => void;
}

export default function FolderPicker({ disks, initialPath = "", onSelect }: FolderPickerProps) {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        if (currentPath) {
            fetchFolders(currentPath);
        } else {
            setFolders([]);
        }
    }, [currentPath]);

    const fetchFolders = async (path: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/files?path=${encodeURIComponent(path)}`);
            const onlyFolders = (response.data.files || [])
                .filter((f: any) => f.isDirectory)
                .map((f: any) => ({ name: f.name, path: f.path }));
            setFolders(onlyFolders);
        } catch (error) {
            console.error("Error fetching folders for picker:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDisk = (mount: string) => {
        setHistory([]);
        setCurrentPath(mount);
        onSelect(mount);
    };

    const handleOpenFolder = (path: string) => {
        setHistory(prev => [...prev, currentPath]);
        setCurrentPath(path);
        onSelect(path);
    };

    const handleGoBack = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            setCurrentPath(prev);
            onSelect(prev);
        } else {
            setCurrentPath("");
            onSelect("");
        }
    };

    return (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-64 shadow-inner">
            {/* Header / Breadcrumb */}
            <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-2">
                {currentPath ? (
                    <button
                        onClick={handleGoBack}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                ) : (
                    <Search size={16} className="text-slate-400 ml-1" />
                )}
                <div className="text-xs font-bold text-slate-600 truncate flex-1 leading-none">
                    {currentPath || "Selecione um Disco / Unidade"}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                {!currentPath ? (
                    <div className="space-y-1">
                        {disks.map(disk => (
                            <button
                                key={disk.mount}
                                onClick={() => handleSelectDisk(disk.mount)}
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all text-sm font-semibold text-slate-600 group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <HardDrive size={16} />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="truncate">{disk.name}</div>
                                    <div className="text-[10px] opacity-60 truncate font-mono">{disk.mount}</div>
                                </div>
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Carregando</span>
                            </div>
                        ) : folders.length > 0 ? (
                            folders.map(folder => (
                                <button
                                    key={folder.path}
                                    onClick={() => handleOpenFolder(folder.path)}
                                    className="w-full flex items-center gap-3 p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all text-sm font-semibold text-slate-600 group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <Folder size={16} className="text-blue-500 fill-blue-500/10" />
                                    </div>
                                    <span className="flex-1 text-left truncate">{folder.name}</span>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                                <Folder size={32} className="opacity-10" />
                                <span className="text-xs font-bold opacity-60">Nenhuma subpasta aqui</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-center">
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                    Destino para: {currentPath ? "Pasta Atual" : "Raiz do Disco"}
                </div>
            </div>
        </div>
    );
}
