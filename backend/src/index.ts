import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { db } from './config/firebase';
import fs from 'fs';
import path from 'path';
import si from 'systeminformation';

// Setup file logging
const logDirectory = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}
const logStream = fs.createWriteStream(path.join(logDirectory, 'backend.log'), { flags: 'a' });

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const formatArgs = (args: any[]) => {
    return args.map(arg => {
        if (arg instanceof Error) {
            return `${arg.message}\n${arg.stack}`;
        }
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    }).join(' ');
};

console.log = function (message, ...optionalParams) {
    const formattedParams = formatArgs(optionalParams);
    const logMessage = `[LOG] [${new Date().toISOString()}] ${message} ${formattedParams}\n`;
    logStream.write(logMessage);
    originalConsoleLog.apply(console, [message, ...optionalParams]);
};

console.error = function (message, ...optionalParams) {
    const formattedParams = formatArgs(optionalParams);
    const errorMessage = `[ERROR] [${new Date().toISOString()}] ${message} ${formattedParams}\n`;
    logStream.write(errorMessage);
    originalConsoleError.apply(console, [message, ...optionalParams]);
};

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import Routes
import deviceRoutes from './routes/deviceRoutes';

// 1. CORS Middleware (Must be BEFORE other middleware)
// 1. CORS Middleware (Optimized for Vercel + Cloudflare Tunnel)
app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins that match Vercel or Cloudflare
        if (!origin || origin.includes('vercel.app') || origin.endsWith('.trycloudflare.com') || origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(null, true); // Fallback to allow for dynamic tunnels
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());

// 2. Logging and other middleware
app.use((req, res, next) => {
    // Logging middleware
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// 2. Monitoring and SSE
let clients: any[] = [];
let lastDiskCount = 0;

// SSE Endpoint for real-time updates
app.get('/api/cloud/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // res.flushHeaders(); // Optional, remove if causing issues

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });

    // Send initial ping
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
});

const notifyClients = (payload: any) => {
    clients.forEach(c => c.res.write(`data: ${JSON.stringify(payload)}\n\n`));
};

// Monitor disks every 10 seconds
setInterval(async () => {
    try {
        const disks = await si.fsSize();
        const physicalDisks = disks.filter(d =>
            (d.fs.startsWith('/dev/sd') || d.fs.startsWith('/dev/nvme')) &&
            d.mount && !d.mount.includes('/snap')
        );

        if (physicalDisks.length !== lastDiskCount) {
            console.log(`[Monitor] Disk change detected: ${lastDiskCount} -> ${physicalDisks.length}`);
            notifyClients({
                type: 'disk_change',
                count: physicalDisks.length,
                timestamp: new Date().toISOString()
            });
            lastDiskCount = physicalDisks.length;
        }
    } catch (e) {
        console.error('[Monitor] Error:', e);
    }
}, 10000);

// Routes
app.use('/api/cloud', deviceRoutes); // Professional endpoint naming

// Basic Health Check
app.get('/', (req, res) => {
    res.json({ status: 'CloudDesk Professional Backend 🚀', clients: clients.length });
});

app.listen(PORT, () => {
    console.log(`Professional Backend listening on port ${PORT}`);
});
