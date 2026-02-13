"use client";

import { motion } from "framer-motion";
import { Home, Clock, Star, Trash2, LogOut, Image, Video, Music, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { slideInFromLeft, staggerContainer, staggerItem } from "@/lib/animations";

interface SidebarProps {
    activeView: "home" | "recent" | "favorites" | "trash" | "category";
    activeCategory?: string;
    onViewChange: (view: "home" | "recent" | "favorites" | "trash") => void;
    onCategoryChange: (category: string) => void;
    onLogout: () => void;
}

export default function Sidebar({
    activeView,
    activeCategory,
    onViewChange,
    onCategoryChange,
    onLogout
}: SidebarProps) {
    const navItems = [
        { id: "home", label: "Início", icon: Home, view: "home" as const },
        { id: "recent", label: "Recentes", icon: Clock, view: "recent" as const },
        { id: "favorites", label: "Favoritos", icon: Star, view: "favorites" as const },
        { id: "trash", label: "Lixeira", icon: Trash2, view: "trash" as const },
    ];

    const categories = [
        { id: "imagens", label: "Imagens", icon: Image, color: "text-green-500" },
        { id: "videos", label: "Vídeos", icon: Video, color: "text-purple-500" },
        { id: "musicas", label: "Músicas", icon: Music, color: "text-pink-500" },
        { id: "documentos", label: "Documentos", icon: FileText, color: "text-red-500" },
    ];

    return (
        <motion.aside
            initial="hidden"
            animate="visible"
            variants={slideInFromLeft}
            className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg"
        >
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gradient-primary">CloudDesk</h1>
                <p className="text-xs text-gray-500 mt-1">Gerenciador de Arquivos</p>
            </div>

            {/* Navigation */}
            <motion.nav
                className="flex-1 px-3 py-4 overflow-y-auto"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {/* Main Navigation */}
                <div className="mb-6">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.view;

                        return (
                            <motion.button
                                key={item.id}
                                variants={staggerItem}
                                onClick={() => onViewChange(item.view)}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Icon size={20} className={isActive ? "animate-pulse-slow" : ""} />
                                <span className="font-medium">{item.label}</span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Categories */}
                <div>
                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Categorias
                    </h3>
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const isActive = activeView === "category" && activeCategory === category.id;

                        return (
                            <motion.button
                                key={category.id}
                                variants={staggerItem}
                                onClick={() => onCategoryChange(category.id)}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Icon size={20} className={isActive ? "text-white" : category.color} />
                                <span className="font-medium">{category.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.nav>

            {/* Logout Button */}
            <div className="p-3 border-t border-gray-100">
                <motion.button
                    onClick={onLogout}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sair</span>
                </motion.button>
            </div>
        </motion.aside>
    );
}
