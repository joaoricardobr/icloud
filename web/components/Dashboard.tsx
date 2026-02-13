"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import api, { refreshApiConfig } from "@/lib/api";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import DiskCard from "./DiskCard";
import CategoryCard from "./CategoryCard";
import FileGrid from "./FileGrid";
import FilePreview from "./FilePreview";
import CreateFolderModal from "./modals/CreateFolderModal";
import UploadModal from "./modals/UploadModal";
import SettingsPage from "@/app/dashboard/settings/page";
import { pageTransition, staggerContainer } from "@/lib/animations";
import { RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCache, setCache } from "@/lib/db";

interface FileItem {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    mtime: string;
    isFavorite?: boolean;
    diskLabel?: string;
    category?: string;
}

interface Disk {
    name: string;
    mount: string;
    size: number;
    used: number;
    percent: number;
    type?: "system" | "external";
}

interface CategoryStats {
    imagens: { count: number; size: number; files: FileItem[] };
    videos: { count: number; size: number; files: FileItem[] };
    musicas: { count: number; size: number; files: FileItem[] };
    documentos: { count: number; size: number; files: FileItem[] };
}

export default function Dashboard() {
    const [currentPath, setCurrentPath] = useState("");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [disks, setDisks] = useState<Disk[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [activeView, setActiveView] = useState<"home" | "recent" | "favorites" | "trash" | "category" | "settings">("home");
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number>(-1);

    // New states for features
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("name");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

    // Fetch data from backend
    const fetchData = async (path: string = "", mode?: string, category?: string) => {
        const cacheKey = `data_${path || 'root'}_${mode || 'none'}_${category || 'none'}`;

        // Try to load from cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            setFiles(cachedData.files || []);
            setDisks(cachedData.stats?.allDisks || []);
            setCategoryStats(cachedData.stats?.categories || null);
            if (!mode && !category) setCurrentPath(path);
        } else {
            setLoading(true);
        }

        setError("");
        try {
            const params = new URLSearchParams();
            if (mode) params.append('mode', mode);
            if (path) params.append('path', path);
            if (category) params.append('category', category);

            const response = await api.get(`/files?${params.toString()}`);
            const data = response.data;

            const filesData = data.files || [];
            const disksData = data.stats?.allDisks || [];
            const categoriesData = data.stats?.categories || null;

            setFiles(filesData);
            setDisks(disksData);
            setCategoryStats(categoriesData);

            // Save to cache
            setCache(cacheKey, data);

            if (!mode && !category) {
                setCurrentPath(path);
            }
        } catch (err: any) {
            console.error("[Dashboard] Error fetching files:", err);
            const errorMsg = err.response?.data?.error || err.message || "Erro ao carregar dados";
            setError(errorMsg);
            if (!cachedData) {
                setFiles([]);
                setDisks([]);
                setCategoryStats(null);
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshApiConfig();
            await fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err) {
            console.error("Refresh failed:", err);
            setIsRefreshing(false);
        }
    };

    // Navigate to a path
    const navigateTo = (path: string) => {
        setActiveView("home");
        setActiveCategory("");
        fetchData(path);
    };

    // Change view
    const handleViewChange = (view: "home" | "recent" | "favorites" | "trash" | "settings") => {
        setActiveView(view);
        setActiveCategory("");
        setSearchQuery("");
        setFilterType("all");

        if (view === "settings") {
            setLoading(false);
            setFiles([]);
            setDisks([]);
            setCategoryStats(null);
            setCurrentPath("");
            return;
        }

        if (view === "home") {
            fetchData("");
        } else {
            fetchData("", view);
        }
    };

    // Change category
    const handleCategoryChange = (category: string) => {
        setActiveView("category");
        setActiveCategory(category);
        setSearchQuery("");
        setFilterType("all");
        fetchData("", undefined, category);
    };

    // Handle file click
    const handleFileClick = (file: FileItem) => {
        if (selectedPaths.length > 0) {
            handleSelectionChange(file.path);
            return;
        }

        if (file.isDirectory) {
            navigateTo(file.path);
        } else {
            const fileIndex = filteredFiles.findIndex(f => f.path === file.path);
            setPreviewFile(file);
            setPreviewIndex(fileIndex);
        }
    };

    const handleSelectionChange = (path: string) => {
        setSelectedPaths(prev =>
            prev.includes(path)
                ? prev.filter(p => p !== path)
                : [...prev, path]
        );
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            setSelectedPaths(filteredFiles.map(f => f.path));
        } else {
            setSelectedPaths([]);
        }
    };

    const handleDownloadZip = async () => {
        if (selectedPaths.length === 0) return;

        try {
            const response = await api.post('/download-zip', { paths: selectedPaths }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `clouddesk_backup_${Date.now()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setSelectedPaths([]);
        } catch (err: any) {
            alert("Erro ao gerar ZIP: " + (err.response?.data?.error || err.message));
        }
    };

    const handleShare = async (file?: FileItem) => {
        const pathsToShare = file ? [file.path] : selectedPaths;
        if (pathsToShare.length === 0) return;

        // For simplicity, we share the first item if multiple are selected, 
        // or we could generate a temporary shared link if we had that feature.
        // For now, we share a direct download link of the first selected item.
        const baseUrl = window.location.origin;
        const shareUrl = `${api.defaults.baseURL}/download?path=${encodeURIComponent(pathsToShare[0])}`;

        try {
            await navigator.clipboard.writeText(shareUrl);
            alert("Link de compartilhamento copiado para a área de transferência!");
            if (!file) setSelectedPaths([]);
        } catch (err) {
            alert("Erro ao copiar link.");
        }
    };

    // File Operations
    const handleUploadClick = (filesToUpload: FileList | null) => {
        if (filesToUpload && filesToUpload.length > 0) {
            setPendingFiles(filesToUpload);
            setShowUploadModal(true);
        }
    };

    const handleUpload = async (filesToUpload: FileList | null, destinationOverride?: string) => {
        if (!filesToUpload || filesToUpload.length === 0) return;

        setIsUploading(true);
        const targetPath = destinationOverride !== undefined ? destinationOverride : currentPath;
        const formData = new FormData();
        formData.append("path", targetPath);
        for (let i = 0; i < filesToUpload.length; i++) {
            formData.append("files", filesToUpload[i]);
        }

        try {
            await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err: any) {
            alert("Erro ao enviar arquivos: " + (err.response?.data?.error || err.message));
        } finally {
            setIsUploading(false);
        }
    };

    const handleNewFolder = async (nameOverride?: string, pathOverride?: string) => {
        let name = nameOverride;
        let path = pathOverride !== undefined ? pathOverride : currentPath;

        if (!name) {
            name = prompt("Nome da nova pasta:") || undefined;
        }

        if (!name) return;

        try {
            await api.post("/create-folder", { path, name });
            fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err: any) {
            alert("Erro ao criar pasta: " + (err.response?.data?.error || err.message));
        }
    };

    const handleToggleFavorite = async (file: FileItem) => {
        try {
            await api.post("/favorite", { path: file.path });
            // Refresh current view
            fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err: any) {
            console.error("Error toggling favorite:", err);
        }
    };

    const handleDelete = async (file: FileItem) => {
        if (activeView === "trash") {
            if (!confirm(`Tem certeza que deseja excluir "${file.name}" PERMANENTEMENTE? Esta ação não pode ser desfeita.`)) return;
            try {
                await api.post("/permanent-delete", { path: file.path });
                fetchData("", "trash");
            } catch (err: any) {
                alert("Erro ao excluir permanentemente: " + (err.response?.data?.error || err.message));
            }
            return;
        }

        if (!confirm(`Tem certeza que deseja mover "${file.name}" para a lixeira?`)) return;

        try {
            await api.delete("/delete", { data: { path: file.path } });
            fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err: any) {
            alert("Erro ao excluir: " + (err.response?.data?.error || err.message));
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm("Tem certeza que deseja ESVAZIAR A LIXEIRA? Todos os itens serão apagados permanentemente.")) return;

        try {
            await api.post("/empty-trash");
            fetchData("", "trash");
        } catch (err: any) {
            alert("Erro ao esvaziar lixeira: " + (err.response?.data?.error || err.message));
        }
    };

    // Filtered and Sorted files
    const filteredFiles = files
        .filter(file => {
            const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesFilter = true;
            if (filterType === "folders") matchesFilter = file.isDirectory;
            else if (filterType === "files") matchesFilter = !file.isDirectory;
            else if (filterType === "favorite") matchesFilter = !!file.isFavorite;
            else if (filterType !== "all") {
                // Category-based filtering (image, video, audio, document)
                const ext = file.name.split('.').pop()?.toLowerCase() || '';
                const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                const videos = ['mp4', 'mkv', 'mov', 'avi', 'webm'];
                const audios = ['mp3', 'wav', 'flac', 'm4a', 'ogg'];
                const docs = ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx'];

                if (filterType === "image") matchesFilter = images.includes(ext);
                else if (filterType === "video") matchesFilter = videos.includes(ext);
                else if (filterType === "audio") matchesFilter = audios.includes(ext);
                else if (filterType === "document") matchesFilter = docs.includes(ext);
            }

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "size") return b.size - a.size;
            if (sortBy === "date") return new Date(b.mtime).getTime() - new Date(a.mtime).getTime();
            return 0;
        });

    // Navigate to next file in preview
    const handleNextFile = () => {
        const nextIndex = previewIndex + 1;
        if (nextIndex < filteredFiles.length) {
            const nextFile = filteredFiles[nextIndex];
            if (!nextFile.isDirectory) {
                setPreviewFile(nextFile);
                setPreviewIndex(nextIndex);
            } else {
                let i = nextIndex + 1;
                while (i < filteredFiles.length && filteredFiles[i].isDirectory) i++;
                if (i < filteredFiles.length) {
                    setPreviewFile(filteredFiles[i]);
                    setPreviewIndex(i);
                }
            }
        }
    };

    const handlePreviousFile = () => {
        const prevIndex = previewIndex - 1;
        if (prevIndex >= 0) {
            const prevFile = filteredFiles[prevIndex];
            if (!prevFile.isDirectory) {
                setPreviewFile(prevFile);
                setPreviewIndex(prevIndex);
            } else {
                let i = prevIndex - 1;
                while (i >= 0 && filteredFiles[i].isDirectory) i--;
                if (i >= 0) {
                    setPreviewFile(filteredFiles[i]);
                    setPreviewIndex(i);
                }
            }
        }
    };

    const hasNextFile = () => {
        for (let i = previewIndex + 1; i < filteredFiles.length; i++) {
            if (!filteredFiles[i].isDirectory) return true;
        }
        return false;
    };

    const hasPreviousFile = () => {
        for (let i = previewIndex - 1; i >= 0; i--) {
            if (!filteredFiles[i].isDirectory) return true;
        }
        return false;
    };

    // Generate breadcrumbs
    const getBreadcrumbs = () => {
        if (activeView === "category") {
            return [
                { name: "Início", path: "" },
                { name: getCategoryDisplayName(activeCategory), path: "" }
            ];
        }

        if (activeView !== "home") {
            const views: Record<string, string> = {
                recent: "Recentes",
                favorites: "Favoritos",
                trash: "Lixeira"
            };
            return [
                { name: "Início", path: "" },
                { name: views[activeView] || activeView, path: "" }
            ];
        }

        if (!currentPath) return [{ name: "Início", path: "" }];

        const parts = currentPath.split('/').filter(Boolean);
        const breadcrumbs = [{ name: "Início", path: "" }];

        let accumulatedPath = "";
        parts.forEach(part => {
            // Check if it's a Linux absolute path or relative home
            accumulatedPath += accumulatedPath.endsWith('/') ? part : (accumulatedPath ? '/' : '') + part;
            // Ensure first part is treated as path if it starts with /
            const fullPath = currentPath.startsWith('/') && !accumulatedPath.startsWith('/') ? '/' + accumulatedPath : accumulatedPath;
            breadcrumbs.push({ name: part, path: fullPath });
        });

        return breadcrumbs;
    };

    const getCategoryDisplayName = (cat: string) => {
        const names: Record<string, string> = {
            imagens: "Imagens",
            videos: "Vídeos",
            musicas: "Músicas",
            documentos: "Documentos"
        };
        return names[cat] || cat;
    };

    const handleLogout = async () => {
        await api.post("/logout").catch(() => { }); // Optional
        await signOut(auth);
        window.location.href = "/";
    };

    // Initial load
    useEffect(() => {
        fetchData();

        // Automatic refresh every 5 minutes if window is focused
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                console.log("🔄 Auto-refreshing connectivity...");
                handleRefresh();
            }
        }, 5 * 60 * 1000);

        // Also refresh when tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleRefresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                activeView={activeView}
                activeCategory={activeCategory}
                onViewChange={handleViewChange}
                onCategoryChange={handleCategoryChange}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* TopBar */}
                <TopBar
                    breadcrumbs={getBreadcrumbs()}
                    onNavigate={navigateTo}
                    onUpload={handleUploadClick}
                    onNewFolderClick={() => setShowCreateFolderModal(true)}
                    onSearch={setSearchQuery}
                    onFilterChange={setFilterType}
                    onSortChange={setSortBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    currentFilter={filterType}
                    currentSort={sortBy}
                    selectedCount={selectedPaths.length}
                    onSelectAll={handleSelectAll}
                    onDownloadZip={handleDownloadZip}
                    onShareSelected={() => handleShare()}
                    isAllSelected={selectedPaths.length > 0 && selectedPaths.length === filteredFiles.length}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    {activeView === 'settings' ? (
                        <SettingsPage />
                    ) : (
                        <>
                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm"
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-red-900">Erro na Operação</h3>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                    <button
                                        onClick={() => fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined)}
                                        className="px-4 py-2 bg-white border border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Tentar novamente
                                    </button>
                                </motion.div>
                            )}

                            {/* Filters Bar (Internal) */}
                            {activeView !== "home" || currentPath ? (
                                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                                    <h2 className="text-2xl font-black text-slate-800">
                                        {activeView === "home" ? (currentPath ? "Arquivos" : "Painel") :
                                            activeView === "category" ? getCategoryDisplayName(activeCategory) :
                                                getBreadcrumbs().slice(-1)[0].name}
                                    </h2>

                                    <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                                        {activeView === "trash" && files.length > 0 && (
                                            <button
                                                onClick={handleEmptyTrash}
                                                className="px-4 py-1.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all mr-2 flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Esvaziar Lixeira
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setFilterType("all")}
                                            className={cn("px-4 py-1.5 rounded-xl text-sm font-bold transition-all", filterType === "all" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setFilterType("folders")}
                                            className={cn("px-4 py-1.5 rounded-xl text-sm font-bold transition-all", filterType === "folders" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}
                                        >
                                            Pastas
                                        </button>
                                        <button
                                            onClick={() => setFilterType("files")}
                                            className={cn("px-4 py-1.5 rounded-xl text-sm font-bold transition-all", filterType === "files" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}
                                        >
                                            Arquivos
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <LoadingSkeleton key="loading" />
                                ) : (
                                    <motion.div
                                        key={activeView + activeCategory + currentPath + searchQuery + filterType}
                                        variants={pageTransition}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="pb-12"
                                    >
                                        {/* HOME VIEW - Show Categories + Disks */}
                                        {activeView === "home" && !currentPath && (
                                            <div className="space-y-12">
                                                {/* Category Cards */}
                                                {categoryStats && (
                                                    <section>
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div>
                                                                <h2 className="text-3xl font-black text-slate-900">Meu Armazenamento</h2>
                                                                <p className="text-slate-500">Acesse seus arquivos por categoria</p>
                                                            </div>
                                                        </div>
                                                        <motion.div
                                                            variants={staggerContainer}
                                                            initial="hidden"
                                                            animate="visible"
                                                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                                                        >
                                                            <CategoryCard
                                                                category="imagens"
                                                                count={categoryStats.imagens?.count || 0}
                                                                size={categoryStats.imagens?.size || 0}
                                                                onClick={() => handleCategoryChange("imagens")}
                                                            />
                                                            <CategoryCard
                                                                category="videos"
                                                                count={categoryStats.videos?.count || 0}
                                                                size={categoryStats.videos?.size || 0}
                                                                onClick={() => handleCategoryChange("videos")}
                                                            />
                                                            <CategoryCard
                                                                category="musicas"
                                                                count={categoryStats.musicas?.count || 0}
                                                                size={categoryStats.musicas?.size || 0}
                                                                onClick={() => handleCategoryChange("musicas")}
                                                            />
                                                            <CategoryCard
                                                                category="documentos"
                                                                count={categoryStats.documentos?.count || 0}
                                                                size={categoryStats.documentos?.size || 0}
                                                                onClick={() => handleCategoryChange("documentos")}
                                                            />
                                                        </motion.div>
                                                    </section>
                                                )}

                                                {/* Disk Cards */}
                                                {disks.length > 0 && (
                                                    <section>
                                                        <div className="mb-8">
                                                            <h2 className="text-3xl font-black text-slate-900">Dispositivos Conectados</h2>
                                                            <p className="text-slate-500">Unidades de disco locais e externas</p>
                                                        </div>
                                                        <motion.div
                                                            variants={staggerContainer}
                                                            initial="hidden"
                                                            animate="visible"
                                                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                                                        >
                                                            {disks.map(disk => (
                                                                <DiskCard
                                                                    key={disk.mount}
                                                                    name={disk.name}
                                                                    mount={disk.mount}
                                                                    size={disk.size}
                                                                    used={disk.used}
                                                                    percent={disk.percent}
                                                                    type={disk.type}
                                                                    onClick={() => navigateTo(disk.mount)}
                                                                />
                                                            ))}
                                                        </motion.div>
                                                    </section>
                                                )}

                                                {/* Recent files if on home */}
                                                {files.length > 0 && (
                                                    <section>
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div>
                                                                <h2 className="text-3xl font-black text-slate-900">Arquivos Rápidos</h2>
                                                                <p className="text-slate-500">Itens encontrados no diretório pessoal</p>
                                                            </div>
                                                        </div>
                                                        <FileGrid
                                                            files={filteredFiles}
                                                            onFileClick={handleFileClick}
                                                            onToggleFavorite={handleToggleFavorite}
                                                            onDelete={handleDelete}
                                                            onShare={handleShare}
                                                            viewMode={viewMode}
                                                            selectedPaths={selectedPaths}
                                                            onSelectionChange={handleSelectionChange}
                                                        />
                                                    </section>
                                                )}
                                            </div>
                                        )}

                                        {/* OTHER VIEWS */}
                                        {(activeView !== "home" || currentPath) && (
                                            <FileGrid
                                                files={filteredFiles}
                                                onFileClick={handleFileClick}
                                                onToggleFavorite={handleToggleFavorite}
                                                onDelete={handleDelete}
                                                onShare={handleShare}
                                                viewMode={viewMode}
                                                selectedPaths={selectedPaths}
                                                onSelectionChange={handleSelectionChange}
                                            />
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>

                {/* Upload Status Overlay */}
                <AnimatePresence>
                    {isUploading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute bottom-8 right-8 bg-slate-900 text-white p-6 rounded-3xl shadow-2xl z-50 flex items-center gap-4"
                        >
                            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            <div>
                                <h4 className="font-bold">Enviando Arquivos...</h4>
                                <p className="text-xs text-white/60">Por favor, aguarde o processamento</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreview
                    file={previewFile}
                    onClose={() => {
                        setPreviewFile(null);
                        setPreviewIndex(-1);
                    }}
                    onNext={hasNextFile() ? handleNextFile : undefined}
                    onPrevious={hasPreviousFile() ? handlePreviousFile : undefined}
                    hasNext={hasNextFile()}
                    hasPrevious={hasPreviousFile()}
                />
            )}

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onCreate={handleNewFolder}
                disks={disks}
                currentPath={currentPath}
            />

            {/* Upload Modal */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => {
                    setShowUploadModal(false);
                    setPendingFiles(null);
                }}
                onUpload={handleUpload}
                disks={disks}
                currentPath={currentPath}
                onOpenCreateFolder={() => setShowCreateFolderModal(true)}
                initialFiles={pendingFiles}
            />
        </div>
    );
}

const LoadingSkeleton: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="skeleton w-14 h-14 rounded-xl mb-4" />
                        <div className="skeleton w-32 h-6 mb-2" />
                        <div className="skeleton w-24 h-4 mb-1" />
                        <div className="skeleton w-28 h-4" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-md">
                        <div className="flex items-start gap-3">
                            <div className="skeleton w-12 h-12 rounded-lg" />
                            <div className="flex-1">
                                <div className="skeleton w-full h-4 mb-2" />
                                <div className="skeleton w-24 h-3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
