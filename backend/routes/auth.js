const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

        const user = new User({ name, email, phone, password: hashedPassword, avatar });
        await user.save();

        res.status(201).json({ message: 'User registered successfully!', userId: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        const userObj = user.toObject();
        delete userObj.password;
        userObj.id = userObj._id;
        
        res.json({ message: 'Logged in successfully', token, user: userObj });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let user = await User.findOne({ email });
        
        if (!user) {
            const tempPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            user = new User({ name, email, password: hashedPassword, avatar: picture, role: 'student' });
            await user.save();
        } else {
            user.avatar = picture;
            await user.save();
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        const userObj = user.toObject();
        delete userObj.password;
        userObj.id = userObj._id;
        
        res.json({ message: 'Google logged in successfully', token, user: userObj });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
