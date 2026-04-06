const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User_Account",
        required: true
    },

    // 🔥 Message content
    text: {
        type: String,
        default: ""
    },

    image: {
        type: String, // cloudinary URL
        default: null
    },

    // 🔥 Message status
    seen: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);