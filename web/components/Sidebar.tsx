"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Clock,
    Star,
    Trash2,
    LogOut,
    Image,
    Video,
    Music,
    FileText,
    ChevronLeft,
    Menu,
    X,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { slideInFromLeft, staggerContainer, staggerItem } from "@/lib/animations";

interface SidebarProps {
    activeView: "home" | "recent" | "favorites" | "trash" | "category" | "settings";
    activeCategory?: string;
    onViewChange: (view: "home" | "recent" | "favorites" | "trash" | "settings") => void;
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Handle responsiveness
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsCollapsed(false);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const navItems = [
        { id: "home", label: "Início", icon: Home, view: "home" as const },
        { id: "recent", label: "Recentes", icon: Clock, view: "recent" as const },
        { id: "favorites", label: "Favoritos", icon: Star, view: "favorites" as const },
        { id: "settings", label: "Configuração", icon: Settings, view: "settings" as const },
        { id: "trash", label: "Lixeira", icon: Trash2, view: "trash" as const },
    ];

    const categories = [
        { id: "imagens", label: "Imagens", icon: Image, color: "text-green-500" },
        { id: "videos", label: "Vídeos", icon: Video, color: "text-purple-500" },
        { id: "musicas", label: "Músicas", icon: Music, color: "text-pink-500" },
        { id: "documentos", label: "Documentos", icon: FileText, color: "text-red-500" },
    ];

    const NavButton = ({ item, isActive, onClick, isCategory = false }: any) => {
        const Icon = item.icon;

        return (
            <motion.button
                variants={staggerItem}
                onClick={() => {
                    onClick();
                    if (isMobile) setIsMobileOpen(false);
                }}
                whileHover={{ x: isCollapsed ? 0 : 4, scale: isCollapsed ? 1.05 : 1 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "w-full flex transition-all duration-200 mb-1 rounded-xl",
                    isCollapsed
                        ? "flex-col items-center justify-center py-3 px-1"
                        : "items-center gap-3 px-4 py-3",
                    isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-700 hover:bg-gray-100"
                )}
                title={isCollapsed ? item.label : ""}
            >
                <Icon size={isCollapsed ? 22 : 20} className={isActive ? (isCollapsed ? "" : "animate-pulse-slow") : (isCategory && !isCollapsed ? item.color : "")} />
                <span className={cn(
                    "font-medium transition-all duration-200",
                    isCollapsed ? "text-[10px] mt-1 text-center leading-tight opacity-80" : "text-sm"
                )}>
                    {item.label}
                </span>
            </motion.button>
        );
    };

    const sidebarContent = (
        <div className="h-full flex flex-col pt-4">
            {/* Logo area */}
            <div className={cn(
                "px-6 mb-6 flex items-center justify-between",
                isCollapsed && "px-2 flex-col gap-2"
            )}>
                {!isCollapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">CloudDesk</h1>
                    </motion.div>
                )}
                {isCollapsed && (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">C</div>
                )}

                {isMobile ? (
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 md:hidden"
                    >
                        <X size={20} />
                    </button>
                ) : (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ChevronLeft className={cn("transition-transform duration-300", isCollapsed && "rotate-180")} size={20} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <motion.nav
                className="flex-1 px-3 overflow-y-auto scrollbar-hide"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <div className="mb-6">
                    {!isCollapsed && (
                        <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Menu</h3>
                    )}
                    {navItems.map((item) => (
                        <NavButton
                            key={item.id}
                            item={item}
                            isActive={activeView === item.view}
                            onClick={() => onViewChange(item.view)}
                        />
                    ))}
                </div>

                <div>
                    {!isCollapsed && (
                        <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Categorias</h3>
                    )}
                    {categories.map((category) => (
                        <NavButton
                            key={category.id}
                            item={category}
                            isActive={activeView === "category" && activeCategory === category.id}
                            onClick={() => onCategoryChange(category.id)}
                            isCategory={true}
                        />
                    ))}
                </div>
            </motion.nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-100">
                <motion.button
                    onClick={onLogout}
                    whileHover={{ x: isCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full flex transition-all duration-200 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600",
                        isCollapsed ? "flex-col items-center justify-center py-3" : "items-center gap-3 px-4 py-3"
                    )}
                >
                    <LogOut size={20} />
                    <span className={cn("font-medium", isCollapsed ? "text-[10px] mt-1" : "text-sm")}>Sair</span>
                </motion.button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="fixed top-4 left-4 z-40 p-3 bg-white shadow-xl rounded-2xl text-gray-600 md:hidden border border-gray-100"
                >
                    <Menu size={24} />
                </button>

                <AnimatePresence>
                    {isMobileOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 md:hidden"
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden"
                            >
                                {sidebarContent}
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 88 : 256 }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            className="bg-white border-r border-gray-200 flex flex-col shadow-xl z-20 relative overflow-hidden"
        >
            {sidebarContent}
        </motion.aside>
    );
}
