"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import api from "@/lib/api";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import DiskCard from "./DiskCard";
import CategoryCard from "./CategoryCard";
import FileGrid from "./FileGrid";
import FilePreview from "./FilePreview";
import { pageTransition, staggerContainer } from "@/lib/animations";

interface FileItem {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    modifiedAt: string;
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
    const [activeView, setActiveView] = useState<"home" | "recent" | "favorites" | "trash" | "category">("home");
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number>(-1);

    // Fetch data from backend
    const fetchData = async (path: string = "", mode?: string, category?: string) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (mode) params.append('mode', mode);
            if (path) params.append('path', path);
            if (category) params.append('category', category);

            console.log('[Dashboard] Fetching:', `/files?${params.toString()}`);
            console.log('[Dashboard] API Base URL:', api.defaults.baseURL);

            const response = await api.get(`/files?${params.toString()}`);
            console.log('[Dashboard] Response status:', response.status);
            console.log('[Dashboard] Response data:', response.data);

            const filesData = response.data.files || [];
            const disksData = response.data.stats?.allDisks || [];
            const categoriesData = response.data.stats?.categories || null;

            console.log('[Dashboard] Parsed - Files:', filesData.length, 'Disks:', disksData.length);
            console.log('[Dashboard] Category stats:', categoriesData);

            setFiles(filesData);
            setDisks(disksData);
            setCategoryStats(categoriesData);

            if (!mode && !category) {
                setCurrentPath(path);
            }
        } catch (err: any) {
            console.error("[Dashboard] Error fetching files:", err);
            console.error("[Dashboard] Error details:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });

            const errorMsg = err.response?.data?.error || err.message || "Erro ao carregar dados";
            setError(errorMsg);

            // Set empty data on error
            setFiles([]);
            setDisks([]);
            setCategoryStats(null);
        } finally {
            setLoading(false);
        }
    };

    // Navigate to a path
    const navigateTo = (path: string) => {
        setActiveView("home");
        setActiveCategory("");
        fetchData(path);
    };

    // Change view
    const handleViewChange = (view: "home" | "recent" | "favorites" | "trash") => {
        setActiveView(view);
        setActiveCategory("");
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
        fetchData("", undefined, category);
    };

    // Handle file click
    const handleFileClick = (file: FileItem) => {
        if (file.isDirectory) {
            navigateTo(file.path);
        } else {
            // Open file preview
            const fileIndex = files.findIndex(f => f.path === file.path);
            setPreviewFile(file);
            setPreviewIndex(fileIndex);
        }
    };

    // Navigate to next file in preview
    const handleNextFile = () => {
        const nextIndex = previewIndex + 1;
        if (nextIndex < files.length) {
            const nextFile = files[nextIndex];
            if (!nextFile.isDirectory) {
                setPreviewFile(nextFile);
                setPreviewIndex(nextIndex);
            } else {
                // Skip directories
                let i = nextIndex + 1;
                while (i < files.length && files[i].isDirectory) i++;
                if (i < files.length) {
                    setPreviewFile(files[i]);
                    setPreviewIndex(i);
                }
            }
        }
    };

    // Navigate to previous file in preview
    const handlePreviousFile = () => {
        const prevIndex = previewIndex - 1;
        if (prevIndex >= 0) {
            const prevFile = files[prevIndex];
            if (!prevFile.isDirectory) {
                setPreviewFile(prevFile);
                setPreviewIndex(prevIndex);
            } else {
                // Skip directories
                let i = prevIndex - 1;
                while (i >= 0 && files[i].isDirectory) i--;
                if (i >= 0) {
                    setPreviewFile(files[i]);
                    setPreviewIndex(i);
                }
            }
        }
    };

    // Check if there are next/previous files
    const hasNextFile = () => {
        for (let i = previewIndex + 1; i < files.length; i++) {
            if (!files[i].isDirectory) return true;
        }
        return false;
    };

    const hasPreviousFile = () => {
        for (let i = previewIndex - 1; i >= 0; i--) {
            if (!files[i].isDirectory) return true;
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

        if (!currentPath) return [{ name: "Início", path: "" }];

        const parts = currentPath.split('/').filter(Boolean);
        const breadcrumbs = [{ name: "Início", path: "" }];

        let accumulatedPath = "";
        parts.forEach(part => {
            accumulatedPath += `/${part}`;
            breadcrumbs.push({ name: part, path: accumulatedPath });
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
        await signOut(auth);
        window.location.href = "/";
    };

    // Initial load
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Sidebar */}
            <Sidebar
                activeView={activeView}
                activeCategory={activeCategory}
                onViewChange={handleViewChange}
                onCategoryChange={handleCategoryChange}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* TopBar */}
                <TopBar
                    breadcrumbs={getBreadcrumbs()}
                    onNavigate={navigateTo}
                    onUpload={() => console.log("Upload")}
                    onNewFolder={() => console.log("New Folder")}
                    onSearch={(query) => console.log("Search:", query)}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-red-900">Erro ao carregar dados</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <button
                                    onClick={() => fetchData(currentPath, activeView !== "home" ? activeView : undefined, activeCategory || undefined)}
                                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 underline"
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <LoadingSkeleton key="loading" />
                        ) : (
                            <motion.div
                                key={activeView + activeCategory + currentPath}
                                variants={pageTransition}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* HOME VIEW - Show Categories + Disks */}
                                {activeView === "home" && !currentPath && (
                                    <div className="space-y-8">
                                        {/* Category Cards */}
                                        {categoryStats && (
                                            <section>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                                    Meus Arquivos
                                                </h2>
                                                <motion.div
                                                    variants={staggerContainer}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                                    Meus Discos
                                                </h2>
                                                <motion.div
                                                    variants={staggerContainer}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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

                                        {/* Quick Access Folders */}
                                        {files.length > 0 && (
                                            <section>
                                                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                                    Acesso Rápido
                                                </h2>
                                                <FileGrid
                                                    files={files}
                                                    onFileClick={handleFileClick}
                                                />
                                            </section>
                                        )}
                                    </div>
                                )}

                                {/* CATEGORY VIEW */}
                                {activeView === "category" && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {getCategoryDisplayName(activeCategory)}
                                        </h2>
                                        <FileGrid
                                            files={files}
                                            onFileClick={handleFileClick}
                                        />
                                    </div>
                                )}

                                {/* FOLDER VIEW */}
                                {activeView === "home" && currentPath && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            Conteúdo
                                        </h2>
                                        <FileGrid
                                            files={files}
                                            onFileClick={handleFileClick}
                                        />
                                    </div>
                                )}

                                {/* RECENT VIEW */}
                                {activeView === "recent" && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            Arquivos Recentes
                                        </h2>
                                        <FileGrid
                                            files={files}
                                            onFileClick={handleFileClick}
                                        />
                                    </div>
                                )}

                                {/* FAVORITES VIEW */}
                                {activeView === "favorites" && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            Favoritos
                                        </h2>
                                        <FileGrid
                                            files={files}
                                            onFileClick={handleFileClick}
                                        />
                                    </div>
                                )}

                                {/* TRASH VIEW */}
                                {activeView === "trash" && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            Lixeira
                                        </h2>
                                        <FileGrid
                                            files={files}
                                            onFileClick={handleFileClick}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

// Loading Skeleton Component
function LoadingSkeleton() {
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
            </div>
        </div>

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
    </div>
);
}
