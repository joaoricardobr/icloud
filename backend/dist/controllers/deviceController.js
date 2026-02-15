"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadZip = exports.emptyTrash = exports.getLogs = exports.permanentDelete = exports.getThumbnail = exports.createFolder = exports.deleteFile = exports.uploadFile = exports.downloadFile = exports.getFiles = exports.getSystemStats = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const firebase_1 = require("../config/firebase");
const systeminformation_1 = __importDefault(require("systeminformation"));
const os_1 = __importDefault(require("os"));
const sharp_1 = __importDefault(require("sharp"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const crypto_1 = __importDefault(require("crypto"));
const archiver_1 = __importDefault(require("archiver"));
const HOME_DIR = os_1.default.homedir();
const TRASH_DIR = path_1.default.join(HOME_DIR, '.local', 'share', 'Trash', 'files');
// File type categories - Normalized keys
const FILE_CATEGORIES = {
    imagens: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'],
    videos: ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm', '.m4v', '.mpeg'],
    musicas: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma', '.opus'],
    documentos: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.csv', '.rtf', '.odt']
};
// Helper to validate and sanitize paths - Security Hardening
const validatePath = (targetPath) => {
    if (!targetPath || targetPath === '')
        return HOME_DIR;
    // Convert to absolute path
    let absolutePath = path_1.default.resolve(targetPath);
    // Security check - prevent directory traversal
    if (absolutePath.includes('..')) {
        console.warn(`[Security] Blocked path traversal attempt: ${targetPath}`);
        throw new Error('Invalid path');
    }
    return absolutePath;
};
// Scan directory for files by category (Recursion with strict limits)
const scanDirectoryForCategory = (dirPath, category, maxFiles = 500, depth = 0) => {
    // Increased maxFiles and depth slightly for better results
    if (depth > 5 || maxFiles <= 0 || !fs_1.default.existsSync(dirPath))
        return [];
    // STRICT IGNORE LIST - Vital for preventing Permission Denied errors and hanging
    const IGNORED_DIRS = [
        'node_modules', 'snap', 'System Volume Information', '$RECYCLE.BIN', 'Config.Msi',
        'Windows', 'Program Files', 'Program Files (x86)', 'AppData', 'Application Data',
        'boot', 'dev', 'etc', 'lib', 'lib64', 'lost+found', 'mnt', 'opt', 'proc', 'root',
        'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var', 'bin'
    ];
    if (IGNORED_DIRS.some(ignored => dirPath.includes(path_1.default.sep + ignored) || dirPath.endsWith(path_1.default.sep + ignored))) {
        return [];
    }
    const results = [];
    const extensions = FILE_CATEGORIES[category];
    try {
        const items = fs_1.default.readdirSync(dirPath);
        for (const item of items) {
            // Skip hidden and system folders
            if (item.startsWith('.'))
                continue;
            if (IGNORED_DIRS.includes(item))
                continue;
            const itemPath = path_1.default.join(dirPath, item);
            try {
                // Check if it's a symlink to avoid loops
                const lstat = fs_1.default.lstatSync(itemPath);
                if (lstat.isSymbolicLink())
                    continue;
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
        // console.error(`[Scan] Error reading ${dirPath}:`, e);
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
            const folderPath = isSystem ? path_1.default.join(HOME_DIR, folder) : path_1.default.join(disk.mount, folder);
            try {
                if (fs_1.default.existsSync(folderPath)) {
                    for (const category of Object.keys(FILE_CATEGORIES)) {
                        // Scan logic per category
                        const fileExts = FILE_CATEGORIES[category];
                        // Heuristic: only scan likely folders for speed? No, scan all common folders for all types.
                        // But we limit depth and count to avoid hanging.
                        const files = scanDirectoryForCategory(folderPath, category, 100); // increased limit
                        stats[category].files.push(...files);
                        stats[category].count += files.length;
                        stats[category].size += files.reduce((sum, f) => sum + f.size, 0);
                    }
                }
            }
            catch (e) {
                // Skip specific folder error
            }
        }
    }
    return stats;
};
const getSystemStats = async (req, res) => {
    try {
        const [cpu, mem, osInfo, currentLoad] = await Promise.all([
            systeminformation_1.default.cpu(),
            systeminformation_1.default.mem(),
            systeminformation_1.default.osInfo(),
            systeminformation_1.default.currentLoad()
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
    }
    catch (error) {
        console.error('[SystemStats] Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getSystemStats = getSystemStats;
// Get real disk information and files
const getFiles = async (req, res) => {
    try {
        const queryPath = req.query.path || '';
        const mode = req.query.mode;
        // Normalize category to lowercase to prevent mismatches
        const categoryRaw = req.query.category;
        const category = categoryRaw ? categoryRaw.toLowerCase() : undefined;
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
        // Improve disk detection to include /dev/mapper and others
        const allDisks = await systeminformation_1.default.fsSize();
        let relevantDisks = [];
        try {
            const temps = await systeminformation_1.default.cpuTemperature();
            // Try getting disk layout for temperatures
            const diskLayout = await systeminformation_1.default.diskLayout();
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
                    name: d.mount === '/' ? 'Disco Local (Sistema)' : path_1.default.basename(d.mount) || d.fs,
                    mount: d.mount,
                    size: d.size,
                    used: d.used,
                    percent: Math.round((d.used / d.size) * 100),
                    type: d.mount === '/' ? 'system' : 'external',
                    temperature: layout?.temperature || temps.main || null
                };
            });
        }
        catch (e) {
            console.error('[DiskDetection] Error:', e);
            // Fallback
            relevantDisks = allDisks.filter(d => d.mount && !d.mount.includes('/snap') && d.fs.startsWith('/dev/'))
                .map(d => ({
                name: d.mount === '/' ? 'Disco Local (Sistema)' : path_1.default.basename(d.mount),
                mount: d.mount,
                size: d.size,
                used: d.used,
                percent: Math.round((d.used / d.size) * 100),
                type: d.mount === '/' ? 'system' : 'external',
                temperature: null
            }));
        }
        let metadata = [];
        let categoryStats = null;
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
                path_1.default.join(HOME_DIR, 'Transferências'),
                path_1.default.join(HOME_DIR, 'Documentos'),
                path_1.default.join(HOME_DIR, 'Downloads'),
                path_1.default.join(HOME_DIR, 'Imagens'),
                path_1.default.join(HOME_DIR, 'Vídeos')
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
            metadata = metadata.sort((a, b) => b.mtime.getTime() - a.mtime.getTime()).slice(0, 50);
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
        // HOME VIEW: Show real disks + Uploads Online folder (only on empty path AND no category)
        else if (queryPath === '') {
            // Get category statistics for dashboard
            categoryStats = await getCategoryStats(relevantDisks);
            // 1. Add Disks
            metadata = relevantDisks.map((disk) => ({
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
                    const fullPath = path_1.default.join(HOME_DIR, p);
                    if (fs_1.default.existsSync(fullPath)) {
                        const stats = fs_1.default.statSync(fullPath);
                        metadata.unshift({
                            name: f.name,
                            path: fullPath,
                            size: stats.size,
                            isDirectory: true,
                            mtime: stats.mtime,
                            isFavorite: favoritePaths.has(fullPath),
                            diskLabel: 'Home'
                        });
                        break; // Found one, stop looking for this type
                    }
                }
            }
            // 3. Add Uploads Online folder
            const uploadsOnline = path_1.default.join(HOME_DIR, 'Transferências', 'Uploads Online');
            if (!fs_1.default.existsSync(uploadsOnline)) {
                // Try create only if parent exists, else skip to avoid errors
                try {
                    fs_1.default.mkdirSync(uploadsOnline, { recursive: true });
                }
                catch (e) { }
            }
            if (fs_1.default.existsSync(uploadsOnline)) {
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
            categories: categoryStats,
            global: {
                total: relevantDisks.reduce((acc, d) => acc + d.size, 0),
                used: relevantDisks.reduce((acc, d) => acc + d.used, 0)
            }
        };
        storageStats.global.percent = Math.round((storageStats.global.used / storageStats.global.total) * 100) || 0;
        // Find which disk this path belongs to
        if (queryPath) {
            const disk = relevantDisks.find((d) => queryPath.startsWith(d.mount));
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
    }
    catch (error) {
        const message = error?.message || (typeof error === 'string' ? error : 'Erro interno no servidor');
        console.error('[getFiles] Error:', message, error);
        res.status(500).json({ error: message });
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
        const absolutePath = validatePath(filePath);
        if (!fs_1.default.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        const ext = path_1.default.extname(absolutePath).toLowerCase();
        const isImage = FILE_CATEGORIES.imagens.includes(ext);
        const isVideo = FILE_CATEGORIES.videos.includes(ext);
        if (!isImage && !isVideo) {
            return res.json({ hasThumbnail: false });
        }
        const hash = crypto_1.default.createHash('md5').update(absolutePath).digest('hex');
        const thumbDir = path_1.default.join(__dirname, '..', '..', 'thumbnails');
        if (!fs_1.default.existsSync(thumbDir))
            fs_1.default.mkdirSync(thumbDir, { recursive: true });
        const thumbPath = path_1.default.join(thumbDir, `${hash}.jpg`);
        // Use cache if exists
        if (fs_1.default.existsSync(thumbPath)) {
            return res.sendFile(thumbPath);
        }
        if (isImage) {
            await (0, sharp_1.default)(absolutePath)
                .resize(200, 200, { fit: 'cover' })
                .toFormat('jpeg')
                .toFile(thumbPath);
            return res.sendFile(thumbPath);
        }
        if (isVideo) {
            (0, fluent_ffmpeg_1.default)(absolutePath)
                .on('end', () => {
                res.sendFile(thumbPath);
            })
                .on('error', (err) => {
                console.error('[FFMPEG Error]', err);
                res.json({ hasThumbnail: false });
            })
                .screenshots({
                timestamps: ['5%'],
                filename: path_1.default.basename(thumbPath),
                folder: path_1.default.dirname(thumbPath),
                size: '200x200'
            });
            return;
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
// Get backend logs
const getLogs = async (req, res) => {
    try {
        const logFilePath = path_1.default.join(__dirname, '..', '..', 'logs', 'backend.log');
        if (fs_1.default.existsSync(logFilePath)) {
            const logs = fs_1.default.readFileSync(logFilePath, 'utf-8');
            res.json({ logs });
        }
        else {
            res.json({ logs: 'Log file not found.' });
        }
    }
    catch (error) {
        console.error('[getLogs] Error:', error);
        res.status(500).json({ error: error.message, logs: '' });
    }
};
exports.getLogs = getLogs;
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
// Download multiple files as ZIP
const downloadZip = async (req, res) => {
    try {
        const { paths } = req.body; // Expecting array of paths
        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            return res.status(400).json({ error: 'Paths array is required' });
        }
        const archive = (0, archiver_1.default)('zip', {
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
            if (fs_1.default.existsSync(absolutePath)) {
                const stats = fs_1.default.statSync(absolutePath);
                const name = path_1.default.basename(absolutePath);
                if (stats.isDirectory()) {
                    archive.directory(absolutePath, name);
                }
                else {
                    archive.file(absolutePath, { name });
                }
            }
        }
        await archive.finalize();
    }
    catch (error) {
        console.error('[downloadZip] Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
};
exports.downloadZip = downloadZip;
