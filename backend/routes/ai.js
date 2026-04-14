const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Unified Proxy for AI requests
router.post('/chat', auth, async (req, res) => {
    try {
        let { messages, model, provider } = req.body;
        let apiKey = '';
        let url = 'https://api.openai.com/v1/chat/completions';

        if (!provider) {
            if (model.includes('/')) provider = 'openrouter';
            else provider = 'openai';
        }

        if (provider === 'openrouter') {
            apiKey = process.env.OPENROUTER_API_KEY;
            url = 'https://openrouter.ai/api/v1/chat/completions';
        } else {
            apiKey = process.env.OPENAI_API_KEY;
            url = 'https://api.openai.com/v1/chat/completions';
        }

        if (!apiKey) {
            return res.status(500).json({ error: `Cloud API Key for ${provider} not configured on server.` });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:5000',
                'X-Title': 'Study.AI Pro Cloud'
            },
            body: JSON.stringify({
                model: model || 'gpt-4o-mini',
                messages: messages
            })
        });

        const data = await response.json();
        // Forward the exact status code from the AI provider
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/process', auth, async (req, res) => {
    try {
        let { prompt, content, type, model, provider } = req.body;
        let apiKey = '';
        let url = 'https://api.openai.com/v1/chat/completions';

        if (!provider) {
            if (model.includes('/')) provider = 'openrouter';
            else provider = 'openai';
        }

        if (provider === 'openrouter') {
            apiKey = process.env.OPENROUTER_API_KEY;
            url = 'https://openrouter.ai/api/v1/chat/completions';
        } else {
            apiKey = process.env.OPENAI_API_KEY;
            url = 'https://api.openai.com/v1/chat/completions';
        }

        if (!apiKey) {
            return res.status(500).json({ error: `Cloud API Key for ${provider} not configured on server.` });
        }

        let payloadMessages = [];
        if (type === 'image' && content.startsWith('data:')) {
            payloadMessages.push({
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: content } }
                ]
            });
        } else {
            payloadMessages.push({
                role: "user",
                content: `INSTRUCTION: ${prompt}\n\ndocument context: ${content}`
            });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:5000',
                'X-Title': 'Study.AI Pro Cloud'
            },
            body: JSON.stringify({
                model: model || 'gpt-4o-mini',
                messages: payloadMessages
            })
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
