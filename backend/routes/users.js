const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const users = await User.find({ name: new RegExp(query, 'i') })
                                .limit(10)
                                .select('name avatar role');
        
        const formatted = users.map(u => ({
            id: u._id,
            name: u.name,
            avatar: u.avatar,
            role: u.role
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
