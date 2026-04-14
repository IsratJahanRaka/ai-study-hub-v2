const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'ai_study_hub',
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Connected successfully to cluster0...');
    } catch (err) {
        console.error('MongoDB connection error. Please ensure you have whitelisted your IP (0.0.0.0/0) in MongoDB Atlas Network Access settings! Error:', err.message);
    }
};

module.exports = connectDB;
