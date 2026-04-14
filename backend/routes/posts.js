const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user_id', 'name avatar')
            .sort({ created_at: -1 });

        const formattedPosts = posts.map(p => ({
            id: p._id,
            content: p.content,
            media_url: p.media_url,
            media_type: p.media_type,
            created_at: p.created_at,
            name: p.user_id ? p.user_id.name : 'Unknown',
            avatar: p.user_id ? p.user_id.avatar : ''
        }));

        res.json(formattedPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { content, media_url, media_type } = req.body;
        const post = new Post({
            user_id: req.user.id,
            content,
            media_url: media_url || null,
            media_type: media_type || 'none'
        });
        await post.save();
        res.status(201).json({ message: 'Post created', postId: post._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
