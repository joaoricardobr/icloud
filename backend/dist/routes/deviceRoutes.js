"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deviceController_1 = require("../controllers/deviceController");
const settingsController_1 = require("../controllers/settingsController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const router = (0, express_1.Router)();
// Multer Setup
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let dest = req.body.path || '';
        // If path is empty (root), save in /home/user/Transferências/Uploads Online
        if (!dest || dest === '/' || dest === '') {
            dest = path_1.default.join(os_1.default.homedir(), 'Transferências', 'Uploads Online');
        }
        if (!fs_1.default.existsSync(dest)) {
            fs_1.default.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 1024 * 1024 * 500 } // 500MB limit
});
// Routes - Removing verifyToken for local-first seamless access
// router.use(verifyToken); 
router.get('/files', deviceController_1.getFiles);
router.get('/download', deviceController_1.downloadFile);
router.get('/thumbnail', deviceController_1.getThumbnail);
router.get('/logs', deviceController_1.getLogs);
// Admin actions - Keeping verification or making it optional for now
router.post('/upload', upload.array('files'), deviceController_1.uploadFile);
router.post('/create-folder', deviceController_1.createFolder);
router.delete('/delete', deviceController_1.deleteFile);
router.post('/permanent-delete', deviceController_1.permanentDelete);
router.post('/empty-trash', deviceController_1.emptyTrash);
// Settings & Users
router.get('/settings', settingsController_1.getSettings);
router.post('/settings', settingsController_1.updateSettings);
router.post('/users', settingsController_1.createUser);
router.post('/favorite', settingsController_1.toggleFavorite);
exports.default = router;
