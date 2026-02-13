import { db } from '../config/firebase';
import dotenv from 'dotenv';

dotenv.config();

async function updateApiUrl() {
    const url = process.argv[2];
    if (!url) {
        console.error('❌ Erro: URL não fornecida.');
        process.exit(1);
    }

    try {
        console.log(`📝 Atualizando URL no Firestore: ${url}`);
        await db.collection('settings').doc('api_config').set({
            baseUrl: url,
            updatedAt: new Date().toISOString(),
            status: 'online'
        }, { merge: true });

        console.log('✅ URL do Firestore atualizada com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao atualizar Firestore:', error);
        process.exit(1);
    }
}

updateApiUrl();
