const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    media_url: { type: String },
    media_type: { type: String, enum: ['none', 'photo', 'video'], default: 'none' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
module.exports = mongoose.model('Post', postSchema);
