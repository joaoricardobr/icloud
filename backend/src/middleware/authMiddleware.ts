import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase';

export interface AuthRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Verify Token Error:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

export const verifyAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        const userData = userDoc.data();

        if (userData?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Verify Admin Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
