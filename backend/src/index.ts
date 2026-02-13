import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { db } from './config/firebase';
import fs from 'fs';
import path from 'path';

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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import Routes
import deviceRoutes from './routes/deviceRoutes';

// 1. CORS Middleware (Must be BEFORE other middleware)
app.use(cors({
    origin: true, // Echoes back the requesting origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());

// 2. Logging and other middleware
app.use((req, res, next) => {
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Routes
app.use('/api/cloud', deviceRoutes); // Professional endpoint naming

// Basic Health Check
app.get('/', (req, res) => {
    res.json({ status: 'CloudDesk Professional Backend 🚀' });
});

app.listen(PORT, () => {
    console.log(`Professional Backend listening on port ${PORT}`);
});
