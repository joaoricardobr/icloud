"use client";

import React from "react";
import { motion } from "framer-motion";
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
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Folder size={40} className="opacity-20" />
                </div>
                <p className="text-lg font-medium text-slate-500">Nenhum arquivo encontrado</p>
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
                className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                                    className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {(selectionMode || selectedPaths.length > 0) && (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); onSelectionChange?.(file.path); }}
                                                    className={cn(
                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                        selectedPaths.includes(file.path) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                                                    )}
                                                >
                                                    {selectedPaths.includes(file.path) && <CheckCircle2 size={12} />}
                                                </div>
                                            )}
                                            <div className={cn("p-2.5 rounded-xl", color.replace('text-', 'bg-').replace('600', '100'))}>
                                                <Icon size={20} className={color} />
                                            </div>
                                            <span className="font-bold text-slate-700 truncate max-w-[150px] md:max-w-xs">{file.name}</span>
                                            {file.isFavorite && <Star size={14} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell text-sm text-slate-500">
                                        {formatDate(file.mtime)}
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell text-sm text-slate-500 text-right font-medium">
                                        {file.isDirectory ? "--" : formatBytes(file.size)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onShare?.(file); }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition-colors"
                                                title="Compartilhar"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(file); }}
                                                className={cn("p-2 rounded-lg hover:bg-white transition-colors", file.isFavorite ? "text-yellow-500" : "text-slate-400")}
                                            >
                                                <Star size={18} className={file.isFavorite ? "fill-current" : ""} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete?.(file); }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onContextMenu?.(file, e as any); }}
                                                className="p-2 rounded-lg text-slate-400 hover:bg-white transition-colors"
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
                        className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-slate-100 cursor-pointer relative"
                    >
                        {/* Selection Indicator */}
                        {(selectionMode || selectedPaths.length > 0) && (
                            <div className="absolute top-4 left-4 z-20">
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedPaths.includes(file.path) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white/80 backdrop-blur"
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
                                className={cn("p-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm border border-slate-100 hover:scale-110 transition-transform", file.isFavorite ? "text-yellow-500" : "text-slate-400")}
                            >
                                <Star size={14} className={file.isFavorite ? "fill-current" : ""} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onShare?.(file); }}
                                className="p-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm border border-slate-100 hover:scale-110 transition-transform text-slate-400 hover:text-blue-600"
                            >
                                <Share2 size={14} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 overflow-hidden",
                                color.replace('text-', 'bg-').replace('600', '100')
                            )}>
                                {(file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|mp4|mkv|mov)$/i)) ? (
                                    <img
                                        src={`${api.defaults.baseURL}/thumbnail?path=${encodeURIComponent(file.path)}`}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to icon if thumbnail fails
                                            (e.target as any).style.display = 'none';
                                            (e.target as any).parentElement.innerHTML = `<svg class="${color} w-8 h-8 md:w-9 md:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${Icon === Folder ? 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' : 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'}"></path></svg>`;
                                        }}
                                    />
                                ) : (
                                    <Icon size={file.isDirectory ? 32 : 36} className={color} />
                                )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-800 text-center w-full truncate px-2" title={file.name}>
                                {truncateText(file.name, 20)}
                            </h3>

                            <div className="mt-1 flex items-center justify-center gap-2">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {file.isDirectory ? 'Pasta' : formatBytes(file.size)}
                                </span>
                                {file.isFavorite && <Star size={10} className="fill-yellow-400 text-yellow-400" />}
                            </div>
                        </div>

                        {/* Hover Footer Actions */}
                        <div className="absolute inset-x-0 bottom-0 p-2 transform translate-y-2 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all flex justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete?.(file); }}
                                className="bg-red-50 text-red-500 p-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-500 hover:text-white transition-colors shadow-lg"
                            >
                                <Trash2 size={12} />
                                Lixeira
                            </button>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
