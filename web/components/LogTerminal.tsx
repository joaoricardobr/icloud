"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';
import { Clipboard, Check } from 'lucide-react';
import api from '@/lib/api';

const LogTerminal = () => {
    const [logs, setLogs] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        try {
            // This endpoint needs to be created in the backend
            const response = await api.get('/logs'); 
            setLogs(response.data.logs);
        } catch (error) {
            setLogs('Error fetching logs. Is the backend endpoint ready?');
        }
    };

    useEffect(() => {
        fetchLogs();
        // Optional: Poll for new logs every few seconds
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Scroll to bottom
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const handleCopy = () => {
        navigator.clipboard.writeText(logs);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div variants={staggerItem} className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden h-96 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <h3 className="text-sm font-bold text-gray-300">Backend Logs</h3>
                <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors">
                    {copied ? <Check size={18} /> : <Clipboard size={18} />}
                </button>
            </div>
            <div ref={terminalRef} className="p-4 text-sm text-green-400 font-mono overflow-y-auto flex-1 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                {logs || "Loading logs..."}
            </div>
        </motion.div>
    );
};

export default LogTerminal;
