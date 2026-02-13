"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFolder = exports.deleteFile = exports.downloadFile = exports.uploadFile = exports.getFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const systeminformation_1 = __importDefault(require("systeminformation"));
const STORAGE_ROOT = '/mnt/storage_pool';
// Helper to sanitize and validate path
const validatePath = (targetPath) => {
    const fullPath = path_1.default.resolve(STORAGE_ROOT, targetPath);
    if (!fullPath.startsWith(STORAGE_ROOT)) {
        throw new Error('Access Denied: Path traversal detected');
    }
    return fullPath;
};
// File extension maps
const EXTENSIONS = {
    imagens: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    videos: ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv'],
    musicas: ['.mp3', '.wav', '.flac', '.m4a', '.ogg'],
    documentos: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.pdf']
};
const getFilesByCategory = (dir, category, depth = 0) => {
    if (depth > 5)
        return []; // Limit depth to prevent hanging
    let results = [];
    let items = [];
    try {
        items = fs_1.default.readdirSync(dir);
    }
    catch (e) {
        console.error(`[Search] Erro ao ler diretório ${dir}:`, e);
        return [];
    }
    const exts = EXTENSIONS[category];
    for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.next' || item.startsWith('.'))
            continue;
        const fullPath = path_1.default.join(dir, item);
        try {
            const stats = fs_1.default.statSync(fullPath);
            if (stats.isDirectory()) {
                results = results.concat(getFilesByCategory(fullPath, category, depth + 1));
            }
            else {
                const ext = path_1.default.extname(item).toLowerCase();
                if (exts.includes(ext)) {
                    results.push({
                        name: item,
                        path: path_1.default.relative(STORAGE_ROOT, fullPath),
                        size: stats.size,
                        isDirectory: false,
                        modifiedAt: stats.mtime
                    });
                }
            }
        }
        catch (e) {
            continue;
        }
        if (results.length > 500)
            break;
    }
    return results;
};
const getFiles = async (req, res) => {
    try {
        const queryPath = req.query.path || '';
        const category = req.query.category;
        // System info for panel - Get ALL physical disks
        const allDisks = await systeminformation_1.default.fsSize();
        const relevantDisks = allDisks.filter(d => d.type.startsWith('dev') ||
            d.mount === '/' ||
            d.mount.startsWith('/media') ||
            d.mount.startsWith('/mnt')).map(d => ({
            name: d.mount === '/' ? 'Disco Local' : path_1.default.basename(d.mount),
            mount: d.mount,
            used: d.used,
            size: d.size,
            percent: d.use,
            type: d.type
        }));
        let metadata = [];
        if (category && EXTENSIONS[category]) {
            // Only search in common data folders to avoid scanning system disks/partitions
            const dataFolders = ['Imagens', 'Pictures', 'Vídeos', 'Videos', 'Música', 'Músicas', 'Music', 'Documentos', 'Documents', 'Transferências', 'Downloads'];
            for (const folder of dataFolders) {
                const folderPath = path_1.default.join(STORAGE_ROOT, folder);
                if (fs_1.default.existsSync(folderPath)) {
                    metadata = metadata.concat(getFilesByCategory(folderPath, category));
                }
                if (metadata.length > 1000)
                    break;
            }
        }
        else {
            const targetDir = validatePath(queryPath);
            if (!fs_1.default.existsSync(targetDir)) {
                return res.status(404).json({ error: 'Directory not found' });
            }
            const stats = fs_1.default.statSync(targetDir);
            if (!stats.isDirectory()) {
                return res.status(400).json({ error: 'Target is not a directory' });
            }
            const items = fs_1.default.readdirSync(targetDir);
            metadata = items.map(item => {
                const itemPath = path_1.default.join(targetDir, item);
                try {
                    const itemStat = fs_1.default.statSync(itemPath);
                    return {
                        name: item,
                        path: path_1.default.relative(STORAGE_ROOT, itemPath),
                        size: itemStat.size,
                        isDirectory: itemStat.isDirectory(),
                        modifiedAt: itemStat.mtime
                    };
                }
                catch (e) {
                    return null;
                }
            }).filter(item => item !== null);
        }
        // Find current stats for the requested path
        const absoluteTarget = category ? STORAGE_ROOT : path_1.default.resolve(validatePath(queryPath));
        let currentDisk = relevantDisks.find(d => absoluteTarget.startsWith(d.mount)) || relevantDisks[0];
        res.json({
            files: metadata,
            stats: {
                total: currentDisk?.size,
                used: currentDisk?.used,
                percent: currentDisk?.percent,
                path: queryPath,
                allDisks: relevantDisks
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getFiles = getFiles;
const uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully', file: req.file.filename });
};
exports.uploadFile = uploadFile;
const downloadFile = (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath)
            return res.status(400).json({ error: 'Path required' });
        const fullPath = validatePath(filePath);
        if (!fs_1.default.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.download(fullPath);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.downloadFile = downloadFile;
const deleteFile = (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath)
            return res.status(400).json({ error: 'Path required' });
        const fullPath = validatePath(filePath);
        if (!fs_1.default.existsSync(fullPath)) {
            return res.status(404).json({ error: 'Target not found' });
        }
        if (fs_1.default.statSync(fullPath).isDirectory()) {
            fs_1.default.rmSync(fullPath, { recursive: true });
        }
        else {
            fs_1.default.unlinkSync(fullPath);
        }
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteFile = deleteFile;
const createFolder = (req, res) => {
    try {
        const { folderName, parentPath } = req.body;
        if (!folderName)
            return res.status(400).json({ error: 'Folder name required' });
        const targetDir = validatePath(path_1.default.join(parentPath || '', folderName));
        if (fs_1.default.existsSync(targetDir)) {
            return res.status(409).json({ error: 'Folder already exists' });
        }
        fs_1.default.mkdirSync(targetDir, { recursive: true });
        res.json({ message: 'Folder created successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createFolder = createFolder;
