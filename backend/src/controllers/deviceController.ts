import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../config/firebase';
import si from 'systeminformation';

const STORAGE_ROOT = '/mnt/storage_pool';

// Helper to sanitize and validate path
const validatePath = (targetPath: string) => {
    const fullPath = path.resolve(STORAGE_ROOT, targetPath);
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
                        path: path.relative(STORAGE_ROOT, fullPath),
                        size: stats.size,
                        isDirectory: false,
                        modifiedAt: stats.mtime
                    });
                }
            }
        } catch (e) { continue; }
        if (results.length > 500) break;
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
            name: d.mount === '/' ? 'Disco Local' : path.basename(d.mount),
            mount: d.mount,
            used: d.used,
            size: d.size,
            percent: d.use,
            type: d.type
        }));

        let metadata: any[] = [];

        if (category && EXTENSIONS[category as keyof typeof EXTENSIONS]) {
            // Only search in common data folders to avoid scanning system disks/partitions
            const dataFolders = ['Imagens', 'Pictures', 'Vídeos', 'Videos', 'Música', 'Músicas', 'Music', 'Documentos', 'Documents', 'Transferências', 'Downloads'];

            for (const folder of dataFolders) {
                const folderPath = path.join(STORAGE_ROOT, folder);
                if (fs.existsSync(folderPath)) {
                    metadata = metadata.concat(getFilesByCategory(folderPath, category as keyof typeof EXTENSIONS));
                }
                if (metadata.length > 1000) break;
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
                        path: path.relative(STORAGE_ROOT, itemPath),
                        size: itemStat.size,
                        isDirectory: itemStat.isDirectory(),
                        modifiedAt: itemStat.mtime
                    };
                } catch (e) {
                    return null;
                }
            }).filter(item => item !== null);
        }

        // Find current stats for the requested path
        const absoluteTarget = category ? STORAGE_ROOT : path.resolve(validatePath(queryPath));
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const uploadFile = (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
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
