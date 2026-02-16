"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Download,
    ZoomIn,
    ZoomOut,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    FileText,
    Music,
    Video,
    RotateCcw
} from "lucide-react";
import { modalBackdrop, modalContent } from "@/lib/animations";
import { formatBytes, cn } from "@/lib/utils";
import api from "@/lib/api";

interface FilePreviewProps {
    file: {
        name: string;
        path: string;
        size: number;
        isDirectory: boolean;
        mtime: string;
    } | null;
    onClose: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
    nextFile?: { name: string; path: string } | null;
    prevFile?: { name: string; path: string } | null;
}

export default function FilePreview({
    file,
    onClose,
    onNext,
    onPrevious,
    hasNext = false,
    hasPrevious = false,
    nextFile = null,
    prevFile = null
}: FilePreviewProps) {
    const [zoom, setZoom] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState<string>("");
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [zoomMode, setZoomMode] = useState<"fit" | "original">("original");

    // Reset zoom and states when file changes
    useEffect(() => {
        setZoom(100);
        setZoomMode("original");
        setError("");
        setIsPlaying(false);
        setCurrentTime(0);
        setIsLoading(true);
    }, [file]);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Navigate with arrow keys
    useEffect(() => {
        const handleArrows = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
                onPrevious();
            } else if (e.key === "ArrowRight" && hasNext && onNext) {
                onNext();
            }
        };
        window.addEventListener("keydown", handleArrows);
        return () => window.removeEventListener("keydown", handleArrows);
    }, [hasNext, hasPrevious, onNext, onPrevious]);

    if (!file) return null;

    const getFileType = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) return 'audio';
        if (ext === 'pdf') return 'pdf';
        if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'sh', 'yaml', 'yml'].includes(ext)) return 'text';

        return 'unknown';
    };

    const fileType = getFileType(file.name);
    const viewUrl = `${api.defaults.baseURL}/download?path=${encodeURIComponent(file.path)}&view=true`;
    const downloadUrl = `${api.defaults.baseURL}/download?path=${encodeURIComponent(file.path)}`;

    // Preload URLs
    const nextViewUrl = nextFile ? `${api.defaults.baseURL}/download?path=${encodeURIComponent(nextFile.path)}&view=true` : null;
    const prevViewUrl = prevFile ? `${api.defaults.baseURL}/download?path=${encodeURIComponent(prevFile.path)}&view=true` : null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderPreview = () => {
        switch (fileType) {
            case 'image':
                const imageHandleWheel = (e: React.WheelEvent) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const delta = -e.deltaY;
                        const factor = delta > 0 ? 1.1 : 0.9;
                        setZoom(prev => {
                            const newZoom = Math.round(prev * factor);
                            return Math.min(500, Math.max(10, newZoom));
                        });
                        if (zoomMode === 'fit') setZoomMode('original');
                    }
                };

                const handleImageDragEnd = (event: any, info: any) => {
                    const threshold = 100;
                    if (zoom <= 100) {
                        if (info.offset.x > threshold && hasPrevious && onPrevious) {
                            onPrevious();
                        } else if (info.offset.x < -threshold && hasNext && onNext) {
                            onNext();
                        }
                    }
                };

                return (
                    <div
                        className={cn(
                            "flex items-center justify-center h-full overflow-hidden bg-slate-900/10 select-none relative",
                            zoomMode === "original" || zoom > 100 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                        )}
                        onWheel={imageHandleWheel}
                    >
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full font-black"
                                />
                            </div>
                        )}
                        <motion.img
                            drag
                            dragConstraints={zoom > 100 ? { left: -5000, right: 5000, top: -5000, bottom: 5000 } : { left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={zoom > 100 ? 0 : 0.2}
                            dragMomentum={zoom > 100}
                            onDragEnd={handleImageDragEnd}
                            onDoubleClick={() => {
                                if (zoom > 100) {
                                    setZoom(100);
                                    setZoomMode("fit");
                                } else {
                                    setZoom(200);
                                    setZoomMode("original");
                                }
                            }}
                            src={viewUrl}
                            alt={file.name}
                            onLoad={() => setIsLoading(false)}
                            className={cn(
                                "shadow-2xl transition-all duration-300 ease-out",
                                isLoading ? "opacity-0" : "opacity-100",
                                zoomMode === "fit" && zoom <= 100 ? "max-w-full max-h-full object-contain rounded-2xl" : "max-w-none max-h-none"
                            )}
                            style={{
                                scale: zoom / 100,
                                imageRendering: 'auto',
                                touchAction: 'none'
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isLoading ? 0 : 1 }}
                            transition={{ duration: 0.3 }}
                            onError={() => {
                                setError("Erro ao carregar imagem");
                                setIsLoading(false);
                            }}
                        />
                    </div>
                );

            case 'video':
                return (
                    <div className="flex items-center justify-center h-full p-4 md:p-8 bg-black">
                        <video
                            ref={videoRef}
                            src={viewUrl}
                            controls
                            autoPlay
                            className="max-w-full max-h-full rounded-xl shadow-2xl"
                            onError={() => setError("Erro ao carregar vídeo")}
                        >
                            Seu navegador não suporta reprodução de vídeo.
                        </video>
                    </div>
                );

            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 space-y-12">
                        {/* Vinyl Disc Animation */}
                        <div className="relative group">
                            <motion.div
                                animate={isPlaying ? { rotate: 360 } : {}}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="w-56 h-56 md:w-72 md:h-72 bg-slate-900 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden border-[12px] border-slate-800"
                            >
                                {/* Groove lines */}
                                <div className="absolute inset-0 rounded-full opacity-30 border-[1px] border-white/20" />
                                <div className="absolute inset-4 rounded-full opacity-25 border-[1px] border-white/20" />
                                <div className="absolute inset-8 rounded-full opacity-20 border-[1px] border-white/20" />

                                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-inner z-10">
                                    <Music className="w-10 h-10 md:w-14 md:h-14 text-white" />
                                </div>
                                <div className="absolute inset-x-0 bottom-12 flex justify-center opacity-40">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                            </motion.div>

                            {/* Stylus / Needle */}
                            <motion.div
                                animate={isPlaying ? { rotate: 25 } : { rotate: 0 }}
                                className="absolute -top-4 -right-8 w-32 h-4 bg-slate-700 rounded-full origin-left z-20 shadow-lg hidden md:block"
                                style={{ transformOrigin: 'top left' }}
                            >
                                <div className="absolute -left-2 top-0 w-8 h-8 bg-slate-800 rounded-full border-4 border-slate-600" />
                                <div className="absolute right-0 top-2 w-8 h-2 bg-slate-500 rounded-full rotate-45" />
                            </motion.div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight px-4">{file.name}</h3>
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">{formatBytes(file.size)}</p>
                        </div>

                        <div className="w-full max-w-xl bg-white/50 backdrop-blur-xl p-6 rounded-[32px] shadow-xl border border-white/50 space-y-4">
                            <audio
                                ref={audioRef}
                                src={viewUrl}
                                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="hidden"
                                onError={() => setError("Erro ao carregar áudio")}
                            />

                            {/* Custom Controls */}
                            <div className="space-y-2">
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden cursor-pointer">
                                    <motion.div
                                        className="h-full bg-blue-600"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-8">
                                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <RotateCcw size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (isPlaying) audioRef.current?.pause();
                                        else audioRef.current?.play();
                                    }}
                                    className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1" />}
                                </button>
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'pdf':
                return (
                    <div className="h-full p-4">
                        <iframe
                            src={viewUrl}
                            className="w-full h-full rounded-2xl border border-slate-200 bg-white"
                            title={file.name}
                            onError={() => setError("Erro ao carregar PDF")}
                        />
                    </div>
                );

            case 'text':
                return (
                    <div className="h-full p-4 md:p-8 overflow-auto scrollbar-hide">
                        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-slate-100">
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-50">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{file.name}</h3>
                                    <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">{formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <iframe
                                src={viewUrl}
                                className="w-full h-[60vh] border-none rounded-xl"
                                title={file.name}
                                onError={() => setError("Erro ao carregar documento")}
                            />
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white/50 backdrop-blur-md">
                        <div className="w-32 h-32 bg-slate-100 rounded-[40px] flex items-center justify-center mb-8 text-slate-300">
                            <FileText size={56} className="opacity-40" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mb-3">Preview não disponível</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
                            Não é possível visualizar este tipo de arquivo diretamente no navegador. Você pode baixá-lo para abrir em seu dispositivo.
                        </p>
                        <button
                            onClick={handleDownload}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Download size={20} />
                            Baixar Arquivo
                        </button>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {/* Hidden Preload Images */}
            {nextViewUrl && <img src={nextViewUrl} style={{ display: 'none' }} alt="preload-next" />}
            {prevViewUrl && <img src={prevViewUrl} style={{ display: 'none' }} alt="preload-prev" />}
            <motion.div
                variants={modalBackdrop}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-2 md:p-6"
                onClick={onClose}
            >
                <motion.div
                    variants={modalContent}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-slate-50 rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.1)] w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden border border-white relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 md:p-7 border-b border-white bg-white/50 backdrop-blur top-0 z-50">
                        <div className="flex-1 min-w-0 pr-4">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 truncate tracking-tighter">{file.name}</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {formatBytes(file.size)} • {new Date(file.mtime).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-3">
                            {/* Zoom controls for images */}
                            {fileType === 'image' && (
                                <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 mr-2 shadow-sm">
                                    <button
                                        onClick={() => {
                                            if (zoomMode === 'fit') {
                                                setZoomMode('original');
                                                setZoom(100);
                                            } else {
                                                setZoomMode('fit');
                                                setZoom(100);
                                            }
                                        }}
                                        className={cn(
                                            "p-2 rounded-xl transition-all flex items-center gap-2 px-3",
                                            zoomMode === "original" ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-500"
                                        )}
                                        title={zoomMode === "fit" ? "Ver Tamanho Original" : "Ajustar à Tela"}
                                    >
                                        <Maximize size={18} />
                                        <span className="text-xs font-black uppercase tracking-wider">
                                            {zoomMode === "fit" ? "Original" : "Ajustar"}
                                        </span>
                                    </button>
                                    <div className="w-px h-4 bg-slate-100 mx-1" />
                                    <button
                                        onClick={() => setZoom(Math.max(10, zoom - 25))}
                                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                                        title="Diminuir Zoom"
                                    >
                                        <ZoomOut size={18} />
                                    </button>
                                    <span className="text-xs font-black min-w-[3.5rem] text-center text-slate-700 tabular-nums">
                                        {zoom}%
                                    </span>
                                    <button
                                        onClick={() => setZoom(Math.min(500, zoom + 25))}
                                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                                        title="Aumentar Zoom"
                                    >
                                        <ZoomIn size={18} />
                                    </button>
                                </div>
                            )}

                            <div className="w-px h-6 bg-slate-100 mx-1 hidden md:block" />

                            <button
                                onClick={() => window.open(viewUrl, '_blank')}
                                className="p-3 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                title="Ver em Qualidade Total (Nova Aba)"
                            >
                                <Maximize size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Tela Cheia</span>
                            </button>

                            {/* Action buttons */}
                            <button
                                onClick={handleDownload}
                                className="p-3 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
                                title="Baixar arquivo"
                            >
                                <Download size={20} />
                            </button>

                            <button
                                onClick={onClose}
                                className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 ml-2"
                                title="Fechar (ESC)"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden relative group/nav">
                        {error ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-red-100">
                                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <X size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{error}</h3>
                                    <p className="text-slate-500 mb-8 max-w-xs">Não foi possível carregar este conteúdo. Tente baixar o arquivo.</p>
                                    <button onClick={handleDownload} className="bg-red-500 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-red-200">
                                        <Download size={20} className="inline mr-2" />
                                        Baixar Agora
                                    </button>
                                </div>
                            </div>
                        ) : (
                            renderPreview()
                        )}

                        {/* Navigation arrows */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-opacity">
                            {hasPrevious && onPrevious ? (
                                <button
                                    onClick={onPrevious}
                                    className="pointer-events-auto p-5 bg-white shadow-2xl rounded-3xl text-slate-800 hover:bg-slate-900 hover:text-white transition-all hover:scale-110 active:scale-95 border border-slate-100 shadow-slate-200"
                                    title="Anterior (←)"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                            ) : <div />}

                            {hasNext && onNext ? (
                                <button
                                    onClick={onNext}
                                    className="pointer-events-auto p-5 bg-white shadow-2xl rounded-3xl text-slate-800 hover:bg-slate-900 hover:text-white transition-all hover:scale-110 active:scale-95 border border-slate-100 shadow-slate-200"
                                    title="Próximo (→)"
                                >
                                    <ChevronRight size={32} />
                                </button>
                            ) : <div />}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
