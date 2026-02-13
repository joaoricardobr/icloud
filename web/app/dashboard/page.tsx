"use client";

import Dashboard from "@/components/Dashboard";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser && !loading) {
                router.push("/");
            }
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin opacity-20" />
            </div>
        );
    }

    if (!user) return null;

    return <Dashboard />;
}
