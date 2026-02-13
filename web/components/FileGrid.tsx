"use client";

import React from "react";
import { motion } from "framer-motion";
import { MoreVertical, Star, Trash2, Folder } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { getFileIcon, getFileColor, formatBytes, formatDate, truncateText } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
    onContextMenu?: (file: FileItem, event: React.MouseEvent) => void;
    viewMode?: "grid" | "list";
}

export default function FileGrid({
    files,
    onFileClick,
    onToggleFavorite,
    onDelete,
    onContextMenu,
    viewMode = "grid"
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
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        {/* Quick Actions Overlay */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(file); }}
                                className={cn("p-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm border border-slate-100 hover:scale-110 transition-transform", file.isFavorite ? "text-yellow-500" : "text-slate-400")}
                            >
                                <Star size={14} className={file.isFavorite ? "fill-current" : ""} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                color.replace('text-', 'bg-').replace('600', '100')
                            )}>
                                <Icon size={file.isDirectory ? 32 : 36} className={color} />
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
                        <div className="absolute inset-x-0 bottom-0 p-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all flex justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete?.(file); }}
                                className="bg-red-50 text-red-500 p-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-500 hover:text-white transition-colors"
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
