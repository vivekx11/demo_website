require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend client
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} (IP: ${req.ip})`);
  next();
});

// Serve static stickers assets (mocked thumbnails) - we'll create a folder for this if needed
app.use('/stickers', express.static(path.join(__dirname, 'public', 'stickers')));

// Mount main API router
app.use('/api', apiRoutes);

// Root index handler to prevent 'Cannot GET /' display
app.get('/', (req, res) => {
  res.json({
    message: 'Sumity Devotional Store API Server Running (समीति स्टोर सर्वर क्रियाशील है)',
    status: 'healthy',
    documentation: 'See walkthrough.md for details',
    healthCheck: '/health',
    endpoints: {
      products: '/api/products'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    database: db.isMongoose ? 'MongoDB' : 'Local File DB'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'सर्वर में गड़बड़ी हुई / Internal Server Error',
    message_en: 'Internal Server Error'
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`=====================================================`);
  console.log(`SUMITY DEVOTIONAL STORE SERVER RUNNING ON PORT ${PORT}`);
  console.log(`Mode: ${process.env.MONGODB_URI ? 'MongoDB Connection' : 'JSON DB Fallback'}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`=====================================================`);
});
