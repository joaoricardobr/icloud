const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to service account file
const serviceAccountPath = path.join(__dirname, '..', '..', 'service-account.json');
const serviceAccountExists = fs.existsSync(serviceAccountPath);

// Initialize with service account if available, otherwise use default
if (!admin.apps.length) {
    if (serviceAccountExists) {
        console.log('🔑 Usando service-account.json para autenticação.');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
            projectId: "cloud-engenheiros"
        });
    } else {
        console.warn('⚠️ service-account.json não encontrado. Tentando credenciais padrão do Google...');
        admin.initializeApp({
            projectId: "cloud-engenheiros"
        });
    }
}

const db = admin.firestore();

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
        console.error('❌ Erro ao atualizar Firestore:', error.message || error);
        if (error.message && error.message.includes('Could not load the default credentials')) {
            console.log('\n💡 DICA: O script não conseguiu se autenticar com o Firebase.');
            console.log('Por favor, coloque o arquivo "service-account.json" na pasta "backend/"');
            console.log('ou rode "gcloud auth application-default login" no terminal.\n');
        }
        process.exit(1);
    }
}

updateApiUrl();
