import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "https://canvas-lived-hide-availability.trycloudflare.com/api/cloud",
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
