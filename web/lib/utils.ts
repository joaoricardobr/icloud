import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    FileText as FileTextIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    Music as MusicIcon,
    File as FileIcon,
    Folder,
    HardDrive,
    FileArchive,
    Code
} from "lucide-react";

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
        return ImageIcon;
    }

    // Videos
    if (['mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv', 'webm', 'm4v', 'mpeg'].includes(ext)) {
        return VideoIcon;
    }

    // Music
    if (['mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac', 'wma', 'opus'].includes(ext)) {
        return MusicIcon;
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx', 'csv', 'rtf', 'odt'].includes(ext)) {
        return FileTextIcon;
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
        return FileArchive;
    }

    // Code
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext)) {
        return Code;
    }

    return FileIcon;
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
    const normalized = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    switch (normalized) {
        case 'imagens':
        case 'image':
        case 'images':
            return ImageIcon;
        case 'videos':
        case 'video':
            return VideoIcon;
        case 'musicas':
        case 'music':
        case 'audio':
            return MusicIcon;
        case 'documentos':
        case 'documents':
        case 'docs':
            return FileTextIcon;
        default:
            return FileIcon;
    }
}

export function getCategoryColor(category: string): string {
    const normalized = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    switch (normalized) {
        case 'imagens':
            return 'from-emerald-500 to-teal-600';
        case 'videos':
            return 'from-indigo-500 to-blue-600';
        case 'musicas':
            return 'from-rose-500 to-pink-600';
        case 'documentos':
            return 'from-amber-500 to-orange-600';
        default:
            return 'from-slate-500 to-slate-600';
    }
}

export function getCategoryAccent(category: string): string {
    const normalized = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    switch (normalized) {
        case 'imagens':
            return 'bg-emerald-100 text-emerald-600';
        case 'videos':
            return 'bg-indigo-100 text-indigo-600';
        case 'musicas':
            return 'bg-rose-100 text-rose-600';
        case 'documentos':
            return 'bg-amber-100 text-amber-600';
        default:
            return 'bg-slate-100 text-slate-600';
    }
}

export function getCategoryGlow(category: string): string {
    const normalized = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    switch (normalized) {
        case 'imagens':
            return 'from-emerald-500';
        case 'videos':
            return 'from-indigo-500';
        case 'musicas':
            return 'from-rose-500';
        case 'documentos':
            return 'from-amber-500';
        default:
            return 'from-slate-500';
    }
}

export function getCategoryName(category: string): string {
    const normalized = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    switch (normalized) {
        case 'imagens':
            return 'Imagens';
        case 'videos':
            return 'Vídeos';
        case 'musicas':
            return 'Músicas';
        case 'documentos':
            return 'Documentos';
        default:
            return category.charAt(0).toUpperCase() + category.slice(1);
    }
}
