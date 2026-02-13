"use client";

import { motion } from "framer-motion";
import { pageTransition, staggerContainer } from "@/lib/animations";
import LogTerminal from "@/components/LogTerminal";
import Settings from "@/components/Settings";

export default function SettingsPage() {
    return (
        <motion.div
            key="settings"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="pb-12 space-y-8"
        >
            <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Configurações</h2>
                <p className="text-slate-500">Gerencie as configurações do sistema e veja os logs.</p>
            </div>
            
            <Settings />

            <LogTerminal />
            
        </motion.div>
    );
}
