"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Setup file logging
const logDirectory = path_1.default.join(__dirname, '..', 'logs');
if (!fs_1.default.existsSync(logDirectory)) {
    fs_1.default.mkdirSync(logDirectory);
}
const logStream = fs_1.default.createWriteStream(path_1.default.join(logDirectory, 'backend.log'), { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = function (message, ...optionalParams) {
    const logMessage = `[LOG] [${new Date().toISOString()}] ${message} ${optionalParams.join(' ')}\n`;
    logStream.write(logMessage);
    originalConsoleLog.apply(console, [message, ...optionalParams]);
};
console.error = function (message, ...optionalParams) {
    const errorMessage = `[ERROR] [${new Date().toISOString()}] ${message} ${optionalParams.join(' ')}\n`;
    logStream.write(errorMessage);
    originalConsoleError.apply(console, [message, ...optionalParams]);
};
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Import Routes
const deviceRoutes_1 = __importDefault(require("./routes/deviceRoutes"));
// Middleware
app.use((req, res, next) => {
    console.log('Incoming request headers:', req.headers);
    next();
});
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
}));
const allowedOrigins = [
    'https://icloudbr.vercel.app',
    'https://clouddesk-iota.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('.trycloudflare.com')) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express_1.default.json());
// Request Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});
// Routes
app.use('/api/cloud', deviceRoutes_1.default); // Professional endpoint naming
// Basic Health Check
app.get('/', (req, res) => {
    res.json({ status: 'CloudDesk Professional Backend 🚀' });
});
app.listen(PORT, () => {
    console.log(`Professional Backend listening on port ${PORT}`);
});
