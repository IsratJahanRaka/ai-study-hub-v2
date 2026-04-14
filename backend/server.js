const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
connectDB();


const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');
app.use('/api', (req, res, next) => {
    // Allow AI and Health routes even if DB is offline
    const isBypassRoute = req.path.startsWith('/ai') || req.path === '/health';
    
    if (!isBypassRoute && mongoose.connection.readyState !== 1) {
        return res.status(500).json({ error: 'Database Offline! Please check your MongoDB connection or click "Allow Access From Anywhere" in Atlas.' });
    }
    next();
});

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'up', message: 'Study.AI API is running beautifully!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
