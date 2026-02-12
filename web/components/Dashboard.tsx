"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Folder,
    File,
    Search,
    Upload,
    Plus,
    HardDrive,
    Clock,
    Settings,
    LogOut,
    ChevronRight,
    MoreVertical,
    Download,
    Trash2,
    LayoutGrid,
    List,
    User,
    Star,
    Info,
    ArrowUpRight,
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    FolderPlus,
    ArrowLeft,
    X,
    Share2,
    Zap,
    Bell
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import MediaPlayer from "./MediaPlayer";

interface FileItem {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    modifiedAt: string;
}

interface Disk {
    name: string;
    mount: string;
    size: number;
    used: number;
    percent: number;
}

interface DashboardStats {
    total: number;
    used: number;
    percent: number;
    path: string;
    allDisks: Disk[];
}

export default function Dashboard() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [currentPath, setCurrentPath] = useState("");
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showNewMenu, setShowNewMenu] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);

    const fetchData = useCallback(async (path = "", category: string | null = null) => {
        setLoading(true);
        try {
            const url = category
                ? `/files?category=${encodeURIComponent(category)}`
                : `/files?path=${encodeURIComponent(path)}`;
            const response = await api.get(url);
            setFiles(response.data.files);
            setStats(response.data.stats);
            if (!category) {
                setCurrentPath(path);
                setActiveCategory(null);
            } else {
                setActiveCategory(category);
                setCurrentPath("");
            }
        } catch (err) {
            console.error("Erro ao buscar arquivos", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
        formData.append('path', currentPath);

        setLoading(true);
        try {
            await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchData(currentPath);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setLoading(false);
            setShowNewMenu(false);
        }
    };

    const handleCreateFolder = async () => {
        const folderName = prompt("Nome da pasta:");
        if (!folderName) return;

        setLoading(true);
        try {
            await api.post('/create-folder', { folderName, parentPath: currentPath });
            fetchData(currentPath);
        } catch (err) {
            console.error("Failed to create folder", err);
        } finally {
            setLoading(false);
            setShowNewMenu(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogout = () => signOut(auth);

    const filteredFolders = useMemo(() =>
        activeCategory || activeTab === "computer" ? [] : files.filter(f => f.isDirectory && f.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [files, searchQuery, activeCategory, activeTab]
    );

    const filteredFiles = useMemo(() =>
        activeTab === "computer" ? [] : files.filter(f => !f.isDirectory && f.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [files, searchQuery, activeTab]
    );

    const getTypeStats = useMemo(() => {
        return [
            { id: 'documentos', label: 'Documentos', icon: <FileText />, color: 'text-amber-500', bg: 'bg-amber-500/10', size: 'Calculando...', count: 'Docs' },
            { id: 'imagens', label: 'Imagens', icon: <ImageIcon />, color: 'text-blue-500', bg: 'bg-blue-500/10', size: 'Calculando...', count: 'Fotos' },
            { id: 'videos', label: 'Vídeos', icon: <Video />, color: 'text-red-500', bg: 'bg-red-500/10', size: 'Calculando...', count: 'Vídeos' },
            { id: 'musicas', label: 'Músicas', icon: <Music />, color: 'text-purple-500', bg: 'bg-purple-500/10', size: 'Calculando...', count: 'Áudio' },
            { id: 'others', label: 'Outros', icon: <File />, color: 'text-pink-500', bg: 'bg-pink-500/10', size: 'Calculando...', count: 'Arquivos' },
        ];
    }, []);

    const getFileIcon = (file: FileItem) => {
        if (file.isDirectory) return <Folder className="w-full h-full fill-blue-500/20 text-blue-500" />;
        const ext = file.name.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
            case 'doc':
            case 'docx':
            case 'txt': return <FileText className="w-full h-full" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return <ImageIcon className="w-full h-full" />;
            case 'mp4':
            case 'mkv':
            case 'mov': return <Video className="w-full h-full" />;
            case 'mp3':
            case 'wav': return <Music className="w-full h-full" />;
            default: return <File className="w-full h-full" />;
        }
    };

    return (
        <div className="flex h-screen bg-[#FDFEFE] text-zinc-900 font-sans overflow-hidden">
            {/* 1. Sidebar Left - Responsive */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 bg-[#FDFEFE] border-r border-zinc-100 flex flex-col z-50 px-6 py-8 transition-transform duration-300 lg:relative lg:translate-x-0",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between mb-10 pl-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl">C</div>
                        <span className="font-bold text-xl tracking-tight text-blue-900">CloudDesk</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 text-zinc-400 hover:bg-zinc-100 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <nav className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-5 mb-2">Principal</p>
                        <SidebarItem icon={<LayoutGrid size={18} />} label="Início" active={activeTab === "dashboard"} onClick={() => { setActiveTab("dashboard"); fetchData(""); }} />
                        <SidebarItem icon={<HardDrive size={18} />} label="Meu computador" active={activeTab === "computer"} onClick={() => setActiveTab("computer")} />
                        <SidebarItem icon={<Clock size={18} />} label="Recentes" active={activeTab === "recent"} onClick={() => setActiveTab("recent")} />
                        <SidebarItem icon={<Star size={18} />} label="Favoritos" active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} />
                        <SidebarItem icon={<Trash2 size={18} />} label="Lixeira" active={activeTab === "trash"} onClick={() => setActiveTab("trash")} />
                    </div>

                    <div className="space-y-1 pt-4">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-5 mb-2">Categorias</p>
                        <SidebarItem icon={<ImageIcon size={18} />} label="Imagens" active={activeCategory === "imagens"} onClick={() => fetchData("", "imagens")} />
                        <SidebarItem icon={<Video size={18} />} label="Vídeos" active={activeCategory === "videos"} onClick={() => fetchData("", "videos")} />
                        <SidebarItem icon={<Music size={18} />} label="Músicas" active={activeCategory === "musicas"} onClick={() => fetchData("", "musicas")} />
                        <SidebarItem icon={<FileText size={18} />} label="Documentos" active={activeCategory === "documentos"} onClick={() => fetchData("", "documentos")} />
                        <SidebarItem icon={<File size={18} />} label="Arquivos" active={activeCategory === "arquivos"} onClick={() => fetchData("", null)} />
                    </div>

                    <div className="space-y-1 pt-4">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-5 mb-2">Sistema</p>
                        <SidebarItem icon={<Zap size={18} />} label="Limpeza" active={activeTab === "clean"} onClick={() => setActiveTab("clean")} />
                        <SidebarItem icon={<Settings size={18} />} label="Configurações" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
                    </div>
                </nav>

                {/* Upgrade Card */}
                <div className="mt-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-[32px] border border-blue-100 text-center relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                                <Zap size={24} className="text-blue-600 fill-blue-600" />
                            </motion.div>
                        </div>
                        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-1">Assinante Pro</p>
                        <p className="text-sm font-bold text-blue-900 mb-4 px-2 leading-tight">Armazenamento ilimitado ativado!</p>
                        <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Planos</button>
                    </div>
                    {/* Cloudo Mascot Placeholder - Modern Style */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
                        <HardDrive size={120} />
                    </div>
                </div>
            </aside>

            {/* 2. Main Center Content */}
            <main className="flex-1 flex flex-col bg-[#FDFEFE] border-r border-zinc-100 overflow-hidden">
                {/* Top Search Bar */}
                <header className="h-24 flex items-center gap-4 md:gap-6 px-6 md:px-10 shrink-0">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden p-3 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-zinc-100 transition-all border border-zinc-100"
                    >
                        <LayoutGrid size={20} />
                    </button>

                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Pesquise..."
                            className="w-full bg-[#F4F7F9] border-none rounded-2xl py-3.5 pl-14 pr-6 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-zinc-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowNewMenu(!showNewMenu)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 md:px-6 md:py-3.5 rounded-2xl flex items-center gap-3 transition-all font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <Plus size={20} />
                            <span className="hidden md:inline">Criar Novo</span>
                        </button>

                        <AnimatePresence>
                            {showNewMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-3 w-56 bg-white border border-zinc-100 rounded-[24px] shadow-2xl shadow-black/5 p-2 z-50 overflow-hidden"
                                >
                                    <button
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 rounded-xl transition-all text-sm font-bold text-zinc-600"
                                    >
                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <Upload size={16} />
                                        </div>
                                        Upload de Arquivos
                                    </button>
                                    <button
                                        onClick={handleCreateFolder}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 rounded-xl transition-all text-sm font-bold text-zinc-600"
                                    >
                                        <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                            <FolderPlus size={16} />
                                        </div>
                                        Nova Pasta
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                    />

                    <button
                        onClick={() => setShowRightPanel(!showRightPanel)}
                        className="xl:hidden p-3 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-zinc-100 transition-all border border-zinc-100"
                    >
                        <Info size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 custom-scrollbar scroll-smooth">
                    {/* Active Path Breadcrumbs or Title */}
                    <div className="flex items-center gap-2 mb-8">
                        <button
                            onClick={() => { setActiveTab("dashboard"); fetchData(""); }}
                            className="text-zinc-400 hover:text-blue-600 font-bold transition-all"
                        >
                            Início
                        </button>
                        {currentPath.split('/').map((p, i, arr) => (
                            p && (
                                <div key={i} className="flex items-center gap-2">
                                    <ChevronRight size={14} className="text-zinc-300" />
                                    <button
                                        onClick={() => fetchData(arr.slice(0, i + 1).join('/'))}
                                        className={cn(
                                            "font-bold transition-all",
                                            i === arr.length - 1 ? "text-blue-900" : "text-zinc-400 hover:text-blue-600"
                                        )}
                                    >
                                        {p}
                                    </button>
                                </div>
                            )
                        ))}
                        {activeCategory && (
                            <div className="flex items-center gap-2">
                                <ChevronRight size={14} className="text-zinc-300" />
                                <span className="font-bold text-blue-900 capitalize">{activeCategory}</span>
                            </div>
                        )}
                        {activeTab === "computer" && (
                            <div className="flex items-center gap-2">
                                <ChevronRight size={14} className="text-zinc-300" />
                                <span className="font-bold text-blue-900">Meu computador</span>
                            </div>
                        )}
                    </div>

                    {/* Dashboard Overview - Only on landing */}
                    {!currentPath && !activeCategory && activeTab === "dashboard" && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
                                {getTypeStats.map(stat => (
                                    <div
                                        key={stat.id}
                                        onClick={() => fetchData("", stat.id)}
                                        className="bg-white border border-zinc-100 p-4 rounded-2xl hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer group"
                                    >
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                                            {stat.icon}
                                        </div>
                                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">{stat.count}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* "My Computer" - Real Disks View */}
                    {activeTab === "computer" && stats?.allDisks && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                            {stats.allDisks.map(disk => (
                                <div
                                    key={disk.mount}
                                    onClick={() => {
                                        const diskName = disk.mount === '/' ? "" : disk.mount.split('/').pop() || "";
                                        fetchData(diskName);
                                        setActiveTab("dashboard");
                                    }}
                                    className="bg-white border border-zinc-100 p-6 rounded-[24px] hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 shadow-sm",
                                            disk.mount === '/' ? "bg-blue-50 text-blue-500" : "bg-zinc-50 text-zinc-500"
                                        )}>
                                            <HardDrive className="w-full h-full" />
                                        </div>
                                        <div className="text-[10px] font-black text-zinc-400">{disk.percent}%</div>
                                    </div>
                                    <p className="font-bold text-sm text-zinc-800 truncate mb-1">{disk.mount === '/' ? 'Disco Local' : disk.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{formatBytes(disk.used)} / {formatBytes(disk.size)}</p>
                                    <div className="h-1.5 w-full bg-zinc-100 rounded-full mt-4 overflow-hidden">
                                        <div className={cn("h-full", disk.mount === '/' ? "bg-blue-500" : "bg-zinc-400")} style={{ width: `${disk.percent}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Folders Section - HIDE when in categories or computer view */}
                    {!activeCategory && activeTab !== "computer" && (
                        <>
                            <SectionHeader title="Pastas" showViewAll />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                                {filteredFolders.length > 0 ? filteredFolders.map(folder => (
                                    <div
                                        key={folder.path}
                                        onClick={() => { fetchData(folder.path); }}
                                        className="bg-white border border-zinc-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 p-6 rounded-[24px] group transition-all cursor-pointer relative"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2.5">
                                                <Folder className="w-full h-full fill-blue-500/20 text-blue-500" />
                                            </div>
                                            <button className="p-1 hover:bg-zinc-100 rounded-full transition-colors font-bold text-zinc-400">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-zinc-800 truncate mb-1">{folder.name}</p>
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Pasta</p>
                                        </div>
                                    </div>
                                )) : searchQuery && <p className="col-span-4 text-center text-zinc-400 py-10">Nenhuma pasta encontrada</p>}
                            </div>
                        </>
                    )}

                    {/* Files Section */}
                    {activeTab !== "computer" && (
                        <>
                            <SectionHeader
                                title={activeCategory ? activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) : "Arquivos"}
                                showViewAll
                            />
                            <div className="space-y-1 pb-10">
                                <div className="grid grid-cols-12 px-4 py-3 text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-2 border-b border-zinc-50">
                                    <div className="col-span-4">Nome</div>
                                    <div className="col-span-2">Tamanho</div>
                                    <div className="col-span-3 text-center">Modificado em</div>
                                    <div className="col-span-2 text-center">Membros</div>
                                    <div className="col-span-1 text-right"></div>
                                </div>
                                {filteredFiles.length > 0 ? filteredFiles.map(file => (
                                    <div
                                        key={file.path}
                                        onClick={() => setPreviewFile(file)}
                                        className="grid grid-cols-6 sm:grid-cols-12 px-4 py-4 items-center hover:bg-blue-50/20 rounded-2xl transition-all group cursor-pointer"
                                    >
                                        <div className="col-span-4 sm:col-span-4 flex items-center gap-4 pr-4">
                                            <div className="w-9 h-9 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 bg-zinc-50 group-hover:bg-blue-50 rounded-xl p-2 shrink-0 transition-colors">
                                                {getFileIcon(file)}
                                            </div>
                                            <span className="text-sm font-bold truncate text-zinc-700">{file.name}</span>
                                        </div>
                                        <div className="hidden sm:block col-span-2 text-xs font-bold text-zinc-400">{formatBytes(file.size)}</div>
                                        <div className="hidden md:block col-span-3 text-xs font-semibold text-zinc-400 text-center">{new Date(file.modifiedAt).toLocaleDateString()}</div>
                                        <div className="hidden lg:flex col-span-2 justify-center -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-zinc-200 overflow-hidden ring-1 ring-zinc-50">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${file.name}${i}`} alt="Avatar" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-all">
                                            <MoreVertical size={16} className="text-zinc-300" />
                                        </div>
                                    </div>
                                )) : <p className="text-center text-zinc-400 py-20">Nenhum arquivo encontrado</p>}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* 3. Sidebar Right (Storage & Disks) - Responsive */}
            <aside className={cn(
                "fixed inset-y-0 right-0 w-80 bg-[#FDFEFE] border-l border-zinc-100 flex flex-col z-50 px-8 py-10 transition-transform duration-300 xl:relative xl:translate-x-0",
                showRightPanel ? "translate-x-0 overflow-y-auto" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between mb-10">
                    <button onClick={() => setShowRightPanel(false)} className="xl:hidden p-2 text-zinc-400 hover:bg-zinc-100 rounded-xl">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 ml-auto">
                        <HeaderButton icon={<Bell size={20} />} />
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-xl shadow-zinc-200 overflow-hidden ring-4 ring-blue-50">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo" alt="User" />
                        </div>
                    </div>
                </div>

                <h2 className="font-bold text-xl mb-8 text-zinc-800">Sua Nuvem</h2>

                {/* Multi-Disk Storage Summary */}
                {stats && (
                    <div className="space-y-10 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {/* Active Disk Arc Visual */}
                        <div className="relative h-48 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="50%" cy="50%" r="65"
                                    className="fill-none stroke-zinc-100"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="50%" cy="50%" r="65"
                                    className="fill-none stroke-blue-600"
                                    strokeWidth="12"
                                    strokeDasharray={`${(stats.percent / 100) * 408} 408`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-black text-blue-900 leading-tight">{formatBytes(stats.used)}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Usados de {formatBytes(stats.total)}</p>
                            </div>
                        </div>

                        {/* Categories List (Matching Reference Image) */}
                        <div className="space-y-5">
                            {getTypeStats.map(stat => (
                                <div key={stat.id} className="flex items-center justify-between group cursor-pointer hover:bg-zinc-50 p-2 rounded-2xl transition-all -mx-2">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm", stat.bg, stat.color)}>
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-zinc-800">{stat.label}</p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">{stat.count}</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-zinc-800">{stat.size}</p>
                                </div>
                            ))}
                        </div>

                        {/* All Disks Recognition List */}
                        <div className="space-y-6">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Discos Conectados</p>
                            {stats.allDisks.map(disk => (
                                <div key={disk.mount} className="flex items-center gap-4 group cursor-pointer">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all group-hover:scale-110",
                                        disk.mount === '/' ? "bg-blue-50 text-blue-500 shadow-blue-100 ring-2 ring-blue-100" : "bg-zinc-50 text-zinc-500"
                                    )}>
                                        <HardDrive size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[11px] font-bold truncate">{disk.mount === '/' ? 'Disco Principal' : disk.name}</p>
                                            <p className="text-[11px] font-black text-zinc-800">{disk.percent}%</p>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${disk.percent}%` }}
                                                className={cn("h-full", disk.mount === '/' ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]" : "bg-zinc-400")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Import/Upload Area in Right Sidebar */}
                        <div className="bg-white border-2 border-dashed border-zinc-100 rounded-[32px] p-6 text-center hover:border-blue-200 hover:bg-blue-50/10 transition-all cursor-pointer group mt-auto">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Upload size={18} className="text-zinc-400 group-hover:text-blue-600" />
                            </div>
                            <p className="text-[11px] font-bold text-zinc-700">Importar Arquivos</p>
                        </div>
                    </div>
                )}
            </aside>

            {/* Media Player Modal */}
            <AnimatePresence>
                {previewFile && (
                    <MediaPlayer
                        file={previewFile}
                        onClose={() => setPreviewFile(null)}
                        apiUrl={process.env.NEXT_PUBLIC_API_URL || "https://cadillac-editions-transaction-plymouth.trycloudflare.com/api/cloud"}
                    />
                )}
            </AnimatePresence>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
        body { font-family: 'Outfit', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E4E4E7; border-radius: 10px; }
      `}</style>
        </div>
    );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all cursor-pointer group",
                active
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                    : "text-zinc-400 hover:text-zinc-900 border border-transparent hover:border-zinc-50"
            )}
        >
            <span className={cn(active ? "text-white" : "text-zinc-300 group-hover:text-zinc-600")}>
                {icon}
            </span>
            {label}
        </div>
    );
}

function SectionHeader({ title, showViewAll }: { title: string, showViewAll?: boolean }) {
    return (
        <div className="flex items-center justify-between mb-8 px-1">
            <h2 className="font-bold text-xl text-zinc-800">{title}</h2>
            {showViewAll && <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Ver Todos</button>}
        </div>
    )
}

function HeaderButton({ icon }: { icon: React.ReactNode }) {
    return (
        <button className="p-3 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 rounded-xl transition-all active:scale-95 border border-transparent hover:border-blue-50 flex items-center justify-center">
            {icon}
        </button>
    );
}
