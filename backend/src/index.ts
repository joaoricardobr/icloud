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

// Middleware
app.use((req, res, next) => {
    console.log('Incoming request headers:', req.headers);
    next();
});

app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
}));

const allowedOrigins = [
    'https://icloudbr.vercel.app',
    'https://clouddesk-iota.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const domainAllowed = allowedOrigins.indexOf(origin) !== -1 || origin.includes('.trycloudflare.com');

        if (domainAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}. Path: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'baggage', 'sentry-trace'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());

// Request Logging
app.use((req, res, next) => {
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
