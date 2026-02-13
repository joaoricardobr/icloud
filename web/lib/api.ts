import axios from "axios";
import { auth } from "./firebase";
// Cache Buster: 2026-02-13T12:35:00Z - Final Fix For Routing and Trash

const api = axios.create({
    // Prioritize the hardcoded URL which is updated by the /sync script
    baseURL: "https://judicial-they-developers-repeat.trycloudflare.com/api/cloud",
    headers: {
        "Content-Type": "application/json",
    },
});

console.log("🔌 CloudDesk API conectando em:", api.defaults.baseURL);

api.interceptors.request.use(async (config: any) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
