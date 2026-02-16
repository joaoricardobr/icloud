"use client";

import { useState, useEffect, useCallback } from "react";
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
import { pageTransition, staggerContainer, slideInFromTop } from "@/lib/animations";
import {
    RefreshCw,
    HardDrive,
    Trash2,
    CheckCircle2,
    AlertCircle,
    XCircle,
    History,
    Clock,
    UploadCloud,
    X,
    RotateCcw,
    File,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
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
    temperature?: number | null;
    type?: "system" | "external";
}

interface CategoryStats {
    imagens: { count: number; size: number; files: FileItem[] };
    videos: { count: number; size: number; files: FileItem[] };
    musicas: { count: number; size: number; files: FileItem[] };
    documentos: { count: number; size: number; files: FileItem[] };
}

interface UploadHistoryItem {
    id: string;
    name: string;
    path: string;
    status: "uploading" | "success" | "error" | "cancelled";
    progress: number;
    size: number;
    timestamp: number;
    error?: string;
    files?: FileList | File[]; // Store files for retry if possible (won't persist in localStorage)
}

interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
}

export default function Dashboard() {
    const [currentPath, setCurrentPath] = useState("");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [disks, setDisks] = useState<Disk[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [activeView, setActiveView] = useState<"home" | "recent" | "favorites" | "trash" | "category" | "settings" | "explorer">("home");
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number>(-1);
    const [storageStats, setStorageStats] = useState<any>(null);
    const [serverStatus, setServerStatus] = useState<"online" | "offline" | "checking">("checking");

    // Theme and Mode States
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "light" | "dark";
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
    const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);

    // Persistence for Upload History
    useEffect(() => {
        const savedHistory = localStorage.getItem("upload_history");
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                // Sanitize: items that were 'uploading' should be marked 'cancelled' or removed after reload
                const sanitized = parsed.map((item: any) =>
                    item.status === 'uploading' ? { ...item, status: 'cancelled' } : item
                );
                setUploadHistory(sanitized);
            } catch (e) {
                console.error("Failed to parse upload history", e);
            }
        }
    }, []);

    useEffect(() => {
        if (uploadHistory.length > 0) {
            // Only persist status, metadata, not the File objects
            const toPersist = uploadHistory.map(({ files, ...rest }) => rest);
            localStorage.setItem("upload_history", JSON.stringify(toPersist.slice(0, 50))); // Keep last 50
        }
    }, [uploadHistory]);

    const addToast = (message: string, type: Toast["type"] = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    // Fetch data from backend
    const fetchData = useCallback(async (path: string = "", mode?: string, category?: string) => {
        const cacheKey = `data_${path || 'root'}_${mode || 'none'}_${category || 'none'}`;

        // Flicker Fix: If we already have some data, don't show full loading screen
        const hasData = files.length > 0 || disks.length > 0;

        // 1. Try Load from Cache First (Offline Support)
        if (!hasData) {
            setLoading(true);
            try {
                const cachedData = await getCache(cacheKey);
                if (cachedData) {
                    setFiles(cachedData.files || []);
                    setDisks(cachedData.stats?.allDisks || []);
                    setCategoryStats(cachedData.stats?.categories || null);
                    setStorageStats(cachedData.stats);
                    setLoading(false); // Show cached content immediately
                    console.log("Loaded from cache:", cacheKey);
                }
            } catch (e) {
                console.error("Cache load error:", e);
            }
        } else {
            setIsRefreshing(true);
        }

        setError("");

        try {
            const params = new URLSearchParams();
            if (mode) params.append('mode', mode);
            if (path) params.append('path', path);
            if (category) params.append('category', category);

            // Set timeout to avoid long hangs
            const response = await api.get(`files?${params.toString()}`, { timeout: 10000 });
            const data = response.data;

            const filesData = data.files || [];
            const disksData = data.stats?.allDisks || [];
            const categoriesData = data.stats?.categories || null;

            setFiles(filesData);
            setDisks(disksData);
            setCategoryStats(categoriesData);
            setStorageStats(data.stats);
            setServerStatus("online");

            // Save to cache
            setCache(cacheKey, data);

            if (!mode && !category) {
                // Path already set optimistically in navigateTo, 
                // but we ensure it matches the actual fetched path here.
                setCurrentPath(path);
            }

        } catch (err) {
            console.error("[Dashboard] Error fetching files:", err);
            // Only show error if we have NO data (live or cached)
            if (files.length === 0 && disks.length === 0) {
                // Double check if cache failed too (inner check above handles it, but maybe cache was empty)
                // We try to get cache one last time if we haven't already? No, we did.
                setError("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
            }
            setServerStatus("offline");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []); // Removed files.length/disks.length to stop the infinite loop

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await refreshApiConfig();
            await fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err) {
            console.error("Refresh failed:", err);
            setIsRefreshing(false);
        }
    }, [fetchData, currentPath, activeView, activeCategory]);

    // Navigate to a path
    // Navigate to a path
    const navigateTo = (path: string) => {
        setActiveView("home");
        setActiveCategory("");
        setCurrentPath(path); // Optimistic update to switch view immediately
        fetchData(path);
    };

    // Change view
    const handleViewChange = (view: "home" | "recent" | "favorites" | "trash" | "settings" | "explorer") => {
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
            const response = await api.post('download-zip', { paths: selectedPaths }, {
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

        const targetPath = destinationOverride !== undefined ? destinationOverride : currentPath;

        // Add to history
        const newHistoryItems: UploadHistoryItem[] = [];
        for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            const historyItem: UploadHistoryItem = {
                id: Math.random().toString(36).substring(2, 11),
                name: file.name,
                path: targetPath,
                status: "uploading",
                progress: 0,
                size: file.size,
                timestamp: Date.now(),
                files: [file] // Store the specific file for retry
            };
            newHistoryItems.push(historyItem);
        }

        setUploadHistory(prev => [...newHistoryItems, ...prev]);
        setIsUploadPanelOpen(true);
        addToast(`Iniciando envio de ${filesToUpload.length} arquivo(s)...`, "info");

        const formData = new FormData();
        formData.append("path", targetPath);
        for (let i = 0; i < filesToUpload.length; i++) {
            formData.append("files", filesToUpload[i]);
        }

        try {
            await api.post("upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploadProgress(percentCompleted);

                    // Update all active items in history
                    setUploadHistory(prev => prev.map(item => {
                        if (newHistoryItems.some(ni => ni.id === item.id)) {
                            return { ...item, progress: percentCompleted };
                        }
                        return item;
                    }));
                }
            });

            setUploadStatus("success");
            addToast(`${filesToUpload.length} arquivo(s) enviados com sucesso!`, "success");

            setUploadHistory(prev => prev.map(item => {
                if (newHistoryItems.some(ni => ni.id === item.id)) {
                    return { ...item, status: "success", progress: 100 };
                }
                return item;
            }));

            fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err: any) {
            setUploadStatus("error");
            const errorMsg = err.response?.data?.error || err.message;
            addToast(`Erro no envio: ${errorMsg}`, "error");

            setUploadHistory(prev => prev.map(item => {
                if (newHistoryItems.some(ni => ni.id === item.id)) {
                    return { ...item, status: "error", error: errorMsg };
                }
                return item;
            }));
            console.error("Upload error:", err);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleRetryUpload = (item: UploadHistoryItem) => {
        if (item.files) {
            // Need to convert File[]/FileList back or pass directly
            const itemList = item.files as any;
            // Remove the failed item from history before retrying to avoid double entries
            setUploadHistory(prev => prev.filter(h => h.id !== item.id));
            handleUpload(itemList, item.path);
        } else {
            addToast("Arquivo não disponível para reenvio. Tente selecionar o arquivo novamente.", "warning");
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
            await api.post("create-folder", { path, name });
            fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err: any) {
            alert("Erro ao criar pasta: " + (err.response?.data?.error || err.message));
        }
    };

    const handleToggleFavorite = async (file: FileItem) => {
        try {
            await api.post("favorite", { path: file.path });
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
                await api.post("permanent-delete", { path: file.path });
                fetchData("", "trash");
            } catch (err: any) {
                alert("Erro ao excluir permanentemente: " + (err.response?.data?.error || err.message));
            }
            return;
        }

        if (!confirm(`Tem certeza que deseja mover "${file.name}" para a lixeira?`)) return;

        try {
            await api.delete("delete", { data: { path: file.path } });
            fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
        } catch (err: any) {
            alert("Erro ao excluir: " + (err.response?.data?.error || err.message));
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm("Tem certeza que deseja ESVAZIAR A LIXEIRA? Todos os itens serão apagados permanentemente.")) return;

        try {
            await api.post("empty-trash");
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

    const getNextPreviewFile = () => {
        for (let i = previewIndex + 1; i < filteredFiles.length; i++) {
            if (!filteredFiles[i].isDirectory) return filteredFiles[i];
        }
        return null;
    };

    const getPrevPreviewFile = () => {
        for (let i = previewIndex - 1; i >= 0; i--) {
            if (!filteredFiles[i].isDirectory) return filteredFiles[i];
        }
        return null;
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
                trash: "Lixeira",
                explorer: "Arquivos"
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
        await api.post("logout").catch(() => { }); // Optional
        await signOut(auth);
        window.location.href = "/";
    };

    // Initial load and SSE Connection
    useEffect(() => {
        let eventSource: EventSource | null = null;
        let waitForApi: NodeJS.Timeout | null = null;

        const setupSSE = () => {
            if (eventSource) eventSource.close();
            console.log("🔌 Connecting SSE:", `${api.defaults.baseURL}/events`);
            eventSource = new EventSource(`${api.defaults.baseURL}/events`);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'disk_change') {
                        console.log("💿 Disk change detected via SSE, refreshing...");
                        handleRefresh();
                    }
                } catch (err) {
                    console.error("SSE Error parsing data:", err);
                }
            };

            eventSource.onerror = (err) => {
                console.error("SSE Connection failed:", err);
                eventSource?.close();
            };
        };

        // Wait for API URL to be ready (from Firestore/Localhost discovery)
        waitForApi = setInterval(() => {
            if (api.defaults.baseURL && api.defaults.baseURL !== "") {
                if (waitForApi) clearInterval(waitForApi);
                console.log("🚀 API Ready (Effect):", api.defaults.baseURL);
                fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined);
                setupSSE();
            }
        }, 100);

        // Automatic refresh every 5 minutes if window is focused (fallback)
        const refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible' && api.defaults.baseURL) {
                console.log("🔄 Auto-refreshing connectivity...");
                handleRefresh();
            }
        }, 5 * 60 * 1000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && api.defaults.baseURL) {
                handleRefresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (waitForApi) clearInterval(waitForApi);
            if (eventSource) eventSource.close();
            clearInterval(refreshInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // Removed fetchData and handleRefresh from deps to prevent re-running on every file/disk change
    }, [currentPath, activeView, activeCategory]);

    // Check Server Status
    useEffect(() => {
        let statusInterval: NodeJS.Timeout | null = null;

        const checkStatus = async () => {
            if (!api.defaults.baseURL) return;

            try {
                const baseUrl = api.defaults.baseURL?.replace('/api/cloud', '') || '';
                if (baseUrl) {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000);
                    try {
                        // baseUrl now has no trailing slash, so we add ONE.
                        await fetch(`${baseUrl}/`, { method: 'HEAD', signal: controller.signal });
                        setServerStatus("online");
                    } catch (err: any) {
                        if (err.name !== 'AbortError') {
                            console.error("Server check failed:", err);
                        }
                        setServerStatus("offline");
                    } finally {
                        clearTimeout(timeoutId);
                    }
                } else {
                    await api.get('/', { timeout: 2000 });
                    setServerStatus("online");
                }
            } catch (err) {
                console.error("Server check failed:", err);
                setServerStatus("offline");
            }
        };

        const initStatus = setInterval(() => {
            if (api.defaults.baseURL) {
                clearInterval(initStatus);
                checkStatus();
                statusInterval = setInterval(checkStatus, 15000);
            }
        }, 1000);

        return () => {
            clearInterval(initStatus);
            if (statusInterval) clearInterval(statusInterval);
        };
    }, []);

    return (
        <div className={cn("flex h-screen overflow-hidden", theme === "dark" ? "bg-slate-950" : "bg-slate-50")}>
            {/* Sidebar */}
            <Sidebar
                activeView={activeView}
                activeCategory={activeCategory}
                onViewChange={handleViewChange}
                onCategoryChange={handleCategoryChange}
                onLogout={handleLogout}
                onOpenUploads={() => setIsUploadPanelOpen(!isUploadPanelOpen)}
                theme={theme}
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
                    onThemeToggle={toggleTheme}
                    theme={theme}
                    serverStatus={serverStatus}
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
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                        {activeView === "home" ? (currentPath ? "Arquivos" : "Painel") :
                                            activeView === "explorer" ? "Meus Discos" :
                                                activeView === "category" ? getCategoryDisplayName(activeCategory) :
                                                    getBreadcrumbs().slice(-1)[0].name}
                                    </h2>

                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                                        {activeView === "trash" && files.length > 0 && (
                                            <button
                                                onClick={handleEmptyTrash}
                                                className="px-4 py-1.5 rounded-xl text-sm font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all mr-2 flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Esvaziar Lixeira
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setFilterType("all")}
                                            className={cn("px-4 py-1.5 rounded-xl text-sm font-bold transition-all", filterType === "all" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-400 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setFilterType("folders")}
                                            className={cn("px-4 py-1.5 rounded-xl text-sm font-bold transition-all", filterType === "folders" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-400 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}
                                        >
                                            Pastas
                                        </button>
                                        <button
                                            onClick={() => setFilterType("files")}
                                            className={cn("px-4 py-1.5 rounded-xl text-sm font-bold transition-all", filterType === "files" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-400 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}
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
                                        {/* EXPLORER VIEW - Show Disks directly */}
                                        {activeView === "explorer" && !currentPath && (
                                            <section>
                                                <div className="mb-8">
                                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">Explorador de Arquivos</h2>
                                                    <p className="text-slate-500 dark:text-slate-400">Navegue diretamente pelos seus discos rígidos</p>
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
                                                            temperature={disk.temperature}
                                                            type={disk.type}
                                                            onClick={() => navigateTo(disk.mount)}
                                                        />
                                                    ))}
                                                </motion.div>
                                            </section>
                                        )}

                                        {/* HOME VIEW - Show Categories + Disks */}
                                        {activeView === "home" && !currentPath && (
                                            <div className="space-y-12">
                                                {/* Category Cards */}
                                                {categoryStats && (
                                                    <section>
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div>
                                                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Meu Armazenamento</h2>
                                                                <p className="text-slate-500 dark:text-slate-400">Acesse seus arquivos por categoria</p>
                                                            </div>
                                                        </div>

                                                        {/* Global Storage Summary Bar */}
                                                        {storageStats?.global && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="mb-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group"
                                                            >
                                                                <div className="relative z-10">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                                                <HardDrive size={24} />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cloud Local Ilimitada</h3>
                                                                                <p className="text-xs text-slate-500 dark:text-slate-400">Total acumulado de todos os discos</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="text-2xl font-black text-blue-600">{storageStats.global.percent}%</span>
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacidade em Uso</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${storageStats.global.percent}%` }}
                                                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                                                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 relative"
                                                                        >
                                                                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                                        </motion.div>
                                                                    </div>

                                                                    <div className="mt-4 flex items-center justify-between text-sm">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Usado</span>
                                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{formatBytes(storageStats.global.used)}</span>
                                                                            </div>
                                                                            <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Disponível</span>
                                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{formatBytes(storageStats.global.total - storageStats.global.used)}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col text-right">
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Capacidade Total</span>
                                                                            <span className="font-bold text-blue-600">{formatBytes(storageStats.global.total)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Decorative mesh */}
                                                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                                                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -ml-24 -mb-24" />
                                                            </motion.div>
                                                        )}
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
                                                                    temperature={disk.temperature}
                                                                    type={disk.type}
                                                                    onClick={() => navigateTo(disk.mount)}
                                                                />
                                                            ))}
                                                        </motion.div>
                                                    </section>
                                                )}

                                                {/* Recent files if on home */}
                                                {activeView === "home" && !currentPath && files.length > 0 && (
                                                    <section>
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div>
                                                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Arquivos Rápidos</h2>
                                                                <p className="text-slate-500 dark:text-slate-400">Itens encontrados no diretório pessoal</p>
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
                    nextFile={getNextPreviewFile()}
                    prevFile={getPrevPreviewFile()}
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

            {/* Upload Modal (V3 Upgraded) */}
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

            {/* Uploads History Panel */}
            <AnimatePresence>
                {isUploadPanelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUploadPanelOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-[120] border-l border-slate-100 dark:border-slate-800 flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                                        <History className="text-blue-600 dark:text-blue-400" size={20} />
                                    </div>
                                    <h3 className="font-black text-slate-800 dark:text-white tracking-tight uppercase text-sm">Histórico de Uploads</h3>
                                </div>
                                <button
                                    onClick={() => setIsUploadPanelOpen(false)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {uploadHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full mb-4">
                                            <UploadCloud size={40} className="text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum upload registrado</p>
                                    </div>
                                ) : (
                                    uploadHistory.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                                        >
                                            {item.status === "uploading" && (
                                                <motion.div
                                                    className="absolute bottom-0 left-0 h-1 bg-blue-500"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.progress}%` }}
                                                />
                                            )}

                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-xl shrink-0",
                                                    item.status === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                                                        item.status === "error" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" :
                                                            "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                                )}>
                                                    {item.status === "success" ? <CheckCircle2 size={18} /> :
                                                        item.status === "error" ? <AlertCircle size={18} /> :
                                                            item.status === "uploading" ? <RefreshCw className="animate-spin" size={18} /> :
                                                                <Clock size={18} />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{item.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{formatBytes(item.size)}</span>
                                                        <span className="text-[10px] font-medium text-slate-300">•</span>
                                                        <span className="text-[10px] font-bold text-slate-400 truncate flex items-center gap-1">
                                                            <HardDrive size={10} /> {item.path || 'Raiz'}
                                                        </span>
                                                    </div>

                                                    {item.status === "error" && (
                                                        <p className="text-[10px] text-rose-500 font-bold mt-2 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded-lg border border-rose-100 dark:border-rose-900/50">
                                                            {item.error}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {item.status === "error" && (
                                                        <button
                                                            onClick={() => handleRetryUpload(item)}
                                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                                            title="Tentar novamente"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setUploadHistory(prev => prev.filter(h => h.id !== item.id))}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remover do histórico"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <button
                                    onClick={() => {
                                        if (confirm("Limpar todo o histórico de uploads? (Os arquivos no disco não serão afetados)")) {
                                            setUploadHistory([]);
                                            localStorage.removeItem("upload_history");
                                        }
                                    }}
                                    disabled={uploadHistory.length === 0}
                                    className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                                >
                                    Limpar Histórico
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Global Toast System */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={cn(
                                "pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 min-w-[320px] max-w-md",
                                toast.type === "success" ? "bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900" :
                                    toast.type === "error" ? "bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900" :
                                        toast.type === "warning" ? "bg-white dark:bg-slate-900 border-amber-100 dark:border-amber-900" :
                                            "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl",
                                toast.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                                    toast.type === "error" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" :
                                        toast.type === "warning" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" :
                                            "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                            )}>
                                {toast.type === "success" ? <CheckCircle2 size={18} /> :
                                    toast.type === "error" ? <XCircle size={18} /> :
                                        toast.type === "warning" ? <AlertCircle size={18} /> :
                                            <RefreshCw size={18} className="animate-spin" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                className="text-slate-300 hover:text-slate-500 transition-colors p-1"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

const LoadingSkeleton: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-transparent dark:border-slate-800">
                        <div className="skeleton dark:bg-slate-800 w-14 h-14 rounded-xl mb-4" />
                        <div className="skeleton dark:bg-slate-800 w-32 h-6 mb-2" />
                        <div className="skeleton dark:bg-slate-800 w-24 h-4 mb-1" />
                        <div className="skeleton dark:bg-slate-800 w-28 h-4" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md border border-transparent dark:border-slate-800">
                        <div className="flex items-start gap-3">
                            <div className="skeleton dark:bg-slate-800 w-12 h-12 rounded-lg" />
                            <div className="flex-1">
                                <div className="skeleton dark:bg-slate-800 w-full h-4 mb-2" />
                                <div className="skeleton dark:bg-slate-800 w-24 h-3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
