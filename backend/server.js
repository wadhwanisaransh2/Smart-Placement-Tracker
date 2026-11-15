require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Allowed origins: local dev + production Vercel URL
const allowedOrigins = [
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/$/, '')) : [])
].filter(Boolean);

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.includes(origin) ||
            allowedOrigins.includes(origin.replace(/\/$/, '')) ||
            origin.endsWith('.vercel.app') ||
            origin.includes('localhost') ||
            process.env.NODE_ENV !== 'production'
        ) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS: ' + origin));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB is connected for serverless invocations
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Database connection error in request handler:', err.message);
        res.status(500).json({ message: 'Database connection error' });
    }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students')); // Student profile analysis
app.use('/api/companies', require('./routes/companies'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/analytics', require('./routes/analytics')); // DSA-powered smart analytics
app.use('/api/resume', require('./routes/resume')); // Resume upload/download

// Serve uploaded files
const path = require('path');
const uploadsStaticDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsStaticDir));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Placement Tracker API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    // Get local IP address for network access
    const os = require('os');
    const getLocalIP = () => {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return 'localhost';
    };

    const localIP = getLocalIP();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n========================================`);
        console.log(`  PLACEMENT TRACKER API SERVER`);
        console.log(`========================================`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`\nAccess URLs:`);
        console.log(`  Local:   http://localhost:${PORT}`);
        console.log(`  Network: http://${localIP}:${PORT}`);
        console.log(`\nAPI Health: http://localhost:${PORT}/api/health`);
        console.log(`========================================\n`);
    });
}

module.exports = app;
