import { Request, Response } from 'express';
import { db, admin } from '../config/firebase';
import fs from 'fs';
import path from 'path';
import os from 'os';
import si from 'systeminformation';

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settingsDoc = await db.collection('settings').doc('global').get();
        if (!settingsDoc.exists) {
            return res.json({ customRoots: [] });
        }
        res.json(settingsDoc.data());
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const { customRoots } = req.body;
        await db.collection('settings').doc('global').set({ customRoots }, { merge: true });
        res.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });

        // Store extra user info in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            role: 'user',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ message: 'User created successfully', uid: userRecord.uid });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const toggleFavorite = async (req: Request, res: Response) => {
    try {
        const { path: filePath } = req.body;
        if (!filePath) return res.status(400).json({ error: 'Path is required' });

        const favRef = db.collection('favorites').doc(Buffer.from(filePath).toString('base64'));
        const doc = await favRef.get();

        if (doc.exists) {
            await favRef.delete();
            res.json({ favorite: false });
        } else {
            await favRef.set({ path: filePath, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
            res.json({ favorite: true });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
