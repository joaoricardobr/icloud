"use client";

import { useState, useEffect } from "react";
import { HardDrive, Folder, FileText, Image as ImageIcon, Video, Music, File, Clock, Star, Trash2, Settings, LogOut, ChevronRight, Home, Search, Plus, Upload, MoreVertical } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import api from "@/lib/api";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

interface FileItem {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    modifiedAt: string;
    diskLabel?: string;
}

interface Disk {
    name: string;
    mount: string;
    size: number;
    used: number;
    percent: number;
}

export default function Dashboard() {
    const [currentPath, setCurrentPath] = useState("");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [disks, setDisks] = useState<Disk[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<"home" | "recent" | "favorites" | "trash">("home");

    // Fetch data from backend
    const fetchData = async (path: string = "", mode?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (mode) params.append('mode', mode);
            if (path) params.append('path', path);

            const response = await api.get(`/files?${params.toString()}`);
            setFiles(response.data.files || []);
            setDisks(response.data.stats?.allDisks || []);

            if (!mode) {
                setCurrentPath(path);
            }
        } catch (err) {
            console.error("Error fetching files:", err);
        } finally {
            setLoading(false);
        }
    };

    // Navigate to a path
    const navigateTo = (path: string) => {
        setActiveView("home");
        fetchData(path);
    };

    // Initial load
    useEffect(() => {
        fetchData();
    }, []);

    // Get file icon
    const getFileIcon = (file: FileItem) => {
        if (file.isDirectory) return <Folder className="w-6 h-6 text-blue-500" />;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
            return <ImageIcon className="w-6 h-6 text-green-500" />;
        }
        if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext || '')) {
            return <Video className="w-6 h-6 text-purple-500" />;
        }
        if (['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(ext || '')) {
            return <Music className="w-6 h-6 text-pink-500" />;
        }
        if (['pdf', 'doc', 'docx', 'txt', 'xlsx'].includes(ext || '')) {
            return <FileText className="w-6 h-6 text-red-500" />;
        }
        return <File className="w-6 h-6 text-gray-500" />;
    };

    // Generate breadcrumbs
    const getBreadcrumbs = () => {
        if (!currentPath) return [{ name: "Home", path: "" }];

        const parts = currentPath.split('/').filter(Boolean);
        const breadcrumbs = [{ name: "Home", path: "" }];

        let accumulatedPath = "";
        parts.forEach(part => {
            accumulatedPath += `/${part}`;
            breadcrumbs.push({ name: part, path: accumulatedPath });
        });

        return breadcrumbs;
    };

    const handleLogout = async () => {
        await signOut(auth);
        window.location.href = "/";
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">CloudDesk</h1>
                </div>

                <nav className="flex-1 px-3">
                    <button
                        onClick={() => { setActiveView("home"); fetchData(""); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors",
                            activeView === "home" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        <Home size={20} />
                        <span className="font-medium">Início</span>
                    </button>

                    <button
                        onClick={() => { setActiveView("recent"); fetchData("", "recent"); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors",
                            activeView === "recent" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        <Clock size={20} />
                        <span className="font-medium">Recentes</span>
                    </button>

                    <button
                        onClick={() => { setActiveView("favorites"); fetchData("", "favorites"); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors",
                            activeView === "favorites" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        <Star size={20} />
                        <span className="font-medium">Favoritos</span>
                    </button>

                    <button
                        onClick={() => { setActiveView("trash"); fetchData("", "trash"); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors",
                            activeView === "trash" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        <Trash2 size={20} />
                        <span className="font-medium">Lixeira</span>
                    </button>

                    <div className="border-t border-gray-200 my-4"></div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sair</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm">
                            {getBreadcrumbs().map((crumb, index) => (
                                <div key={crumb.path} className="flex items-center gap-2">
                                    {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
                                    <button
                                        onClick={() => navigateTo(crumb.path)}
                                        className={cn(
                                            "hover:text-blue-600 transition-colors",
                                            index === getBreadcrumbs().length - 1 ? "text-gray-900 font-medium" : "text-gray-600"
                                        )}
                                    >
                                        {crumb.name}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar arquivos..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-gray-500">Carregando...</div>
                        </div>
                    ) : (
                        <>
                            {/* Show disks on home view */}
                            {activeView === "home" && currentPath === "" && disks.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus Discos</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {disks.map(disk => (
                                            <div
                                                key={disk.mount}
                                                onClick={() => navigateTo(disk.mount)}
                                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <HardDrive className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-500">{disk.percent}%</span>
                                                </div>
                                                <h3 className="font-medium text-gray-900 mb-1">{disk.name}</h3>
                                                <p className="text-xs text-gray-500">{formatBytes(disk.used)} / {formatBytes(disk.size)}</p>
                                                <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-600" style={{ width: `${disk.percent}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files and Folders Grid */}
                            {files.length > 0 ? (
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        {activeView === "recent" && "Arquivos Recentes"}
                                        {activeView === "favorites" && "Favoritos"}
                                        {activeView === "trash" && "Lixeira"}
                                        {activeView === "home" && currentPath && "Conteúdo"}
                                        {activeView === "home" && !currentPath && files.length > 0 && "Pastas Rápidas"}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {files.map(file => (
                                            <div
                                                key={file.path}
                                                onClick={() => file.isDirectory && navigateTo(file.path)}
                                                className={cn(
                                                    "bg-white border border-gray-200 rounded-lg p-4 transition-all",
                                                    file.isDirectory ? "hover:shadow-lg hover:border-blue-300 cursor-pointer" : "hover:shadow-md"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0">
                                                        {getFileIcon(file)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatBytes(file.size)} • {new Date(file.modifiedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button className="flex-shrink-0 p-1 hover:bg-gray-100 rounded">
                                                        <MoreVertical size={16} className="text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                    <Folder size={48} className="mb-4 text-gray-300" />
                                    <p>Nenhum arquivo encontrado</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
