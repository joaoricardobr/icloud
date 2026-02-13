import axios from "axios";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Cache Buster: 2026-02-13T12:58:00Z - Dynamic API Discovery
const DEFAULT_API_URL = "https://judicial-they-developers-repeat.trycloudflare.com/api/cloud";

const api = axios.create({
    baseURL: DEFAULT_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Dynamic BaseURL Discovery
const updateBaseURL = async () => {
    try {
        const configDoc = await getDoc(doc(db, "settings", "api_config"));
        if (configDoc.exists()) {
            const data = configDoc.data();
            if (data.baseUrl) {
                api.defaults.baseURL = data.baseUrl;
                console.log("📡 CloudDesk API URL dinâmica carregada:", api.defaults.baseURL);
            }
        }
    } catch (err) {
        console.warn("⚠️ Falha ao carregar URL dinâmica, usando padrão:", api.defaults.baseURL);
    }
};

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
