import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../config/firebase';
import si from 'systeminformation';
import os from 'os';

const HOME_DIR = os.homedir();
const TRASH_DIR = path.join(HOME_DIR, '.local', 'share', 'Trash', 'files');

// File type categories
const FILE_CATEGORIES = {
    imagens: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'],
    videos: ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm', '.m4v', '.mpeg'],
    musicas: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma', '.opus'],
    documentos: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.csv', '.rtf', '.odt']
};

// Helper to validate and sanitize paths
const validatePath = (targetPath: string): string => {
    if (!targetPath || targetPath === '') return HOME_DIR;

    // Convert to absolute path
    let absolutePath = path.resolve(targetPath);

    // Security check - prevent directory traversal
    if (absolutePath.includes('..')) {
        throw new Error('Invalid path');
    }

    return absolutePath;
};

// Scan directory for files by category (limited depth for performance)
const scanDirectoryForCategory = (dirPath: string, category: keyof typeof FILE_CATEGORIES, maxFiles = 100, depth = 0): any[] => {
    if (depth > 3 || !fs.existsSync(dirPath)) return [];

    const results: any[] = [];
    const extensions = FILE_CATEGORIES[category];

    try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            // Skip hidden and system folders
            if (item.startsWith('.') || item === 'node_modules' || item === 'snap') continue;

            const itemPath = path.join(dirPath, item);

            try {
                const stats = fs.statSync(itemPath);

                if (stats.isDirectory()) {
                    // Recursively scan subdirectories
                    const subResults = scanDirectoryForCategory(itemPath, category, maxFiles - results.length, depth + 1);
                    results.push(...subResults);
                } else {
                    // Check if file matches category
                    const ext = path.extname(item).toLowerCase();
                    if (extensions.includes(ext)) {
                        results.push({
                            name: item,
                            path: itemPath,
                            size: stats.size,
                            isDirectory: false,
                            mtime: stats.mtime,
                            category: category,
                            diskLabel: dirPath.startsWith(HOME_DIR) ? 'Home' : path.basename(dirPath)
                        });
                    }
                }

                // Limit results for performance
                if (results.length >= maxFiles) break;
            } catch (e) {
                // Skip files we can't access
                continue;
            }
        }
    } catch (e) {
        console.error(`[Scan] Error reading ${dirPath}:`, e);
    }

    return results;
};

// Get category statistics across all disks
const getCategoryStats = async (disks: any[]) => {
    const stats: any = {
        imagens: { count: 0, size: 0, files: [] },
        videos: { count: 0, size: 0, files: [] },
        musicas: { count: 0, size: 0, files: [] },
        documentos: { count: 0, size: 0, files: [] }
    };

    // Common folders to scan on each disk
    const commonFolders = [
        'Imagens', 'Pictures', 'Fotos',
        'Vídeos', 'Videos', 'Filmes',
        'Música', 'Music', 'Músicas',
        'Documentos', 'Documents', 'Docs',
        'Downloads', 'Transferências', 'Download'
    ];

    for (const disk of disks) {
        // Scan home directory if it's the system disk
        if (disk.mount === '/') {
            for (const folder of commonFolders) {
                const folderPath = path.join(HOME_DIR, folder);
                if (fs.existsSync(folderPath)) {
                    // Scan for each category
                    for (const category of Object.keys(FILE_CATEGORIES) as (keyof typeof FILE_CATEGORIES)[]) {
                        const files = scanDirectoryForCategory(folderPath, category, 20);
                        stats[category].files.push(...files);
                        stats[category].count += files.length;
                        stats[category].size += files.reduce((sum, f) => sum + f.size, 0);
                    }
                }
            }
        } else {
            // Scan external disk root and common folders
            for (const folder of ['', ...commonFolders]) {
                const folderPath = folder ? path.join(disk.mount, folder) : disk.mount;
                if (fs.existsSync(folderPath)) {
                    for (const category of Object.keys(FILE_CATEGORIES) as (keyof typeof FILE_CATEGORIES)[]) {
                        const files = scanDirectoryForCategory(folderPath, category, 20);
                        stats[category].files.push(...files);
                        stats[category].count += files.length;
                        stats[category].size += files.reduce((sum, f) => sum + f.size, 0);
                    }
                }
            }
        }
    }

    return stats;
};

