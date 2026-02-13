import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const serviceAccountPath = path.join(__dirname, '..', '..', 'service-account.json');
const serviceAccountExists = fs.existsSync(serviceAccountPath);

if (!admin.apps.length) {
    if (serviceAccountExists) {
        console.log('🔑 Usando service-account.json para Firebase ADM.');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
            projectId: "cloud-engenheiros",
            storageBucket: "cloud-engenheiros.firebasestorage.app"
        });
    } else {
        console.warn('⚠️ service-account.json não encontrado. Usando credenciais padrão.');
        admin.initializeApp({
            projectId: "cloud-engenheiros",
            storageBucket: "cloud-engenheiros.firebasestorage.app"
        });
    }
}

const db = getFirestore();

export { db, admin };
