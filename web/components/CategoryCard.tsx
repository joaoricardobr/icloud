"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { formatBytes, getCategoryIcon, getCategoryColor, getCategoryName, cn } from "@/lib/utils";
import { scaleIn } from "@/lib/animations";
import api from "@/lib/api";
import Image from "next/image";

interface FileItem {
    name: string;
    path: string;
    size: number;
}

interface CategoryCardProps {
    category: string;
    count: number;
    size: number;
    onClick: () => void;
    files?: FileItem[];
}

export default function CategoryCard({
    category,
    count,
    size,
    onClick,
    files = []
}: CategoryCardProps) {
    const Icon = getCategoryIcon(category);
    const gradientColor = getCategoryColor(category);
    const displayName = getCategoryName(category);
    const recentFiles = files.slice(0, 4);

    return (
        <motion.div
            variants={scaleIn}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="relative bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-xl dark:shadow-none hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 overflow-hidden group"
        >
            {/* Background Gradient (appears on hover) */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

            {/* Content */}
            <div className="relative z-10">
                {/* Icon Container */}
                <motion.div
                    animate={{
                        y: [0, -4, 0],
                        rotate: [0, 2, -2, 0]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-xl mb-6 relative group-hover:scale-110 transition-transform duration-500`}
                >
                    <Icon className="w-10 h-10 text-white relative z-30 drop-shadow-md" />
                    {/* Pulsing inner glow - now using literal strings to prevent JIT purge */}
                    <motion.div
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className={cn(
                            "absolute inset-0 bg-gradient-to-br rounded-3xl blur-2xl z-10",
                            gradientColor.includes('emerald') ? "from-emerald-500 to-teal-600" :
                                gradientColor.includes('indigo') ? "from-indigo-500 to-blue-600" :
                                    gradientColor.includes('rose') ? "from-rose-500 to-pink-600" :
                                        gradientColor.includes('amber') ? "from-amber-500 to-orange-600" :
                                            "from-slate-500 to-slate-600"
                        )}
                    />
                </motion.div>

                {/* Title */}
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{displayName}</h3>

                {/* Stats */}
                <div className="space-y-1 mb-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <span className="font-black text-slate-900 dark:text-white text-lg">{count.toLocaleString()}</span> arquivo{count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        {formatBytes(size)} total
                    </p>
                </div>

                {/* Recent Files Thumbnails */}
                {recentFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {recentFiles.map((file, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                                <Image
                                    src={`${api.defaults.baseURL}/thumbnail?path=${encodeURIComponent(file.path)}&size=thumb`}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                    width={50}
                                    height={50}
                                    unoptimized
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* View All Link */}
                <div className="mt-6 flex items-center text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                    <span>Ver todos</span>
                    <motion.svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        initial={{ x: 0 }}
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </motion.svg>
                </div>
            </div>

            {/* Decorative Element */}
            <div className={`absolute -right-8 -bottom-8 w-40 h-40 bg-gradient-to-br ${gradientColor} opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`} />
        </motion.div>
    );
}
