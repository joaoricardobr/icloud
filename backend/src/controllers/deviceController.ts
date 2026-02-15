import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../config/firebase';
import si from 'systeminformation';
import os from 'os';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import crypto from 'crypto';
import archiver from 'archiver';

const HOME_DIR = os.homedir();
const TRASH_DIR = path.join(HOME_DIR, '.local', 'share', 'Trash', 'files');

// File type categories - Normalized keys
const FILE_CATEGORIES = {
    imagens: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'],
    videos: ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm', '.m4v', '.mpeg'],
    musicas: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma', '.opus'],
    documentos: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.csv', '.rtf', '.odt']
};

// STRICT IGNORE LIST - Vital for preventing Permission Denied errors and hanging
const IGNORED_DIRS = [
    'node_modules', 'snap', 'System Volume Information', '$RECYCLE.BIN', 'Config.Msi',
    'Windows', 'Program Files', 'Program Files (x86)', 'AppData', 'Application Data',
    'boot', 'dev', 'etc', 'lib', 'lib64', 'lost+found', 'mnt', 'opt', 'proc', 'root',
    'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var', 'bin', '.cache', '.npm', '.dbus', '.local'
];

// Helper to validate and sanitize paths - Security Hardening
const validatePath = (targetPath: string): string => {
    if (!targetPath || targetPath === '') return HOME_DIR;

    // Convert to absolute path
    let absolutePath = path.resolve(targetPath);

    // Security check - prevent directory traversal
    if (absolutePath.includes('..')) {
        console.warn(`[Security] Blocked path traversal attempt: ${targetPath}`);
        throw new Error('Invalid path');
    }

    return absolutePath;
};

