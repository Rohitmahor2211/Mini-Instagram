const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User_Account",
            required: true
        }
    ],

    // 🔥 Last message (for chat list UI performance)
    lastMessage: {
        text: String,
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },

    // 🔥 Unread count (optional but powerful)
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }

}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);