"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function updateApiUrl() {
    const url = process.argv[2];
    if (!url) {
        console.error('❌ Erro: URL não fornecida.');
        process.exit(1);
    }
    try {
        console.log(`📝 Atualizando URL no Firestore: ${url}`);
        await firebase_1.db.collection('settings').doc('api_config').set({
            baseUrl: url,
            updatedAt: new Date().toISOString(),
            status: 'online'
        }, { merge: true });
        console.log('✅ URL do Firestore atualizada com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro ao atualizar Firestore:', error);
        process.exit(1);
    }
}
updateApiUrl();
