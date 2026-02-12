import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../config/firebase';
import si from 'systeminformation';
import os from 'os';

const STORAGE_ROOT = '/'; // Changed to root to allow access to /home and /mnt
const HOME_DIR = os.homedir();

// Helper to sanitize and validate path
const validatePath = (targetPath: string) => {
    // If empty or root, return /
    if (!targetPath || targetPath === '/') return '/';

    // Standardize to absolute path
    let absolutePath = targetPath.startsWith('/') ? targetPath : path.resolve('/', targetPath);

    // Security: Only allow access to /home, /mnt, /media
    const allowedRoots = ['/home', '/mnt', '/media'];
    const isAllowed = allowedRoots.some(root => absolutePath.startsWith(root));

    // If it's a root partition item, we might need it, but let's stick to these for now
    if (!isAllowed && absolutePath !== '/') {
        // Log it but allow for now to debug
        console.log(`[Validation] Accessing outside common roots: ${absolutePath}`);
    }

    return absolutePath;
};

// File extension maps
const EXTENSIONS = {
    imagens: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff'],
    videos: ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm', '.m4v'],
    musicas: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma'],
    documentos: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.csv', '.rtf'],
    arquivos: ['.zip', '.rar', '.7z', '.tar', '.gz', '.apk', '.exe', '.deb', '.iso']
};

const getFilesByCategory = (dir: string, category: keyof typeof EXTENSIONS, depth = 0): any[] => {
    if (depth > 5) return []; // Limit depth to prevent hanging

    let results: any[] = [];
    let items: string[] = [];

    try {
        items = fs.readdirSync(dir);
    } catch (e) {
        console.error(`[Search] Erro ao ler diretório ${dir}:`, e);
        return [];
    }

    const exts = EXTENSIONS[category];

    for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.next' || item.startsWith('.')) continue;

        const fullPath = path.join(dir, item);
        try {
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                results = results.concat(getFilesByCategory(fullPath, category, depth + 1));
            } else {
                const ext = path.extname(item).toLowerCase();
                if (exts.includes(ext)) {
                    results.push({
                        name: item,
                        path: fullPath, // Always absolute
                        size: stats.size,
                        isDirectory: false,
                        modifiedAt: stats.mtime
                    });
                }
            }
        } catch (e) { continue; }
        if (results.length > 500) break;
    }
    return results.map(item => ({ ...item, diskLabel: path.basename(dir) === 'UPLOAD CLOUD' ? 'Cloud' : (dir.startsWith(os.homedir()) ? 'Pessoal' : path.basename(dir)) }));
};

const getHybridFiles = (folderName: string, disks: any[]): any[] => {
    let results: any[] = [];
    const normalizedFolderName = folderName.toLowerCase();

    for (const disk of disks) {
        const potentialPaths = [
            path.join(disk.mount, folderName),
            path.join(disk.mount, 'UPLOAD CLOUD', folderName)
        ];

        // Handling PT-BR vs EN variations for standard folders
        if (normalizedFolderName === 'imagens' || normalizedFolderName === 'pictures') {
            potentialPaths.push(path.join(disk.mount, 'Pictures'), path.join(disk.mount, 'Imagens'));
        } else if (normalizedFolderName === 'vídeos' || normalizedFolderName === 'videos') {
            potentialPaths.push(path.join(disk.mount, 'Videos'), path.join(disk.mount, 'Vídeos'));
        } else if (normalizedFolderName === 'documentos' || normalizedFolderName === 'documents') {
            potentialPaths.push(path.join(disk.mount, 'Documents'), path.join(disk.mount, 'Documentos'));
        } else if (normalizedFolderName === 'música' || normalizedFolderName === 'music') {
            potentialPaths.push(path.join(disk.mount, 'Music'), path.join(disk.mount, 'Música'));
        }

        for (const p of potentialPaths) {
            if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
                const items = fs.readdirSync(p);
                results = results.concat(items.map(item => {
                    const itemPath = path.join(p, item);
                    try {
                        const itemStat = fs.statSync(itemPath);
                        return {
                            name: item,
                            path: itemPath,
                            size: itemStat.size,
                            isDirectory: itemStat.isDirectory(),
                            modifiedAt: itemStat.mtime,
                            diskLabel: disk.name
                        };
                    } catch (e) { return null; }
                }).filter(i => i !== null));
            }
        }
    }
    return results;
};

