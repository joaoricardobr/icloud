"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Upload,
    FolderPlus,
    ChevronRight,
    LayoutGrid,
    List,
    Filter,
    ArrowDownAZ,
    ArrowDown10,
    Clock,
    Star,
    Share2,
    Archive,
    RefreshCw
} from "lucide-react";
import { slideInFromTop } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

interface Breadcrumb {
    name: string;
    path: string;
}

interface TopBarProps {
    breadcrumbs: Breadcrumb[];
    onNavigate: (path: string) => void;
    onUpload?: (files: FileList | null) => void;
    onUploadClick?: () => void;
    onNewFolder?: () => void;
    onNewFolderClick?: () => void;
    onSearch?: (query: string) => void;
    onFilterChange?: (filter: string) => void;
    onSortChange?: (sort: string) => void;
    viewMode?: "grid" | "list";
    onViewModeChange?: (mode: "grid" | "list") => void;
    currentFilter?: string;
    currentSort?: string;
    selectedCount?: number;
    onSelectAll?: (select: boolean) => void;
    onDownloadZip?: () => void;
    onShareSelected?: () => void;
    isAllSelected?: boolean;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export default function TopBar({
    breadcrumbs,
    onNavigate,
    onUpload,
    onUploadClick,
    onNewFolder,
    onNewFolderClick,
    onSearch,
    onFilterChange,
    onSortChange,
    viewMode = "grid",
    onViewModeChange,
    currentFilter = "all",
    currentSort = "name",
    selectedCount = 0,
    onSelectAll,
    onDownloadZip,
    onShareSelected,
    isAllSelected = false,
    onRefresh,
    isRefreshing = false
}: TopBarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showFilters, setShowFilters] = useState(false);

    const filters = [
        { id: "all", label: "Tudo", icon: LayoutGrid },
        { id: "image", label: "Fotos", icon: Filter },
        { id: "video", label: "Vídeos", icon: Filter },
        { id: "audio", label: "Músicas", icon: Filter },
        { id: "document", label: "Documentos", icon: Filter },
        { id: "favorite", label: "Favoritos", icon: Star },
    ];

    const sortOptions = [
        { id: "name", label: "Nome", icon: ArrowDownAZ },
        { id: "date", label: "Data", icon: Clock },
        { id: "size", label: "Tamanho", icon: ArrowDown10 },
    ];

    return (
        <motion.header
            initial="hidden"
            animate="visible"
            variants={slideInFromTop}
            className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-30"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Breadcrumbs & Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 md:pb-0 pl-20 md:pl-0">
                    {selectedCount > 0 ? (
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl font-black text-sm border border-blue-100 shadow-sm">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]"
                                >
                                    {selectedCount}
                                </motion.div>
                                {selectedCount === 1 ? 'Item selecionado' : 'Itens selecionados'}
                            </div>
                            <button
                                onClick={() => onSelectAll?.(!isAllSelected)}
                                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                            >
                                {isAllSelected ? "Desmarcar todos" : "Selecionar tudo"}
                            </button>
                        </div>
                    ) : (
                        breadcrumbs.map((crumb, index) => (
                            <div key={crumb.path + index} className="flex items-center gap-2 flex-shrink-0">
                                {index > 0 && <ChevronRight size={14} className="text-slate-300" />}
                                <motion.button
                                    onClick={() => onNavigate(crumb.path)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "px-4 py-2 rounded-2xl transition-all duration-200 text-sm font-bold",
                                        index === breadcrumbs.length - 1
                                            ? "bg-slate-900 text-white shadow-lg shadow-slate-400"
                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    )}
                                >
                                    {crumb.name}
                                </motion.button>
                            </div>
                        ))
                    )}
                </div>

                {/* Actions Area */}
                <div className="flex items-center flex-wrap gap-2 md:gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar arquivos..."
                            onChange={(e) => onSearch?.(e.target.value)}
                            className="bg-slate-100 border-none rounded-2xl py-2 pl-10 pr-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:bg-white w-full md:w-64 transition-all outline-none font-medium text-slate-700"
                        />
                    </div>

                    {/* Refresh Button */}
                    {onRefresh && (
                        <motion.button
                            onClick={onRefresh}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "p-2.5 rounded-2xl border transition-all flex items-center justify-center",
                                isRefreshing ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                            title="Atualizar conexão e arquivos"
                        >
                            <RefreshCw size={18} className={cn(isRefreshing && "animate-spin")} />
                        </motion.button>
                    )}

                    {/* Advanced Filters Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "p-2.5 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm",
                                showFilters || currentFilter !== "all"
                                    ? "bg-blue-50 border-blue-200 text-blue-600"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <Filter size={18} />
                            <span className="hidden lg:inline">Filtros</span>
                        </button>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-72 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 z-50 overflow-hidden"
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Filtrar por tipo</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {filters.map((f) => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => { onFilterChange?.(f.id); setShowFilters(false); }}
                                                        className={cn(
                                                            "px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2",
                                                            currentFilter === f.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                                        )}
                                                    >
                                                        <f.icon size={14} />
                                                        {f.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ordenar por</h4>
                                            <div className="space-y-1">
                                                {sortOptions.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => { onSortChange?.(s.id); setShowFilters(false); }}
                                                        className={cn(
                                                            "w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-left flex items-center justify-between",
                                                            currentSort === s.id ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <s.icon size={16} />
                                                            {s.label}
                                                        </div>
                                                        {currentSort === s.id && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* View Mode Toggle */}
                    {onViewModeChange && (
                        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => onViewModeChange("grid")}
                                className={cn(
                                    "p-1.5 rounded-xl transition-all",
                                    viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => onViewModeChange("list")}
                                className={cn(
                                    "p-1.5 rounded-xl transition-all",
                                    viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {selectedCount > 0 ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 ml-auto">
                        <motion.button
                            onClick={onShareSelected}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white border border-slate-200 text-blue-600 p-3.5 md:px-5 md:py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
                        >
                            <Share2 size={20} />
                            <span className="hidden lg:inline">Compartilhar</span>
                        </motion.button>

                        <motion.button
                            onClick={onDownloadZip}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-blue-600 text-white p-3.5 md:px-6 md:py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                        >
                            <Archive size={20} />
                            <span className="hidden lg:inline">Baixar ZIP</span>
                        </motion.button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 ml-auto">
                        {(onNewFolder || onNewFolderClick) && (
                            <motion.button
                                onClick={onNewFolderClick || onNewFolder}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white border border-slate-200 text-slate-700 p-3.5 md:px-4 md:py-2 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm min-w-[48px] justify-center"
                                title="Nova Pasta"
                            >
                                <FolderPlus size={20} className="text-blue-500" />
                                <span className="hidden lg:inline">Nova Pasta</span>
                            </motion.button>
                        )}

                        {(onUpload || onUploadClick) && (
                            <>
                                {onUpload && (
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                onUpload(e.target.files);
                                                e.target.value = "";
                                            }
                                        }}
                                    />
                                )}
                                <motion.button
                                    onClick={() => fileInputRef.current?.click()}
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-blue-600 text-white p-3.5 md:px-5 md:py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 min-w-[48px] justify-center"
                                    title="Fazer Upload"
                                >
                                    <Upload size={20} />
                                    <span className="hidden lg:inline">Upload</span>
                                </motion.button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </motion.header>
    );
}
