"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        window.location.href = "/dashboard";
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1113] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin opacity-20" />
      </div>
    );
  }

  return <Login />;
}