// Get real disk information and files
export const getFiles = async (req: Request, res: Response) => {
    try {
        const queryPath = (req.query.path as string) || '';
        const mode = req.query.mode as string;
        const category = req.query.category as string;

        console.log(`[getFiles] Path: "${queryPath}", Mode: "${mode}", Category: "${category}"`);

        // Get favorites once for efficient tagging
        const favoritePaths = new Set<string>();
        try {
            const favs = await db.collection('favorites').get();
            favs.docs.forEach(doc => {
                const p = doc.data().path;
                if (p) favoritePaths.add(p);
            });
        } catch (e) {
            console.error('[getFiles] Error fetching favorites:', e);
        }

        // Get real disk information
        const allDisks = await si.fsSize();
        const relevantDisks = allDisks
            .filter(d => {
                // Only real physical disks
                const isPhysical = d.fs.startsWith('/dev/sd') || d.fs.startsWith('/dev/nvme');
                const hasMount = d.mount && d.mount !== '';
                const notSnap = !d.mount.includes('/snap');
                return isPhysical && hasMount && notSnap;
            })
            .map(d => ({
                name: d.mount === '/' ? 'Disco Local (Sistema)' : path.basename(d.mount) || d.fs,
                mount: d.mount,
                size: d.size,
                used: d.used,
                percent: Math.round((d.used / d.size) * 100),
                type: d.mount === '/' ? 'system' : 'external'
            }));

        let metadata: any[] = [];
        let categoryStats: any = null;

        // MODE: Category view (show files of specific type across all disks)
        if (category && FILE_CATEGORIES[category as keyof typeof FILE_CATEGORIES]) {
            console.log(`[Category] Scanning for ${category}...`);
            const allStats = await getCategoryStats(relevantDisks);
            metadata = allStats[category].files || [];
            categoryStats = allStats;
        }
        // MODE: Recent files
        else if (mode === 'recent') {
            const scanDirs = [
                HOME_DIR,
                path.join(HOME_DIR, 'Transferências'),
                path.join(HOME_DIR, 'Documentos'),
                path.join(HOME_DIR, 'Downloads')
            ];

            for (const dir of scanDirs) {
                if (fs.existsSync(dir)) {
                    try {
                        const items = fs.readdirSync(dir);
                        for (const item of items) {
                            if (item.startsWith('.')) continue;
                            const itemPath = path.join(dir, item);
                            try {
                                const stats = fs.statSync(itemPath);
                                if (!stats.isDirectory()) {
                                    metadata.push({
                                        name: item,
                                        path: itemPath,
                                        size: stats.size,
                                        isDirectory: false,
                                        mtime: stats.mtime,
                                        isFavorite: favoritePaths.has(itemPath),
                                        diskLabel: 'Recente'
                                    });
                                }
                            } catch (e) { }
                        }
                    } catch (e) { }
                }
            }
            metadata = metadata.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()).slice(0, 50);
        }
        // MODE: Favorites
        else if (mode === 'favorites') {
            try {
                const favs = await db.collection('favorites').get();
                for (const doc of favs.docs) {
                    const filePath = doc.data().path;
                    if (fs.existsSync(filePath)) {
                        const stats = fs.statSync(filePath);
                        metadata.push({
                            name: path.basename(filePath),
                            path: filePath,
                            size: stats.size,
                            isDirectory: stats.isDirectory(),
                            mtime: stats.mtime,
                            isFavorite: true,
                            diskLabel: 'Favorito'
                        });
                    }
                }
            } catch (e) {
                console.error('[Favorites] Error:', e);
            }
        }
        // MODE: Trash
        else if (mode === 'trash') {
            if (fs.existsSync(TRASH_DIR)) {
                try {
                    const items = fs.readdirSync(TRASH_DIR);
                    metadata = items.map(item => {
                        const itemPath = path.join(TRASH_DIR, item);
                        try {
                            const stats = fs.statSync(itemPath);
                            return {
                                name: item,
                                path: itemPath,
                                size: stats.size,
                                isDirectory: stats.isDirectory(),
                                mtime: stats.mtime,
                                isFavorite: favoritePaths.has(itemPath),
                                diskLabel: 'Lixeira'
                            };
                        } catch (e) {
                            return null;
                        }
                    }).filter(i => i !== null);
                } catch (e) {
                    console.error('[Trash] Error:', e);
                }
            }
        }
        // HOME VIEW: Show real disks + Uploads Online folder
        else if (queryPath === '' || queryPath === '/') {
            // Get category statistics for dashboard
            categoryStats = await getCategoryStats(relevantDisks);

            // Add real disks
            metadata = relevantDisks.map(disk => ({
                name: disk.name,
                path: disk.mount,
                size: disk.size,
                isDirectory: true,
                mtime: new Date(),
                isFavorite: favoritePaths.has(disk.mount),
                diskLabel: 'Disco',
                diskType: disk.type
            }));

            // Add Uploads Online folder
            const uploadsOnline = path.join(HOME_DIR, 'Transferências', 'Uploads Online');
            if (!fs.existsSync(uploadsOnline)) {
                fs.mkdirSync(uploadsOnline, { recursive: true });
            }

            const uploadsStats = fs.statSync(uploadsOnline);
            metadata.unshift({
                name: 'Uploads Online 🏠',
                path: uploadsOnline,
                size: uploadsStats.size,
                isDirectory: true,
                mtime: uploadsStats.mtime,
                isFavorite: favoritePaths.has(uploadsOnline),
                diskLabel: 'Home'
            });
        }
        // REAL DIRECTORY LISTING
        else {
            const targetDir = validatePath(queryPath);

            if (!fs.existsSync(targetDir)) {
                return res.status(404).json({ error: 'Directory not found' });
            }

            const stats = fs.statSync(targetDir);
            if (!stats.isDirectory()) {
                return res.status(400).json({ error: 'Path is not a directory' });
            }

            // Read real directory contents
            let items: string[] = [];
            try {
                items = fs.readdirSync(targetDir);
            } catch (e) {
                console.error(`[Readdir] Error reading ${targetDir}:`, e);
                return res.json({
                    files: [],
                    stats: {
                        total: 0,
                        used: 0,
                        percent: 0,
                        path: queryPath,
                        allDisks: relevantDisks
                    }
                });
            }

            // Convert to metadata
            for (const item of items) {
                // Skip hidden files unless explicitly requested
                if (item.startsWith('.')) continue;

                const itemPath = path.join(targetDir, item);
                try {
                    const itemStats = fs.statSync(itemPath);
                    metadata.push({
                        name: item,
                        path: itemPath,
                        size: itemStats.size,
                        isDirectory: itemStats.isDirectory(),
                        mtime: itemStats.mtime,
                        isFavorite: favoritePaths.has(itemPath),
                        diskLabel: path.basename(targetDir)
                    });
                } catch (e) {
                    console.error(`[Stat] Error on ${itemPath}:`, e);
                }
            }
        }

        // Calculate storage stats for current path
        let storageStats = {
            total: 0,
            used: 0,
            percent: 0,
            path: queryPath,
            allDisks: relevantDisks,
            categories: categoryStats
        };

        // Find which disk this path belongs to
        if (queryPath) {
            const disk = relevantDisks.find(d => queryPath.startsWith(d.mount));
            if (disk) {
                storageStats.total = disk.size;
                storageStats.used = disk.used;
                storageStats.percent = disk.percent;
            }
        }

        res.json({
            files: metadata,
            stats: storageStats
        });

    } catch (error: any) {
        console.error('[getFiles] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Download file
export const downloadFile = async (req: Request, res: Response) => {
    try {
        const filePath = req.query.path as string;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }

        const absolutePath = validatePath(filePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(absolutePath);
    } catch (error: any) {
        console.error('[downloadFile] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Upload file (handled by multer in routes)
export const uploadFile = async (req: Request, res: Response) => {
    try {
        res.json({ message: 'Files uploaded successfully', files: req.files });
    } catch (error: any) {
        console.error('[uploadFile] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete file or folder
export const deleteFile = async (req: Request, res: Response) => {
    try {
        const filePath = req.body.path as string;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }

        const absolutePath = validatePath(filePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Move to trash instead of permanent delete
        if (!fs.existsSync(TRASH_DIR)) {
            fs.mkdirSync(TRASH_DIR, { recursive: true });
        }

        const fileName = path.basename(absolutePath);
        const trashPath = path.join(TRASH_DIR, fileName);

        fs.renameSync(absolutePath, trashPath);

        res.json({ message: 'File moved to trash successfully' });
    } catch (error: any) {
        console.error('[deleteFile] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Create folder
export const createFolder = async (req: Request, res: Response) => {
    try {
        const { path: folderPath, name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const parentPath = validatePath(folderPath || HOME_DIR);
        const newFolderPath = path.join(parentPath, name);

        if (fs.existsSync(newFolderPath)) {
            return res.status(400).json({ error: 'Folder already exists' });
        }

        fs.mkdirSync(newFolderPath, { recursive: true });

        res.json({ message: 'Folder created successfully', path: newFolderPath });
    } catch (error: any) {
        console.error('[createFolder] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get thumbnail
export const getThumbnail = async (req: Request, res: Response) => {
    try {
        const filePath = req.query.path as string;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }

        res.json({ hasThumbnail: false });
    } catch (error: any) {
        console.error('[getThumbnail] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Permanently delete file or folder (bypass trash)
export const permanentDelete = async (req: Request, res: Response) => {
    try {
        const filePath = req.body.path as string;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }

        const absolutePath = validatePath(filePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const stats = fs.statSync(absolutePath);
        if (stats.isDirectory()) {
            fs.rmSync(absolutePath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(absolutePath);
        }

        res.json({ message: 'Item permanently deleted' });
    } catch (error: any) {
        console.error('[permanentDelete] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get backend logs
export const getLogs = async (req: Request, res: Response) => {
    try {
        const logFilePath = path.join(__dirname, '..', '..', 'logs', 'backend.log');
        if (fs.existsSync(logFilePath)) {
            const logs = fs.readFileSync(logFilePath, 'utf-8');
            res.json({ logs });
        } else {
            res.json({ logs: 'Log file not found.' });
        }
    } catch (error: any) {
        console.error('[getLogs] Error:', error);
        res.status(500).json({ error: error.message, logs: '' });
    }
};

// Empty Trash folder
export const emptyTrash = async (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(TRASH_DIR)) {
            return res.json({ message: 'Trash is already empty' });
        }

        const items = fs.readdirSync(TRASH_DIR);
        for (const item of items) {
            const itemPath = path.join(TRASH_DIR, item);
            try {
                const stats = fs.statSync(itemPath);
                if (stats.isDirectory()) {
                    fs.rmSync(itemPath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(itemPath);
                }
            } catch (e) {
                console.error(`[emptyTrash] Error deleting ${itemPath}:`, e);
            }
        }

        res.json({ message: 'Trash emptied successfully' });
    } catch (error: any) {
        console.error('[emptyTrash] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
