"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFavorite = exports.createUser = exports.updateSettings = exports.getSettings = void 0;
const firebase_1 = require("../config/firebase");
const getSettings = async (req, res) => {
    try {
        const settingsDoc = await firebase_1.db.collection('settings').doc('global').get();
        if (!settingsDoc.exists) {
            return res.json({ customRoots: [] });
        }
        res.json(settingsDoc.data());
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const { customRoots } = req.body;
        await firebase_1.db.collection('settings').doc('global').set({ customRoots }, { merge: true });
        res.json({ message: 'Settings updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateSettings = updateSettings;
const createUser = async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const userRecord = await firebase_1.admin.auth().createUser({
            email,
            password,
            displayName,
        });
        // Store extra user info in Firestore
        await firebase_1.db.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            role: 'user',
            createdAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ message: 'User created successfully', uid: userRecord.uid });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createUser = createUser;
const toggleFavorite = async (req, res) => {
    try {
        const { path: filePath } = req.body;
        if (!filePath)
            return res.status(400).json({ error: 'Path is required' });
        const favRef = firebase_1.db.collection('favorites').doc(Buffer.from(filePath).toString('base64'));
        const doc = await favRef.get();
        if (doc.exists) {
            await favRef.delete();
            res.json({ favorite: false });
        }
        else {
            await favRef.set({ path: filePath, updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp() });
            res.json({ favorite: true });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.toggleFavorite = toggleFavorite;
