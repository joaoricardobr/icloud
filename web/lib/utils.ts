import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileText, Image, Video, Music, File, Folder, HardDrive, FileArchive, Code } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date, locale: string = 'pt-BR'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;

    return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

export function truncateText(text: string, maxLength: number = 30): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

export function getFileIcon(fileName: string, isDirectory: boolean = false) {
    if (isDirectory) return Folder;

    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'ico'].includes(ext)) {
        return Image;
    }

    // Videos
    if (['mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv', 'webm', 'm4v', 'mpeg'].includes(ext)) {
        return Video;
    }

    // Music
    if (['mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac', 'wma', 'opus'].includes(ext)) {
        return Music;
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx', 'csv', 'rtf', 'odt'].includes(ext)) {
        return FileText;
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
        return FileArchive;
    }

    // Code
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext)) {
        return Code;
    }

    return File;
}

export function getFileColor(fileName: string, isDirectory: boolean = false): string {
    if (isDirectory) return 'text-blue-500';

    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'ico'].includes(ext)) {
        return 'text-green-500';
    }

    if (['mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv', 'webm', 'm4v', 'mpeg'].includes(ext)) {
        return 'text-purple-500';
    }

    if (['mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac', 'wma', 'opus'].includes(ext)) {
        return 'text-pink-500';
    }

    if (['pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx', 'csv', 'rtf', 'odt'].includes(ext)) {
        return 'text-red-500';
    }

    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
        return 'text-yellow-600';
    }

    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext)) {
        return 'text-indigo-500';
    }

    return 'text-gray-500';
}

export function getCategoryIcon(category: string) {
    switch (category) {
        case 'imagens':
            return Image;
        case 'videos':
            return Video;
        case 'musicas':
            return Music;
        case 'documentos':
            return FileText;
        default:
            return File;
    }
}

export function getCategoryColor(category: string): string {
    switch (category) {
        case 'imagens':
            return 'from-green-400 to-emerald-600';
        case 'videos':
            return 'from-purple-400 to-indigo-600';
        case 'musicas':
            return 'from-pink-400 to-rose-600';
        case 'documentos':
            return 'from-orange-400 to-red-600';
        default:
            return 'from-gray-400 to-gray-600';
    }
}

export function getCategoryName(category: string): string {
    switch (category) {
        case 'imagens':
            return 'Imagens';
        case 'videos':
            return 'Vídeos';
        case 'musicas':
            return 'Músicas';
        case 'documentos':
            return 'Documentos';
        default:
            return category;
    }
}
