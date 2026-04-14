const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    avatar: { type: String, default: 'default_avatar.png' },
    role: { type: String, default: 'student' }
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
