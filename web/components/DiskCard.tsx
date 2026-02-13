"use client";

import { motion } from "framer-motion";
import { HardDrive } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { scaleIn } from "@/lib/animations";

interface DiskCardProps {
    name: string;
    mount: string;
    size: number;
    used: number;
    percent: number;
    type?: "system" | "external";
    onClick: () => void;
}

export default function DiskCard({
    name,
    mount,
    size,
    used,
    percent,
    type = "external",
    onClick
}: DiskCardProps) {
    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return "from-red-500 to-red-600";
        if (percentage >= 70) return "from-yellow-500 to-orange-600";
        return "from-green-500 to-emerald-600";
    };

    const getUsageTextColor = (percentage: number) => {
        if (percentage >= 90) return "text-red-600";
        if (percentage >= 70) return "text-yellow-600";
        return "text-green-600";
    };

    return (
        <motion.div
            variants={scaleIn}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-300"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getUsageColor(percent)} flex items-center justify-center shadow-lg`}>
                    <HardDrive className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                    <span className={`text-2xl font-bold ${getUsageTextColor(percent)}`}>
                        {percent}%
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Usado</p>
                </div>
            </div>

            {/* Disk Info */}
            <h3 className="font-semibold text-gray-900 mb-1 truncate">{name}</h3>
            <p className="text-sm text-gray-500 mb-4">
                {formatBytes(used)} de {formatBytes(size)}
            </p>

            {/* Progress Bar */}
            <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className={`h-full bg-gradient-to-r ${getUsageColor(percent)} rounded-full shadow-sm`}
                />
            </div>

            {/* Type Badge */}
            <div className="mt-4 flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full ${type === "system"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                    {type === "system" ? "Sistema" : "Externo"}
                </span>
                <span className="text-xs text-gray-400 truncate">{mount}</span>
            </div>
        </motion.div>
    );
}
