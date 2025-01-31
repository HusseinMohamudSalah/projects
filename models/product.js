const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId, // ID-ga user-ka diray
        ref: 'User', // Isticmaal 'User' model si loo xiro user-ka
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId, // ID-ga user-ka helay
        ref: 'User', // Isticmaal 'User' model si loo xiro user-ka
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'], // Status of the message
        default: 'sent',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;