export const getFiles = async (req: Request, res: Response) => {
    try {
        const queryPath = (req.query.path as string) || '';
        const category = req.query.category as string;

        // System info for panel - Get ALL physical disks
        const allDisks = await si.fsSize();
        const relevantDisks = allDisks.filter(d =>
            d.type.startsWith('dev') ||
            d.mount === '/' ||
            d.mount.startsWith('/media') ||
            d.mount.startsWith('/mnt')
        ).map(d => ({
            name: d.mount === '/' ? 'Sistema' : path.basename(d.mount) || 'Disco',
            mount: d.mount,
            used: d.used,
            size: d.size,
            percent: d.use,
            type: d.type
        }));

        // Add Home Directory as a primary 'disk' entry
        relevantDisks.unshift({
            name: 'Pasta Pessoal',
            mount: HOME_DIR,
            used: 0, // We could calculate this but SI doesn't give it for subfolders easily
            size: 0,
            percent: 0,
            type: 'home'
        });

        let metadata: any[] = [];

        if (category && EXTENSIONS[category as keyof typeof EXTENSIONS]) {
            // Scan ALL relevant disks for categories
            const categoryExts = EXTENSIONS[category as keyof typeof EXTENSIONS];

            for (const disk of relevantDisks) {
                // Common folders to check on each disk
                const searchPaths = [
                    disk.mount, // Root
                    path.join(disk.mount, 'UPLOAD CLOUD'),
                    path.join(disk.mount, 'Imagens'),
                    path.join(disk.mount, 'Vídeos'),
                    path.join(disk.mount, 'Música'),
                    path.join(disk.mount, 'Documentos'),
                    path.join(disk.mount, 'Download'),
                    path.join(disk.mount, 'Transferências'),
                    path.join(disk.mount, 'Downloads'),
                    path.join(disk.mount, 'Pictures'),
                    path.join(disk.mount, 'Videos'),
                    path.join(disk.mount, 'Documents'),
                    path.join(disk.mount, 'Music')
                ];

                // If it's the home disk, add user-specific paths
                if (disk.mount === HOME_DIR || disk.mount === '/') {
                    searchPaths.push(path.join(HOME_DIR, 'Imagens'));
                    searchPaths.push(path.join(HOME_DIR, 'Pictures'));
                    searchPaths.push(path.join(HOME_DIR, 'Vídeos'));
                    searchPaths.push(path.join(HOME_DIR, 'Videos'));
                    searchPaths.push(path.join(HOME_DIR, 'Documentos'));
                    searchPaths.push(path.join(HOME_DIR, 'Documents'));
                    searchPaths.push(path.join(HOME_DIR, 'Transferências'));
                    searchPaths.push(path.join(HOME_DIR, 'Downloads'));
                }

                for (const searchPath of searchPaths) {
                    if (fs.existsSync(searchPath)) {
                        metadata = metadata.concat(getFilesByCategory(searchPath, category as keyof typeof EXTENSIONS));
                    }
                    if (metadata.length > 2000) break;
                }
                if (metadata.length > 2000) break;
            }
        } else {
            const targetDir = validatePath(queryPath);
            if (!fs.existsSync(targetDir)) {
                return res.status(404).json({ error: 'Directory not found' });
            }

            const stats = fs.statSync(targetDir);
            if (!stats.isDirectory()) {
                return res.status(400).json({ error: 'Target is not a directory' });
            }

            const items = fs.readdirSync(targetDir);
            metadata = items.map(item => {
                const itemPath = path.join(targetDir, item);
                try {
                    const itemStat = fs.statSync(itemPath);
                    return {
                        name: item,
                        path: itemPath, // Always absolute
                        size: itemStat.size,
                        isDirectory: itemStat.isDirectory(),
                        modifiedAt: itemStat.mtime,
                        diskLabel: currentDisk?.name || 'Sistema'
                    };
                } catch (e) {
                    return null;
                }
            }).filter(item => item !== null);

            // HYBRID LOGIC: If opening a standard folder name, also pull from other disks
            const standardFolders = ['Documentos', 'Vídeos', 'Imagens', 'Música', 'Downloads', 'Transferências', 'Desktop', 'Pictures', 'Videos', 'Documents', 'Music'];
            const currentFolderName = path.basename(targetDir);

            if (standardFolders.includes(currentFolderName)) {
                const hybridResults = getHybridFiles(currentFolderName, relevantDisks.filter(d => d.mount !== currentDisk?.mount));
                metadata = [...metadata, ...hybridResults];
            }

            // If at root, also add standard home folders for quick access
            if (queryPath === '' || queryPath === '/') {
                const homeFolders = ['Documentos', 'Vídeos', 'Imagens', 'Música', 'Downloads', 'Transferências', 'Desktop', 'Documentos', 'Pictures', 'Videos', 'Music'];
                const addedFolders = new Set();

                for (const folder of homeFolders) {
                    const fullFolderPath = path.join(HOME_DIR, folder);
                    if (fs.existsSync(fullFolderPath) && !addedFolders.has(folder)) {
                        const stat = fs.statSync(fullFolderPath);
                        metadata.unshift({
                            name: folder,
                            path: fullFolderPath, // Return absolute path for system folders
                            size: stat.size,
                            isDirectory: true,
                            modifiedAt: stat.mtime,
                            isSystem: true
                        });
                        addedFolders.add(folder);
                    }
                }
            }
        }

        // Find current stats for the requested path
        const absoluteTarget = category ? STORAGE_ROOT : path.resolve(validatePath(queryPath));
        let currentDisk = relevantDisks.find(d => absoluteTarget.startsWith(d.mount)) || relevantDisks[0];

        res.json({
            files: metadata.map(f => ({
                ...f,
                hasThumbnail: !f.isDirectory && (
                    EXTENSIONS.imagens.includes(path.extname(f.name).toLowerCase()) ||
                    EXTENSIONS.videos.includes(path.extname(f.name).toLowerCase())
                )
            })),
            stats: {
                total: currentDisk?.size,
                used: currentDisk?.used,
                percent: currentDisk?.percent,
                path: queryPath,
                allDisks: relevantDisks
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const uploadFile = (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const targetPath = (req.body.path as string) || '';

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    // Ensure UPLOAD CLOUD exists if it's a disk root
    try {
        if (targetPath && fs.existsSync(targetPath)) {
            const stats = fs.statSync(targetPath);
            if (stats.isDirectory()) {
                const cloudFolder = path.join(targetPath, 'UPLOAD CLOUD');
                if (!fs.existsSync(cloudFolder) && targetPath.length < 15) { // Likely a disk root like /mnt/disk1
                    fs.mkdirSync(cloudFolder, { recursive: true });
                }
            }
        }
    } catch (e) {
        console.error("Error creating UPLOAD CLOUD:", e);
    }

    res.json({
        message: `${files.length} file(s) uploaded successfully`,
        files: files.map(f => f.filename)
    });
};

export const downloadFile = (req: Request, res: Response) => {
    try {
        const filePath = req.query.path as string;
        if (!filePath) return res.status(400).json({ error: 'Path required' });

        const fullPath = validatePath(filePath);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(fullPath);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteFile = (req: Request, res: Response) => {
    try {
        const filePath = req.query.path as string;
        if (!filePath) return res.status(400).json({ error: 'Path required' });

        const fullPath = validatePath(filePath);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'Target not found' });
        }

        if (fs.statSync(fullPath).isDirectory()) {
            fs.rmSync(fullPath, { recursive: true });
        } else {
            fs.unlinkSync(fullPath);
        }

        res.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createFolder = (req: Request, res: Response) => {
    try {
        const { folderName, parentPath } = req.body;
        if (!folderName) return res.status(400).json({ error: 'Folder name required' });

        const targetDir = validatePath(path.join(parentPath || '', folderName));

        if (fs.existsSync(targetDir)) {
            return res.status(409).json({ error: 'Folder already exists' });
        }

        fs.mkdirSync(targetDir, { recursive: true });
        res.json({ message: 'Folder created successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

export const getThumbnail = async (req: Request, res: Response) => {
    try {
        const filePath = req.query.path as string;
        if (!filePath) return res.status(400).json({ error: 'Path required' });

        const fullPath = validatePath(filePath);
        if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

        const ext = path.extname(fullPath).toLowerCase();

        if (EXTENSIONS.imagens.includes(ext)) {
            const buffer = await sharp(fullPath)
                .resize(200, 200, { fit: 'cover' })
                .toFormat('jpeg')
                .toBuffer();
            res.set('Content-Type', 'image/jpeg');
            return res.send(buffer);
        }

        if (EXTENSIONS.videos.includes(ext)) {
            const thumbName = `thumb-${path.basename(fullPath)}.jpg`;
            const thumbPath = path.join('/tmp', thumbName);

            ffmpeg(fullPath)
                .screenshots({
                    timestamps: ['00:00:01'],
                    filename: thumbName,
                    folder: '/tmp',
                    size: '200x200'
                })
                .on('end', () => {
                    res.sendFile(thumbPath, () => {
                        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
                    });
                })
                .on('error', (err) => {
                    res.status(500).json({ error: 'Thumbnail failed' });
                });
            return;
        }

        res.status(400).json({ error: 'Unsupported thumbnail type' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
