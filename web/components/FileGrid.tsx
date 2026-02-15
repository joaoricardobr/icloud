"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MoreVertical, Star, Trash2, Folder, Share2, CheckCircle2 } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { getFileIcon, getFileColor, formatBytes, formatDate, truncateText } from "@/lib/utils";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface FileItem {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    mtime: string;
    isFavorite?: boolean;
    diskLabel?: string;
}

interface FileGridProps {
    files: FileItem[];
    onFileClick: (file: FileItem) => void;
    onToggleFavorite?: (file: FileItem) => void;
    onDelete?: (file: FileItem) => void;
    onShare?: (file: FileItem) => void;
    onContextMenu?: (file: FileItem, event: React.MouseEvent) => void;
    viewMode?: "grid" | "list";
    selectedPaths?: string[];
    onSelectionChange?: (path: string) => void;
    selectionMode?: boolean;
}

export default function FileGrid({
    files,
    onFileClick,
    onToggleFavorite,
    onDelete,
    onShare,
    onContextMenu,
    viewMode = "grid",
    selectedPaths = [],
    onSelectionChange,
    selectionMode = false
}: FileGridProps) {
    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                    <Folder size={40} className="opacity-20" />
                </div>
                <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Nenhum arquivo encontrado</p>
                <p className="text-sm">Esta pasta está vazia ou a busca não retornou resultados.</p>
            </div>
        );
    }

    if (viewMode === "list") {
        return (
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-50 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4 hidden md:table-cell">Modificado</th>
                            <th className="px-6 py-4 hidden sm:table-cell text-right">Tamanho</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file) => {
                            const Icon = getFileIcon(file.name, file.isDirectory);
                            const color = getFileColor(file.name, file.isDirectory);

                            return (
                                <motion.tr
                                    key={file.path}
                                    variants={staggerItem}
                                    onClick={() => onFileClick(file)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        onContextMenu?.(file, e);
                                    }}
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {(selectionMode || selectedPaths.length > 0) && (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); onSelectionChange?.(file.path); }}
                                                    className={cn(
                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                        selectedPaths.includes(file.path) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                                    )}
                                                >
                                                    {selectedPaths.includes(file.path) && <CheckCircle2 size={12} />}
                                                </div>
                                            )}
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0",
                                                color.replace('text-', 'bg-').replace('600', '100'),
                                                "dark:bg-slate-800" // Simplified for dark mode
                                            )}>
                                                {(file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|mp4|mkv|mov)$/i)) ? (
                                                    <Image
                                                        src={`${api.defaults.baseURL}/thumbnail?path=${encodeURIComponent(file.path)}`}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover relative z-10"
                                                        width={40}
                                                        height={40}
                                                        unoptimized
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const container = target.parentElement;
                                                            if (container) {
                                                                container.innerHTML = `<svg class="${color} w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${file.isDirectory ? 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' : 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'}"></path></svg>`;
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Icon size={20} className={color} />
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px] md:max-w-xs">{file.name}</span>
                                            {file.isFavorite && <Star size={14} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell text-sm text-slate-500 dark:text-slate-400">
                                        {formatDate(file.mtime)}
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell text-sm text-slate-500 dark:text-slate-400 text-right font-medium">
                                        {file.isDirectory ? "--" : formatBytes(file.size)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onShare?.(file); }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                                title="Compartilhar"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(file); }}
                                                className={cn("p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors", file.isFavorite ? "text-yellow-500" : "text-slate-400")}
                                            >
                                                <Star size={18} className={file.isFavorite ? "fill-current" : ""} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete?.(file); }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onContextMenu?.(file, e as any); }}
                                                className="p-2 rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-6"
        >
            {files.map((file) => {
                const Icon = getFileIcon(file.name, file.isDirectory);
                const color = getFileColor(file.name, file.isDirectory);

                return (
                    <motion.div
                        key={file.path}
                        variants={staggerItem}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onFileClick(file)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            onContextMenu?.(file, e);
                        }}
                        className={cn(
                            "group bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all border border-slate-100 dark:border-slate-800 cursor-pointer relative overflow-hidden",
                            file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) && "aspect-square"
                        )}
                    >
                        {/* Vibrant Accent Glow */}
                        <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${color.replace('text-', 'from-').replace('600', '500')} to-transparent opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity blur-xl z-0`} />
                        {/* Selection Indicator */}
                        {(selectionMode || selectedPaths.length > 0) && (
                            <div className="absolute top-4 left-4 z-20">
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedPaths.includes(file.path) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 backdrop-blur"
                                    )}
                                >
                                    {selectedPaths.includes(file.path) && <CheckCircle2 size={14} />}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions Overlay */}
                        <div className={cn(
                            "absolute top-2 right-2 flex flex-col gap-2 transition-all z-10",
                            (selectionMode || selectedPaths.includes(file.path)) ? "opacity-100" : "md:opacity-0 group-hover:opacity-100"
                        )}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(file); }}
                                className={cn("p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform", file.isFavorite ? "text-yellow-500" : "text-slate-400")}
                            >
                                <Star size={14} className={file.isFavorite ? "fill-current" : ""} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onShare?.(file); }}
                                className="p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform text-slate-400 hover:text-blue-600"
                            >
                                <Share2 size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete?.(file); }}
                                className="p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform text-slate-400 hover:text-red-500"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "w-16 h-16 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 overflow-hidden relative",
                                color.replace('text-', 'bg-').replace('600', '100'),
                                "dark:bg-slate-800/50"
                            )}>
                                {/* Hover Glow */}
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity",
                                    color.replace('text-', 'from-').replace('600', '500')
                                )} />

                                {(file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|mp4|mkv|mov)$/i)) ? (
                                    <Image
                                        src={`${api.defaults.baseURL}/thumbnail?path=${encodeURIComponent(file.path)}`}
                                        alt={file.name}
                                        className="w-full h-full object-cover relative z-10"
                                        width={96}
                                        height={96}
                                        unoptimized
                                        onError={(e) => {
                                            // Fallback to icon if thumbnail fails
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const container = target.parentElement;
                                            if (container) {
                                                container.innerHTML = `<svg class="${color} w-8 h-8 md:w-11 md:h-11 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${Icon === Folder ? 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' : 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'}"></path></svg>`;
                                            }
                                        }}
                                    />
                                ) : (
                                    <Icon size={file.isDirectory ? 36 : 42} className={cn(color, "relative z-10 drop-shadow-sm")} />
                                )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-full truncate px-2" title={file.name}>
                                {truncateText(file.name, 20)}
                            </h3>

                            <div className="mt-1 flex items-center justify-center gap-2">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    {file.isDirectory ? 'Pasta' : formatBytes(file.size)}
                                </span>
                                {file.isFavorite && <Star size={10} className="fill-yellow-400 text-yellow-400" />}
                            </div>
                        </div>

                        {/* Hover Footer Actions (Always hidden now, replaced by top actions) */}
                        <div className="absolute inset-x-0 bottom-0 p-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 pointer-events-none transition-all flex justify-center">
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
