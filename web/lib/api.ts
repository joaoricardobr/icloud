import axios from "axios";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Cache Buster: 2026-02-13T12:58:00Z - Dynamic API Discovery
const DEFAULT_API_URL = "https://overcome-entrepreneurs-anatomy-issues.trycloudflare.com/api/cloud";

const api = axios.create({
    baseURL: DEFAULT_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Dynamic BaseURL Discovery
const updateBaseURL = async (retryCount = 0) => {
    // Priority 1: If we are on localhost, try the local backend first
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        api.defaults.baseURL = "http://localhost:3001/api/cloud";
        console.log("🏠 Localhost detectado. Usando backend local:", api.defaults.baseURL);
        return;
    }

    try {
        console.log("🔍 Tentando carregar URL dinâmica do Firestore (tentativa " + (retryCount + 1) + ")...");
        const configDoc = await getDoc(doc(db, "settings", "api_config"));

        if (configDoc.exists()) {
            const data = configDoc.data();
            if (data.baseUrl) {
                api.defaults.baseURL = data.baseUrl;
                console.log("✅ CloudDesk API URL dinâmica carregada do Firestore:", api.defaults.baseURL);
                return;
            }
        } else {
            console.warn("ℹ️ Documento 'settings/api_config' não encontrado no Firestore.");
        }
    } catch (err: any) {
        console.error("❌ Erro ao acessar Firestore:", err.message || err);
        if (retryCount < 2) {
            console.log("⏳ Tentando novamente em 2 segundos...");
            setTimeout(() => updateBaseURL(retryCount + 1), 2000);
            return;
        }
    }
    console.warn("⚠️ Usando URL padrão (fallback):", api.defaults.baseURL);
};

// Export discovery for external triggering
export const refreshApiConfig = () => updateBaseURL();

// Start discovery immediately
if (typeof window !== "undefined") {
    updateBaseURL();
}

api.interceptors.request.use(async (config: any) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
