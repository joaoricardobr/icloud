import { getFiles, uploadFile, downloadFile, deleteFile, createFolder, getThumbnail } from '../controllers/deviceController';
import { getSettings, updateSettings, createUser } from '../controllers/settingsController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = req.body.path || '/mnt/storage_pool';
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
router.get('/thumbnail', getThumbnail);

// Admin actions - Keeping verification or making it optional for now
router.post('/upload', upload.array('files'), uploadFile);
router.post('/create-folder', createFolder);
router.delete('/delete', deleteFile);

// Settings & Users
router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.post('/users', createUser);

export default router;
