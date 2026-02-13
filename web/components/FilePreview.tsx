"use client";

import { useState, useEffect } from "react";
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
    FileText
} from "lucide-react";
import { modalBackdrop, modalContent } from "@/lib/animations";
import { formatBytes } from "@/lib/utils";

interface FilePreviewProps {
    file: {
        name: string;
        path: string;
        size: number;
        isDirectory: boolean;
        modifiedAt: string;
    } | null;
    onClose: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

export default function FilePreview({
    file,
    onClose,
    onNext,
    onPrevious,
    hasNext = false,
    hasPrevious = false
}: FilePreviewProps) {
    const [zoom, setZoom] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState<string>("");

    // Reset zoom when file changes
    useEffect(() => {
        setZoom(100);
        setError("");
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

        // Images
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
            return 'image';
        }

        // Videos
        if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv'].includes(ext)) {
            return 'video';
        }

        // Audio
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) {
            return 'audio';
        }

        // PDF
        if (ext === 'pdf') {
            return 'pdf';
        }

        // Text/Code
        if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'sh', 'yaml', 'yml'].includes(ext)) {
            return 'text';
        }

        return 'unknown';
    };

    const fileType = getFileType(file.name);
    const fileUrl = `/api/cloud/download?path=${encodeURIComponent(file.path)}`;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderPreview = () => {
        switch (fileType) {
            case 'image':
                return (
                    <div className="flex items-center justify-center h-full p-8">
                        <motion.img
                            src={fileUrl}
                            alt={file.name}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            style={{ transform: `scale(${zoom / 100})` }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            onError={() => setError("Erro ao carregar imagem")}
                        />
                    </div>
                );

            case 'video':
                return (
                    <div className="flex items-center justify-center h-full p-8">
                        <video
                            src={fileUrl}
                            controls
                            className="max-w-full max-h-full rounded-lg shadow-2xl"
                            onError={() => setError("Erro ao carregar vídeo")}
                        >
                            Seu navegador não suporta reprodução de vídeo.
                        </video>
                    </div>
                );

            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
                        <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                            <Volume2 className="w-24 h-24 text-white" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{file.name}</h3>
                            <p className="text-gray-500">{formatBytes(file.size)}</p>
                        </div>
                        <audio
                            src={fileUrl}
                            controls
                            className="w-full max-w-md"
                            onError={() => setError("Erro ao carregar áudio")}
                        >
                            Seu navegador não suporta reprodução de áudio.
                        </audio>
                    </div>
                );

            case 'pdf':
                return (
                    <div className="h-full p-4">
                        <iframe
                            src={fileUrl}
                            className="w-full h-full rounded-lg border-2 border-gray-200"
                            title={file.name}
                            onError={() => setError("Erro ao carregar PDF")}
                        />
                    </div>
                );

            case 'text':
                return (
                    <div className="h-full p-8 overflow-auto">
                        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                                <FileText className="w-8 h-8 text-blue-500" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{file.name}</h3>
                                    <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <iframe
                                src={fileUrl}
                                className="w-full h-96 border rounded"
                                title={file.name}
                                onError={() => setError("Erro ao carregar documento")}
                            />
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <FileText className="w-24 h-24 text-gray-400 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Preview não disponível</h3>
                        <p className="text-gray-500 mb-6">
                            Não é possível visualizar este tipo de arquivo no navegador.
                        </p>
                        <button
                            onClick={handleDownload}
                            className="btn btn-primary"
                        >
                            <Download className="w-5 h-5" />
                            Baixar Arquivo
                        </button>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                variants={modalBackdrop}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalContent}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-gray-900 truncate">{file.name}</h2>
                            <p className="text-sm text-gray-500">
                                {formatBytes(file.size)} • {new Date(file.modifiedAt).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            {/* Zoom controls for images */}
                            {fileType === 'image' && (
                                <>
                                    <button
                                        onClick={() => setZoom(Math.max(25, zoom - 25))}
                                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                        title="Diminuir zoom"
                                    >
                                        <ZoomOut className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-medium min-w-[4rem] text-center">
                                        {zoom}%
                                    </span>
                                    <button
                                        onClick={() => setZoom(Math.min(200, zoom + 25))}
                                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                        title="Aumentar zoom"
                                    >
                                        <ZoomIn className="w-5 h-5" />
                                    </button>
                                    <div className="w-px h-6 bg-gray-300 mx-2" />
                                </>
                            )}

                            {/* Download button */}
                            <button
                                onClick={handleDownload}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                title="Baixar arquivo"
                            >
                                <Download className="w-5 h-5" />
                            </button>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                title="Fechar (ESC)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden bg-gray-50 relative">
                        {error ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-red-500 font-medium mb-2">{error}</p>
                                    <button onClick={handleDownload} className="btn btn-primary">
                                        <Download className="w-5 h-5" />
                                        Baixar Arquivo
                                    </button>
                                </div>
                            </div>
                        ) : (
                            renderPreview()
                        )}

                        {/* Navigation arrows */}
                        {hasPrevious && onPrevious && (
                            <button
                                onClick={onPrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                                title="Arquivo anterior (←)"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        {hasNext && onNext && (
                            <button
                                onClick={onNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                                title="Próximo arquivo (→)"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
