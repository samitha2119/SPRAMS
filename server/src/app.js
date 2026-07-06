require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Validate environment variables before startup
validateEnv();

// Routes
const routes = require('./routes');

const app = express();

// Connect to MongoDB
connectDB();

// Security headers — never force HTTPS upgrade (breaks http://localhost development)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'upgrade-insecure-requests': null,
            'object-src': ["'self'"],
            'frame-ancestors': [
                "'self'",
                process.env.CLIENT_URL || 'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:5173',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
                'http://127.0.0.1:5173'
            ],
        },
    },
    hsts: process.env.NODE_ENV === 'production',
    frameguard: false, // Disable X-Frame-Options: SAMEORIGIN to allow PDF preview in iframe
}));

// Apply strict sandboxing CSP for file serving endpoints to allow inline PDF/media viewing while disabling HTML/SVG script execution
app.use('/api/v1/files', (req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.removeHeader('X-Content-Security-Policy');
    res.removeHeader('X-WebKit-CSP');
    next();
});

// CORS — allow local dev ports (Vite may use 3000, 3001, 5173, etc.)
const corsOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// More strict rate limit for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/v1/auth', authLimiter);

// Body parsers — set large limit for file uploads
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// API Routes - Version 1
app.use('/api/v1', routes);

const mongoose = require('mongoose');

// Health check (at root api level)
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        success: true,
        status: dbStatus === 'connected' ? 'UP' : 'DOWN',
        database: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Serve React frontend build (same origin as API — fixes data not loading when proxy is unavailable)
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (req, res, next) => {
        if (req.method !== 'GET') return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// API 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

// app.listen moved to server.js for production/testing separation

module.exports = app;
