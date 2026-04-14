const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Post = require('./models/Post');
const Message = require('./models/Message');

const clearDB = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'ai_study_hub',
            family: 4
        });
        
        console.log("Wiping combinations...");
        await User.deleteMany({});
        await Post.deleteMany({});
        await Message.deleteMany({});
        
        console.log("Database perfectly cleared!");
        process.exit(0);
    } catch (err) {
        console.error("Failed to clear. Is your IP whitelisted? Error:", err.message);
        process.exit(1);
    }
};

clearDB();
