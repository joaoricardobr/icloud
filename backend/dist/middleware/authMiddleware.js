"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = exports.verifyToken = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebase_1 = require("../config/firebase");
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        console.error('Verify Token Error:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
exports.verifyToken = verifyToken;
const verifyAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }
    try {
        const userDoc = await firebase_1.db.collection('users').doc(req.user.uid).get();
        const userData = userDoc.data();
        if (userData?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        next();
    }
    catch (error) {
        console.error('Verify Admin Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.verifyAdmin = verifyAdmin;
