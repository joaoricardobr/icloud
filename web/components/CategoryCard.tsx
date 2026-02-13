"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { formatBytes, getCategoryIcon, getCategoryColor, getCategoryName } from "@/lib/utils";
import { scaleIn } from "@/lib/animations";

interface CategoryCardProps {
    category: string;
    count: number;
    size: number;
    onClick: () => void;
}

export default function CategoryCard({
    category,
    count,
    size,
    onClick
}: CategoryCardProps) {
    const Icon = getCategoryIcon(category);
    const gradientColor = getCategoryColor(category);
    const displayName = getCategoryName(category);

    return (
        <motion.div
            variants={scaleIn}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-300 overflow-hidden group"
        >
            {/* Background Gradient (appears on hover) */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            {/* Content */}
            <div className="relative z-10">
                {/* Icon */}
                <motion.div
                    animate={{
                        y: [0, -8, 0],
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg mb-4 group-hover:shadow-xl transition-all duration-300 relative group-hover:scale-110`}
                >
                    <Icon className="w-8 h-8 text-white relative z-20" />
                    {/* Pulsing inner glow */}
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-white/30 rounded-2xl blur-xl z-10"
                    />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{displayName}</h3>

                {/* Stats */}
                <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{count.toLocaleString()}</span> arquivo{count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{formatBytes(size)}</span> total
                    </p>
                </div>

                {/* View All Link */}
                <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    <span>Ver todos</span>
                    <motion.svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                </div>
            </div>

            {/* Decorative Element */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br ${gradientColor} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
        </motion.div>
    );
}
