"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Maximize2, Minimize2, Play, Pause, Volume2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { formatBytes } from "@/lib/utils";
import api from "@/lib/api";

interface MediaPlayerProps {
    file: {
        name: string;
        path: string;
        size: number;
        isDirectory: boolean;
    };
    onClose: () => void;
    apiUrl: string;
}

export default function MediaPlayer({ file, onClose, apiUrl }: MediaPlayerProps) {
    const [type, setType] = useState<"image" | "video" | "audio" | "other">("other");
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) setType("image");
        else if (["mp4", "webm", "mkv", "mov"].includes(ext || "")) setType("video");
        else if (["mp3", "wav", "ogg"].includes(ext || "")) setType("audio");
        else setType("other");
    }, [file.name]);

    const fileUrl = `${api.defaults.baseURL}/download?path=${encodeURIComponent(file.path)}`;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-[#15181C] w-full max-w-5xl rounded-[32px] overflow-hidden shadow-2xl relative border border-zinc-200 dark:border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                            {type === "image" && <Maximize2 className="w-5 h-5" />}
                            {type === "video" && <Play className="w-5 h-5" />}
                            {type === "audio" && <Volume2 className="w-5 h-5" />}
                            {type === "other" && <X className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm truncate max-w-md">{file.name}</h3>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{formatBytes(file.size)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={fileUrl}
                            download
                            className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-zinc-500 hover:text-blue-600"
                        >
                            <Download className="w-5 h-5" />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors text-zinc-500 hover:text-red-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content View */}
                <div className="p-8 flex items-center justify-center min-h-[400px] max-h-[70vh] items-center justify-center overflow-hidden">
                    {type === "image" && (
                        <img
                            src={fileUrl}
                            alt={file.name}
                            className="max-w-full max-h-full rounded-2xl shadow-lg object-contain"
                        />
                    )}

                    {type === "video" && (
                        <video
                            ref={videoRef}
                            src={fileUrl}
                            controls
                            autoPlay
                            className="w-full h-auto max-h-full rounded-2xl shadow-lg"
                        />
                    )}

                    {type === "audio" && (
                        <div className="w-full max-w-md text-center">
                            <div className="w-32 h-32 bg-blue-600/10 rounded-[40px] flex items-center justify-center mx-auto mb-8 animate-pulse text-blue-600">
                                <Volume2 className="w-12 h-12" />
                            </div>
                            <h4 className="font-bold text-xl mb-6">{file.name}</h4>
                            <audio
                                ref={audioRef}
                                src={fileUrl}
                                controls
                                autoPlay
                                className="w-full"
                            />
                        </div>
                    )}

                    {type === "other" && (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-400">
                                <X className="w-10 h-10" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Pré-visualização não disponível</h3>
                            <p className="text-zinc-500 text-sm mb-6">Este tipo de arquivo não pode ser visualizado no navegador.</p>
                            <a
                                href={fileUrl}
                                download
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Download className="w-5 h-5" />
                                Fazer Download
                            </a>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