// Helper to check access asynchronously
const checkAccess = async (dirPath: string): Promise<boolean> => {
    try {
        await fs.promises.access(dirPath, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
};

// Scan directory for files by category (Async Recursion with strict limits)
const scanDirectoryForCategory = async (dirPath: string, category: keyof typeof FILE_CATEGORIES, maxFiles = 500, depth = 0): Promise<any[]> => {
    // Increased maxFiles and depth slightly for better results
    if (depth > 5 || maxFiles <= 0) return [];

    // STRICT IGNORE LIST - Vital for preventing Permission Denied errors and hanging
    if (IGNORED_DIRS.some(ignored => dirPath.includes(path.sep + ignored) || dirPath.endsWith(path.sep + ignored))) {
        return [];
    }

    const results: any[] = [];
    const extensions = FILE_CATEGORIES[category];

    try {
        if (!(await checkAccess(dirPath))) return [];

        const items = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            // Skip hidden and system folders
            if (item.name.startsWith('.')) continue;
            if (IGNORED_DIRS.includes(item.name)) continue;

            const itemPath = path.join(dirPath, item.name);

            try {
                if (item.isSymbolicLink()) continue;

                if (item.isDirectory()) {
                    // Recursively scan subdirectories
                    // We await here to respect the limit, but this could be parallelized if needed
                    // For now, sequential is safer to avoid overwhelming the IO
                    const subResults = await scanDirectoryForCategory(itemPath, category, maxFiles - results.length, depth + 1);
                    results.push(...subResults);
                } else if (item.isFile()) {
                    // Check if file matches category
                    const ext = path.extname(item.name).toLowerCase();
                    if (extensions.includes(ext)) {
                        // Get stats asynchronously only for matching files
                        const stats = await fs.promises.stat(itemPath);
                        results.push({
                            name: item.name,
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
        // console.error(`[Scan] Error reading ${dirPath}:`, e);
    }

    return results;
};

// Get category statistics across all disks (Async)
const getCategoryStats = async (disks: any[]) => {
    const stats: any = {
        imagens: { count: 0, size: 0, files: [] },
        videos: { count: 0, size: 0, files: [] },
        musicas: { count: 0, size: 0, files: [] },
        documentos: { count: 0, size: 0, files: [] }
    };

    // Common folders to scan on each disk (Expanded)
    const commonFolders = [
        'Imagens', 'Pictures', 'Fotos', 'Images',
        'Vídeos', 'Videos', 'Filmes', 'Movies',
        'Música', 'Music', 'Músicas', 'Songs',
        'Documentos', 'Documents', 'Docs', 'Papers',
        'Downloads', 'Transferências', 'Download',
        'Desktop', 'Área de Trabalho'
    ];

    for (const disk of disks) {
        const isSystem = disk.mount === '/';

        for (const folder of commonFolders) {
            const folderPath = isSystem ? path.join(HOME_DIR, folder) : path.join(disk.mount, folder);

            try {
                if (fs.existsSync(folderPath)) { // Sync check is fine for existence of known paths
                    // Use Promise.all to scan categories in parallel for this folder
                    await Promise.all(
                        (Object.keys(FILE_CATEGORIES) as (keyof typeof FILE_CATEGORIES)[]).map(async (category) => {
                            const files = await scanDirectoryForCategory(folderPath, category, 100);
                            if (files.length > 0) {
                                stats[category].files.push(...files);
                                stats[category].count += files.length;
                                stats[category].size += files.reduce((sum: number, f: any) => sum + f.size, 0);
                            }
                        })
                    );
                }
            } catch (e) {
                // Skip specific folder error
            }
        }
    }

    return stats;
};

export const getSystemStats = async (req: Request, res: Response) => {
    try {
        const [cpu, mem, osInfo, currentLoad] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.osInfo(),
            si.currentLoad()
        ]);

        res.json({
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                speed: cpu.speed,
                cores: cpu.cores,
                load: Math.round(currentLoad.currentLoad)
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.used,
                active: mem.active,
                available: mem.available
            },
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                hostname: osInfo.hostname
            }
        });
    } catch (error: any) {
        console.error('[SystemStats] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get real disk information and files
export const getFiles = async (req: Request, res: Response) => {
    try {
        const queryPath = (req.query.path as string) || '';
        const mode = req.query.mode as string;
        // Normalize category to lowercase to prevent mismatches
        const categoryRaw = req.query.category as string;
        const category = categoryRaw ? categoryRaw.toLowerCase() : undefined;

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
        // Improve disk detection to include /dev/mapper and others
        const allDisks = await si.fsSize();
        let relevantDisks: any[] = [];

        try {
            const temps = await si.cpuTemperature();
            // Try getting disk layout for temperatures
            const diskLayout = await si.diskLayout();

            relevantDisks = allDisks
                .filter(d => {
                    // Broader filter for physical/logical volumes
                    const isPhysical = d.fs.startsWith('/dev/');
                    const hasMount = d.mount && d.mount !== '';
                    const notSnap = !d.mount.includes('/snap') && !d.mount.includes('/boot') && !d.mount.startsWith('/run');
                    return isPhysical && hasMount && notSnap;
                })
                .map(d => {
                    // Try to match temperature
                    const layout = diskLayout.find(l => d.fs.includes(l.device) || (l.device && d.fs.includes(l.device.split('/').pop() || '')));
                    return {
                        name: d.mount === '/' ? 'Disco Local (Sistema)' : path.basename(d.mount) || d.fs,
                        mount: d.mount,
                        size: d.size,
                        used: d.used,
                        percent: Math.round((d.used / d.size) * 100),
                        type: d.mount === '/' ? 'system' : 'external',
                        temperature: layout?.temperature || temps.main || null
                    };
                });
        } catch (e) {
            console.error('[DiskDetection] Error:', e);
            // Fallback
            relevantDisks = allDisks.filter(d => d.mount && !d.mount.includes('/snap') && d.fs.startsWith('/dev/'))
                .map(d => ({
                    name: d.mount === '/' ? 'Disco Local (Sistema)' : path.basename(d.mount),
                    mount: d.mount,
                    size: d.size,
                    used: d.used,
                    percent: Math.round((d.used / d.size) * 100),
                    type: d.mount === '/' ? 'system' : 'external',
                    temperature: null
                }));
        }

        let metadata: any[] = [];
        let categoryStats: any = null;

        // MODE: Category view (show files of specific type across all disks)
        // Strict check against valid keys
        if (category && Object.keys(FILE_CATEGORIES).includes(category)) {
            console.log(`[Category] Scanning for ${category}...`);
            const allStats = await getCategoryStats(relevantDisks);
            metadata = allStats[category].files || [];
            categoryStats = allStats;

            // IMPORTANT: If we found files, we return them.
            // Even if empty, we return empty list, NOT the home view.
        }
        // MODE: Recent files
        else if (mode === 'recent') {
            const scanDirs = [
                HOME_DIR,
                path.join(HOME_DIR, 'Transferências'),
                path.join(HOME_DIR, 'Documentos'),
                path.join(HOME_DIR, 'Downloads'),
                path.join(HOME_DIR, 'Imagens'),
                path.join(HOME_DIR, 'Vídeos')
            ];

            for (const dir of scanDirs) {
                try {
                    const dirStats = await checkAccess(dir);
                    if (dirStats) {
                        const items = await fs.promises.readdir(dir, { withFileTypes: true });
                        let count = 0;
                        for (const item of items) {
                            if (count > 100) break;
                            if (item.name.startsWith('.')) continue;

                            const itemPath = path.join(dir, item.name);
                            if (item.isFile()) {
                                try {
                                    const stats = await fs.promises.stat(itemPath);
                                    metadata.push({
                                        name: item.name,
                                        path: itemPath,
                                        size: stats.size,
                                        isDirectory: false,
                                        mtime: stats.mtime,
                                        isFavorite: favoritePaths.has(itemPath),
                                        diskLabel: 'Recente'
                                    });
                                    count++;
                                } catch (e) { }
                            }
                        }
                    }
                } catch (e) { }
            }
            metadata = metadata.sort((a: any, b: any) => b.mtime.getTime() - a.mtime.getTime()).slice(0, 50);
        }
        // MODE: Favorites
        else if (mode === 'favorites') {
            try {
                const favs = await db.collection('favorites').get();
                await Promise.all(favs.docs.map(async (doc) => {
                    const filePath = doc.data().path;
                    try {
                        if (await checkAccess(filePath)) {
                            const stats = await fs.promises.stat(filePath);
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
                    } catch (e) { }
                }));
            } catch (e) {
                console.error('[Favorites] Error:', e);
            }
        }
        // MODE: Trash
        else if (mode === 'trash') {
            if (await checkAccess(TRASH_DIR)) {
                try {
                    const items = await fs.promises.readdir(TRASH_DIR);
                    const promised = await Promise.all(items.map(async (item) => {
                        const itemPath = path.join(TRASH_DIR, item);
                        try {
                            const stats = await fs.promises.stat(itemPath);
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
                    }));
                    metadata = promised.filter(i => i !== null);
                } catch (e) {
                    console.error('[Trash] Error:', e);
                }
            }
        }
        // HOME VIEW: Show real disks + Uploads Online folder (only on empty path AND no category)
        else if (queryPath === '') {
            // Get category statistics for dashboard
            categoryStats = await getCategoryStats(relevantDisks);

            // 1. Add Disks
            metadata = relevantDisks.map((disk: any) => ({
                name: disk.name,
                path: disk.mount,
                size: disk.size,
                isDirectory: true,
                mtime: new Date(),
                isFavorite: favoritePaths.has(disk.mount),
                diskLabel: 'Disco',
                diskType: disk.type
            }));

            // 2. Add Standard System Folders
            // Force correct mapping even if folder name differs
            const standardFolders = [
                { name: 'Imagens 🏙️', possiblePaths: ['Imagens', 'Pictures', 'Images'] },
                { name: 'Vídeos 🎬', possiblePaths: ['Vídeos', 'Videos', 'Movies'] },
                { name: 'Músicas 🎵', possiblePaths: ['Músicas', 'Music', 'Songs'] },
                { name: 'Documentos 📄', possiblePaths: ['Documentos', 'Documents'] },
                { name: 'Transferências 📥', possiblePaths: ['Transferências', 'Downloads'] }
            ];

            for (const f of standardFolders) {
                // Find first existing path
                for (const p of f.possiblePaths) {
                    const fullPath = path.join(HOME_DIR, p);
                    try {
                        const stats = await fs.promises.stat(fullPath);
                        metadata.unshift({
                            name: f.name,
                            path: fullPath,
                            size: stats.size,
                            isDirectory: true,
                            mtime: stats.mtime,
                            isFavorite: favoritePaths.has(fullPath),
                            diskLabel: 'Home'
                        });
                        break; // Found one
                    } catch (e) { continue; }
                }
            }

            // 3. Add Uploads Online folder
            const uploadsOnline = path.join(HOME_DIR, 'Transferências', 'Uploads Online');
            try {
                // Try create only if parent exists, else skip to avoid errors
                await fs.promises.mkdir(uploadsOnline, { recursive: true }).catch(() => { });
            } catch (e) { }

            try {
                const uploadsStats = await fs.promises.stat(uploadsOnline);
                metadata.unshift({
                    name: 'Uploads Online 🏠',
                    path: uploadsOnline,
                    size: uploadsStats.size,
                    isDirectory: true,
                    mtime: uploadsStats.mtime,
                    isFavorite: favoritePaths.has(uploadsOnline),
                    diskLabel: 'Home'
                });
            } catch (e) { }
        }
        // REAL DIRECTORY LISTING
        else {
            const targetDir = validatePath(queryPath);

            try {
                await fs.promises.access(targetDir, fs.constants.F_OK);
            } catch (e) {
                return res.status(404).json({ error: 'Directory not found' });
            }

            const stats = await fs.promises.stat(targetDir);
            if (!stats.isDirectory()) {
                return res.status(400).json({ error: 'Path is not a directory' });
            }

            // Read real directory contents
            let items: any[] = [];
            try {
                items = await fs.promises.readdir(targetDir, { withFileTypes: true });
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
            const promisedItems = await Promise.all(items.map(async (item) => {
                // Skip hidden files unless explicitly requested
                if (item.name.startsWith('.')) return null;
                if (IGNORED_DIRS.includes(item.name)) return null;

                const itemPath = path.join(targetDir, item.name);
                try {
                    // With File Types, check if symbolic link
                    if (item.isSymbolicLink()) return null;

                    const itemStats = await fs.promises.stat(itemPath);
                    return {
                        name: item.name,
                        path: itemPath,
                        size: itemStats.size,
                        isDirectory: itemStats.isDirectory(),
                        mtime: itemStats.mtime,
                        isFavorite: favoritePaths.has(itemPath),
                        diskLabel: path.basename(targetDir)
                    };
                } catch (e) {
                    console.error(`[Stat] Error on ${itemPath}:`, e);
                    return null;
                }
            }));

            metadata = promisedItems.filter(Boolean);
        }

        // Calculate storage stats for current path
        let storageStats: any = {
            total: 0,
            used: 0,
            percent: 0,
            path: queryPath,
            allDisks: relevantDisks,
            categories: categoryStats,
            global: {
                total: relevantDisks.reduce((acc: number, d: any) => acc + d.size, 0),
                used: relevantDisks.reduce((acc: number, d: any) => acc + d.used, 0)
            }
        };
        storageStats.global.percent = Math.round((storageStats.global.used / storageStats.global.total) * 100) || 0;

        // Find which disk this path belongs to
        if (queryPath) {
            const disk = relevantDisks.find((d: any) => queryPath.startsWith(d.mount));
            if (disk) {
                storageStats.total = disk.size;
                storageStats.used = disk.used;
                storageStats.percent = disk.percent;
            }
        }

        console.log(`[getFiles] Success: ${metadata.length} files returned`);
        res.json({
            files: metadata,
            stats: storageStats
        });

    } catch (error: any) {
        const message = error?.message || (typeof error === 'string' ? error : 'Erro interno no servidor');
        console.error('[getFiles] Error:', message, error);
        res.status(500).json({ error: message });
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
        const isView = req.query.view === 'true';

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (isView) {
            // For images and documents, sendFile allows browser to render inline
            // We set Content-Disposition to inline for good measure
            res.setHeader('Content-Disposition', 'inline');
            return res.sendFile(absolutePath);
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

        const absolutePath = validatePath(filePath);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const ext = path.extname(absolutePath).toLowerCase();
        const isImage = FILE_CATEGORIES.imagens.includes(ext);
        const isVideo = FILE_CATEGORIES.videos.includes(ext);

        if (!isImage && !isVideo) {
            return res.json({ hasThumbnail: false });
        }

        const hash = crypto.createHash('md5').update(absolutePath).digest('hex');
        const thumbDir = path.join(__dirname, '..', '..', 'thumbnails');
        if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

        const thumbPath = path.join(thumbDir, `${hash}.jpg`);

        // Use cache if exists
        if (fs.existsSync(thumbPath)) {
            return res.sendFile(thumbPath);
        }

        if (isImage) {
            await sharp(absolutePath)
                .resize(200, 200, { fit: 'cover' })
                .toFormat('jpeg')
                .toFile(thumbPath);
            return res.sendFile(thumbPath);
        }

        if (isVideo) {
            ffmpeg(absolutePath)
                .on('end', () => {
                    res.sendFile(thumbPath);
                })
                .on('error', (err) => {
                    console.error('[FFMPEG Error]', err);
                    res.json({ hasThumbnail: false });
                })
                .screenshots({
                    timestamps: ['5%'],
                    filename: path.basename(thumbPath),
                    folder: path.dirname(thumbPath),
                    size: '200x200'
                });
            return;
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

// Download multiple files as ZIP
export const downloadZip = async (req: Request, res: Response) => {
    try {
        const { paths } = req.body; // Expecting array of paths

        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            return res.status(400).json({ error: 'Paths array is required' });
        }

        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        const zipName = `backup_${new Date().getTime()}.zip`;
        res.attachment(zipName);

        archive.on('error', (err) => {
            console.error('[Archiver Error]', err);
            res.status(500).send({ error: err.message });
        });

        archive.pipe(res);

        for (const targetPath of paths) {
            const absolutePath = validatePath(targetPath);
            if (fs.existsSync(absolutePath)) {
                const stats = fs.statSync(absolutePath);
                const name = path.basename(absolutePath);

                if (stats.isDirectory()) {
                    archive.directory(absolutePath, name);
                } else {
                    archive.file(absolutePath, { name });
                }
            }
        }

        await archive.finalize();
    } catch (error: any) {
        console.error('[downloadZip] Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
};


