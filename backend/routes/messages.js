const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

router.get('/:friendId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender_id: req.user.id, receiver_id: req.params.friendId },
                { sender_id: req.params.friendId, receiver_id: req.user.id }
            ]
        }).sort({ created_at: 1 });

        const formatted = messages.map(m => ({
            id: m._id,
            sender_id: m.sender_id,
            receiver_id: m.receiver_id,
            message_text: m.message_text,
            media_url: m.media_url,
            created_at: m.created_at
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { receiver_id, message_text, media_url } = req.body;
        const msg = new Message({
            sender_id: req.user.id,
            receiver_id,
            message_text,
            media_url: media_url || null
        });
        await msg.save();
        res.status(201).json({ message: 'Sent successfully', messageId: msg._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
