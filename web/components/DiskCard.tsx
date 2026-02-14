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
    temperature?: number | null;
    type?: "system" | "external";
    onClick: () => void;
}

export default function DiskCard({
    name,
    mount,
    size,
    used,
    percent,
    temperature,
    type = "external",
    onClick
}: DiskCardProps) {
    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return "from-red-500 to-red-600";
        if (percentage >= 70) return "from-yellow-500 to-orange-600";
        return "from-blue-500 to-indigo-600";
    };

    const getUsageTextColor = (percentage: number) => {
        if (percentage >= 90) return "text-red-600";
        if (percentage >= 70) return "text-yellow-600";
        return "text-blue-600";
    };

    const getTempColor = (temp: number) => {
        if (temp >= 55) return "text-red-500 bg-red-50";
        if (temp >= 45) return "text-orange-500 bg-orange-50";
        return "text-emerald-500 bg-emerald-50";
    };

    // Circular progress math
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <motion.div
            variants={scaleIn}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_32px_64px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer border border-transparent hover:border-blue-100 flex flex-col h-full"
        >
            <div className="flex items-start justify-between mb-6">
                <div className="relative">
                    {/* Circular Progress */}
                    <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-slate-100"
                        />
                        <motion.circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                            fill="transparent"
                            className={getUsageTextColor(percent)}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-xl font-black ${getUsageTextColor(percent)}`}>{percent}%</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Usado</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getUsageColor(percent)} flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform`}>
                        <HardDrive className="w-6 h-6 text-white" />
                    </div>
                    {temperature !== null && temperature !== undefined && (
                        <div className={`px-2 py-1 rounded-lg flex items-center gap-1 font-black text-[10px] ${getTempColor(temperature)}`}>
                            <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-1.5 h-1.5 rounded-full bg-current"
                            />
                            {temperature}°C
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                <h3 className="text-lg font-black text-slate-800 mb-1 truncate leading-tight">{name}</h3>
                <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${type === "system"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-900 text-white"
                        }`}>
                        {type === "system" ? "Sistema" : "Extra"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium truncate">{mount}</span>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <div className="flex flex-col">
                    <span className="text-slate-300 uppercase tracking-widest text-[8px]">Espaço Disponível</span>
                    <span className="text-slate-700">{formatBytes(size - used)}</span>
                </div>
                <div className="text-right flex flex-col">
                    <span className="text-slate-300 uppercase tracking-widest text-[8px]">Total</span>
                    <span className="text-slate-900">{formatBytes(size)}</span>
                </div>
            </div>
        </motion.div>
    );
}
