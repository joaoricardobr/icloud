import axios from "axios";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Cache Buster: Dynamic API Discovery
const api = axios.create({
    baseURL: "", // Starts empty
    headers: {
        "Content-Type": "application/json",
    },
});

// Dynamic BaseURL Discovery
const updateBaseURL = async (retryCount = 0) => {
    // Priority 1: If we are on localhost, try the local backend first
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        api.defaults.baseURL = "http://localhost:3001/api/cloud";
        console.log("🏠 Localhost/127.0.0.1 detectado. Usando backend local:", api.defaults.baseURL);
        return;
    }

    try {
        console.log("🔍 Tentando carregar URL dinâmica do Firestore (tentativa " + (retryCount + 1) + ")...");
        const configDoc = await getDoc(doc(db, "settings", "api_config"));

        if (configDoc.exists()) {
            const data = configDoc.data();
            if (data.baseUrl) {
                let url = data.baseUrl;
                if (url.endsWith('/')) url = url.slice(0, -1); // Remove trailing slash
                api.defaults.baseURL = url;
                console.log("✅ CloudDesk API URL dinâmica carregada do Firestore:", api.defaults.baseURL);
                return;
            }
        } else {
            console.warn("ℹ️ Documento 'settings/api_config' não encontrado no Firestore.");
        }
    } catch (err: any) {
        console.error("❌ Erro ao acessar Firestore:", err.message || err);
    }

    // Retry logic
    if (retryCount < 5) {
        const timeout = Math.min(2000 * (retryCount + 1), 10000);
        console.log(`⏳ Falha ao obter URL. Tentando novamente em ${timeout / 1000} segundos...`);
        setTimeout(() => updateBaseURL(retryCount + 1), timeout);
    } else {
        console.error("❌ Falha crítica: Não foi possível obter a URL da API.");
        // Fallback final
        api.defaults.baseURL = "http://localhost:3001/api/cloud";
    }
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
