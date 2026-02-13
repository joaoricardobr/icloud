"use client";

import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { getFileIcon, getFileColor, formatBytes, formatDate, truncateText } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface FileItem {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    modifiedAt: string;
    diskLabel?: string;
}

interface FileGridProps {
    files: FileItem[];
    onFileClick: (file: FileItem) => void;
    onContextMenu?: (file: FileItem, event: React.MouseEvent) => void;
}

export default function FileGrid({ files, onFileClick, onContextMenu }: FileGridProps) {
    if (files.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 text-gray-400"
            >
                <div className="w-24 h-24 mb-4 opacity-20">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
                <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
                <p className="text-sm mt-1">Esta pasta está vazia</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            {files.map((file) => {
                const Icon = getFileIcon(file.name, file.isDirectory);
                const iconColor = getFileColor(file.name, file.isDirectory);

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
                        className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border border-gray-100 hover:border-blue-300 group"
                    >
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                <Icon className={`w-6 h-6 ${iconColor}`} />
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate mb-1" title={file.name}>
                                    {truncateText(file.name, 25)}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{formatBytes(file.size)}</span>
                                    <span>•</span>
                                    <span>{formatDate(file.modifiedAt)}</span>
                                </div>
                                {file.diskLabel && (
                                    <div className="mt-2">
                                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                                            {file.diskLabel}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* More Options */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onContextMenu?.(file, e);
                                }}
                                className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                                <MoreVertical size={16} className="text-gray-400" />
                            </motion.button>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
