"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deviceController_1 = require("../controllers/deviceController");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// Multer Setup
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dest = req.body.path || '/mnt/storage_pool';
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
// Admin actions - Keeping verification or making it optional for now
router.post('/upload', upload.single('file'), deviceController_1.uploadFile);
router.post('/create-folder', deviceController_1.createFolder);
router.delete('/delete', deviceController_1.deleteFile);
exports.default = router;
