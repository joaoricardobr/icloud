import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "cloud-engenheiros",
        storageBucket: "cloud-engenheiros.firebasestorage.app"
    });
}

const db = getFirestore();

export { db, admin };
