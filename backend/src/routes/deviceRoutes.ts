import { Router } from 'express';
import { getFiles, uploadFile, downloadFile, deleteFile, createFolder, getThumbnail, getLogs, permanentDelete, emptyTrash, downloadZip } from '../controllers/deviceController';
import { getSettings, updateSettings, createUser, toggleFavorite } from '../controllers/settingsController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const router = Router();

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = req.body.path || '';

        // If path is empty (root), save in /home/user/Transferências/Uploads Online
        if (!dest || dest === '/' || dest === '') {
            dest = path.join(os.homedir(), 'Transferências', 'Uploads Online');
        }

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 500 } // 500MB limit
});

// Routes - Removing verifyToken for local-first seamless access
// router.use(verifyToken); 

router.get('/files', getFiles);
router.get('/download', downloadFile);
router.post('/download-zip', downloadZip);
router.get('/thumbnail', getThumbnail);
router.get('/logs', getLogs);

// Admin actions - Keeping verification or making it optional for now
router.post('/upload', upload.array('files'), uploadFile);
router.post('/create-folder', createFolder);
router.delete('/delete', deleteFile);
router.post('/permanent-delete', permanentDelete);
router.post('/empty-trash', emptyTrash);

// Settings & Users
router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.post('/users', createUser);
router.post('/favorite', toggleFavorite);

export default router;
