import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
    // Prioritize the hardcoded URL which is updated by the /sync script
    baseURL: "https://trustee-broadband-reader-complement.trycloudflare.com/api/cloud",
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
