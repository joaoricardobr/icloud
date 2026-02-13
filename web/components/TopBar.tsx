"use client";

import { motion } from "framer-motion";
import { Search, Upload, FolderPlus, ChevronRight } from "lucide-react";
import { slideInFromTop } from "@/lib/animations";

interface Breadcrumb {
    name: string;
    path: string;
}

interface TopBarProps {
    breadcrumbs: Breadcrumb[];
    onNavigate: (path: string) => void;
    onUpload?: () => void;
    onNewFolder?: () => void;
    onSearch?: (query: string) => void;
}

export default function TopBar({
    breadcrumbs,
    onNavigate,
    onUpload,
    onNewFolder,
    onSearch
}: TopBarProps) {
    return (
        <motion.header
            initial="hidden"
            animate="visible"
            variants={slideInFromTop}
            className="glass border-b border-gray-200 px-6 py-4 sticky top-0 z-10"
        >
            <div className="flex items-center justify-between">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm flex-1">
                    {breadcrumbs.map((crumb, index) => (
                        <motion.div
                            key={crumb.path}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
                            <motion.button
                                onClick={() => onNavigate(crumb.path)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg transition-all duration-200",
                                    index === breadcrumbs.length - 1
                                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-md"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                {crumb.name}
                            </motion.button>
                        </motion.div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 ml-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar arquivos..."
                            onChange={(e) => onSearch?.(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all duration-200"
                        />
                    </div>

                    {/* Upload Button */}
                    {onUpload && (
                        <motion.button
                            onClick={onUpload}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Upload size={18} />
                            <span>Upload</span>
                        </motion.button>
                    )}

                    {/* New Folder Button */}
                    {onNewFolder && (
                        <motion.button
                            onClick={onNewFolder}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <FolderPlus size={18} />
                            <span>Nova Pasta</span>
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.header>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
