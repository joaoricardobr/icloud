import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { db } from './config/firebase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import Routes
import deviceRoutes from './routes/deviceRoutes';

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/cloud', deviceRoutes); // Professional endpoint naming

// Basic Health Check
app.get('/', (req, res) => {
    res.json({ status: 'CloudDesk Professional Backend 🚀' });
});

app.listen(PORT, () => {
    console.log(`Professional Backend listening on port ${PORT}`);
});
