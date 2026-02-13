"use client";

import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animations";

export default function Settings() {
    return (
        <motion.div
            key="settings-component"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="pb-12"
        >
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <p className="text-slate-500">
                    Aqui você poderá gerenciar as configurações do seu sistema.
                </p>
            </div>
        </motion.div>
    );
}

