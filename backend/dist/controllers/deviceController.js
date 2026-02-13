"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyTrash = exports.permanentDelete = exports.getThumbnail = exports.createFolder = exports.deleteFile = exports.uploadFile = exports.downloadFile = exports.getFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const firebase_1 = require("../config/firebase");
const systeminformation_1 = __importDefault(require("systeminformation"));
const os_1 = __importDefault(require("os"));
const HOME_DIR = os_1.default.homedir();
const TRASH_DIR = path_1.default.join(HOME_DIR, '.local', 'share', 'Trash', 'files');
// File type categories
const FILE_CATEGORIES = {
    imagens: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'],
    videos: ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm', '.m4v', '.mpeg'],
    musicas: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma', '.opus'],
    documentos: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.csv', '.rtf', '.odt']
};
// Helper to validate and sanitize paths
const validatePath = (targetPath) => {
    if (!targetPath || targetPath === '')
        return HOME_DIR;
    // Convert to absolute path
    let absolutePath = path_1.default.resolve(targetPath);
    // Security check - prevent directory traversal
    if (absolutePath.includes('..')) {
        throw new Error('Invalid path');
    }
    return absolutePath;
};
// Scan directory for files by category (limited depth for performance)
const scanDirectoryForCategory = (dirPath, category, maxFiles = 100, depth = 0) => {
    if (depth > 3 || !fs_1.default.existsSync(dirPath))
        return [];
    const results = [];
    const extensions = FILE_CATEGORIES[category];
    try {
        const items = fs_1.default.readdirSync(dirPath);
        for (const item of items) {
            // Skip hidden and system folders
            if (item.startsWith('.') || item === 'node_modules' || item === 'snap')
                continue;
            const itemPath = path_1.default.join(dirPath, item);
            try {
                const stats = fs_1.default.statSync(itemPath);
                if (stats.isDirectory()) {
                    // Recursively scan subdirectories
                    const subResults = scanDirectoryForCategory(itemPath, category, maxFiles - results.length, depth + 1);
                    results.push(...subResults);
                }
                else {
                    // Check if file matches category
                    const ext = path_1.default.extname(item).toLowerCase();
                    if (extensions.includes(ext)) {
                        results.push({
                            name: item,
                            path: itemPath,
                            size: stats.size,
                            isDirectory: false,
                            mtime: stats.mtime,
                            category: category,
                            diskLabel: dirPath.startsWith(HOME_DIR) ? 'Home' : path_1.default.basename(dirPath)
                        });
                    }
                }
                // Limit results for performance
                if (results.length >= maxFiles)
                    break;
            }
            catch (e) {
                // Skip files we can't access
                continue;
            }
        }
    }
    catch (e) {
        console.error(`[Scan] Error reading ${dirPath}:`, e);
    }
    return results;
};
// Get category statistics across all disks
const getCategoryStats = async (disks) => {
    const stats = {
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
                const folderPath = path_1.default.join(HOME_DIR, folder);
                if (fs_1.default.existsSync(folderPath)) {
                    // Scan for each category
                    for (const category of Object.keys(FILE_CATEGORIES)) {
                        const files = scanDirectoryForCategory(folderPath, category, 20);
                        stats[category].files.push(...files);
                        stats[category].count += files.length;
                        stats[category].size += files.reduce((sum, f) => sum + f.size, 0);
                    }
                }
            }
        }
        else {
            // Scan external disk root and common folders
            for (const folder of ['', ...commonFolders]) {
                const folderPath = folder ? path_1.default.join(disk.mount, folder) : disk.mount;
                if (fs_1.default.existsSync(folderPath)) {
                    for (const category of Object.keys(FILE_CATEGORIES)) {
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
const getFiles = async (req, res) => {
    try {
        const queryPath = req.query.path || '';
        const mode = req.query.mode;
        const category = req.query.category;
        console.log(`[getFiles] Path: "${queryPath}", Mode: "${mode}", Category: "${category}"`);
        // Get favorites once for efficient tagging
        const favoritePaths = new Set();
        try {
            const favs = await firebase_1.db.collection('favorites').get();
            favs.docs.forEach(doc => {
                const p = doc.data().path;
                if (p)
                    favoritePaths.add(p);
            });
        }
        catch (e) {
            console.error('[getFiles] Error fetching favorites:', e);
        }
        // Get real disk information
        const allDisks = await systeminformation_1.default.fsSize();
        const relevantDisks = allDisks
            .filter(d => {
            // Only real physical disks
            const isPhysical = d.fs.startsWith('/dev/sd') || d.fs.startsWith('/dev/nvme');
            const hasMount = d.mount && d.mount !== '';
            const notSnap = !d.mount.includes('/snap');
            return isPhysical && hasMount && notSnap;
        })
            .map(d => ({
            name: d.mount === '/' ? 'Disco Local (Sistema)' : path_1.default.basename(d.mount) || d.fs,
            mount: d.mount,
            size: d.size,
            used: d.used,
            percent: Math.round((d.used / d.size) * 100),
            type: d.mount === '/' ? 'system' : 'external'
        }));
        let metadata = [];
        let categoryStats = null;
        // MODE: Category view (show files of specific type across all disks)
        if (category && FILE_CATEGORIES[category]) {
            console.log(`[Category] Scanning for ${category}...`);
            const allStats = await getCategoryStats(relevantDisks);
            metadata = allStats[category].files || [];
            categoryStats = allStats;
        }
        // MODE: Recent files
        else if (mode === 'recent') {
            const scanDirs = [
                HOME_DIR,
                path_1.default.join(HOME_DIR, 'Transferências'),
                path_1.default.join(HOME_DIR, 'Documentos'),
                path_1.default.join(HOME_DIR, 'Downloads')
            ];
            for (const dir of scanDirs) {
                if (fs_1.default.existsSync(dir)) {
                    try {
                        const items = fs_1.default.readdirSync(dir);
                        for (const item of items) {
                            if (item.startsWith('.'))
                                continue;
                            const itemPath = path_1.default.join(dir, item);
                            try {
                                const stats = fs_1.default.statSync(itemPath);
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
                            }
                            catch (e) { }
                        }
                    }
                    catch (e) { }
                }
            }
            metadata = metadata.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()).slice(0, 50);
        }
        // MODE: Favorites
        else if (mode === 'favorites') {
            try {
                const favs = await firebase_1.db.collection('favorites').get();
                for (const doc of favs.docs) {
                    const filePath = doc.data().path;
                    if (fs_1.default.existsSync(filePath)) {
                        const stats = fs_1.default.statSync(filePath);
                        metadata.push({
                            name: path_1.default.basename(filePath),
                            path: filePath,
                            size: stats.size,
                            isDirectory: stats.isDirectory(),
                            mtime: stats.mtime,
                            isFavorite: true,
                            diskLabel: 'Favorito'
                        });
                    }
                }
            }
            catch (e) {
                console.error('[Favorites] Error:', e);
            }
        }
        // MODE: Trash
        else if (mode === 'trash') {
            if (fs_1.default.existsSync(TRASH_DIR)) {
                try {
                    const items = fs_1.default.readdirSync(TRASH_DIR);
                    metadata = items.map(item => {
                        const itemPath = path_1.default.join(TRASH_DIR, item);
                        try {
                            const stats = fs_1.default.statSync(itemPath);
                            return {
                                name: item,
                                path: itemPath,
                                size: stats.size,
                                isDirectory: stats.isDirectory(),
                                mtime: stats.mtime,
                                isFavorite: favoritePaths.has(itemPath),
                                diskLabel: 'Lixeira'
                            };
                        }
                        catch (e) {
                            return null;
                        }
                    }).filter(i => i !== null);
                }
                catch (e) {
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
            const uploadsOnline = path_1.default.join(HOME_DIR, 'Transferências', 'Uploads Online');
            if (!fs_1.default.existsSync(uploadsOnline)) {
                fs_1.default.mkdirSync(uploadsOnline, { recursive: true });
            }
            const uploadsStats = fs_1.default.statSync(uploadsOnline);
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
            if (!fs_1.default.existsSync(targetDir)) {
                return res.status(404).json({ error: 'Directory not found' });
            }
            const stats = fs_1.default.statSync(targetDir);
            if (!stats.isDirectory()) {
                return res.status(400).json({ error: 'Path is not a directory' });
            }
            // Read real directory contents
            let items = [];
            try {
                items = fs_1.default.readdirSync(targetDir);
            }
            catch (e) {
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
                if (item.startsWith('.'))
                    continue;
                const itemPath = path_1.default.join(targetDir, item);
                try {
                    const itemStats = fs_1.default.statSync(itemPath);
                    metadata.push({
                        name: item,
                        path: itemPath,
                        size: itemStats.size,
                        isDirectory: itemStats.isDirectory(),
                        mtime: itemStats.mtime,
                        isFavorite: favoritePaths.has(itemPath),
                        diskLabel: path_1.default.basename(targetDir)
                    });
                }
                catch (e) {
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
    }
    catch (error) {
        console.error('[getFiles] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getFiles = getFiles;
// Download file
const downloadFile = async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }
        const absolutePath = validatePath(filePath);
        if (!fs_1.default.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.download(absolutePath);
    }
    catch (error) {
        console.error('[downloadFile] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.downloadFile = downloadFile;
// Upload file (handled by multer in routes)
const uploadFile = async (req, res) => {
    try {
        res.json({ message: 'Files uploaded successfully', files: req.files });
    }
    catch (error) {
        console.error('[uploadFile] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.uploadFile = uploadFile;
// Delete file or folder
const deleteFile = async (req, res) => {
    try {
        const filePath = req.body.path;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }
        const absolutePath = validatePath(filePath);
        if (!fs_1.default.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        // Move to trash instead of permanent delete
        if (!fs_1.default.existsSync(TRASH_DIR)) {
            fs_1.default.mkdirSync(TRASH_DIR, { recursive: true });
        }
        const fileName = path_1.default.basename(absolutePath);
        const trashPath = path_1.default.join(TRASH_DIR, fileName);
        fs_1.default.renameSync(absolutePath, trashPath);
        res.json({ message: 'File moved to trash successfully' });
    }
    catch (error) {
        console.error('[deleteFile] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.deleteFile = deleteFile;
// Create folder
const createFolder = async (req, res) => {
    try {
        const { path: folderPath, name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }
        const parentPath = validatePath(folderPath || HOME_DIR);
        const newFolderPath = path_1.default.join(parentPath, name);
        if (fs_1.default.existsSync(newFolderPath)) {
            return res.status(400).json({ error: 'Folder already exists' });
        }
        fs_1.default.mkdirSync(newFolderPath, { recursive: true });
        res.json({ message: 'Folder created successfully', path: newFolderPath });
    }
    catch (error) {
        console.error('[createFolder] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.createFolder = createFolder;
// Get thumbnail
const getThumbnail = async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }
        res.json({ hasThumbnail: false });
    }
    catch (error) {
        console.error('[getThumbnail] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getThumbnail = getThumbnail;
// Permanently delete file or folder (bypass trash)
const permanentDelete = async (req, res) => {
    try {
        const filePath = req.body.path;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }
        const absolutePath = validatePath(filePath);
        if (!fs_1.default.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        const stats = fs_1.default.statSync(absolutePath);
        if (stats.isDirectory()) {
            fs_1.default.rmSync(absolutePath, { recursive: true, force: true });
        }
        else {
            fs_1.default.unlinkSync(absolutePath);
        }
        res.json({ message: 'Item permanently deleted' });
    }
    catch (error) {
        console.error('[permanentDelete] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.permanentDelete = permanentDelete;
// Empty Trash folder
const emptyTrash = async (req, res) => {
    try {
        if (!fs_1.default.existsSync(TRASH_DIR)) {
            return res.json({ message: 'Trash is already empty' });
        }
        const items = fs_1.default.readdirSync(TRASH_DIR);
        for (const item of items) {
            const itemPath = path_1.default.join(TRASH_DIR, item);
            try {
                const stats = fs_1.default.statSync(itemPath);
                if (stats.isDirectory()) {
                    fs_1.default.rmSync(itemPath, { recursive: true, force: true });
                }
                else {
                    fs_1.default.unlinkSync(itemPath);
                }
            }
            catch (e) {
                console.error(`[emptyTrash] Error deleting ${itemPath}:`, e);
            }
        }
        res.json({ message: 'Trash emptied successfully' });
    }
    catch (error) {
        console.error('[emptyTrash] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.emptyTrash = emptyTrash;
