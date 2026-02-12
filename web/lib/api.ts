import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "https://cadillac-editions-transaction-plymouth.trycloudflare.com/api/cloud",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(async (config: any) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
