const messageSchema = require("../modal/message.schema");
const chatSchema = require('../modal/chat.schema');
const cloudinary = require('../config/cloudinary')
const fs = require('fs')


const create_chat = async (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.user.userId;
    try {
        // 🔍 check if chat already exists
        let chat = await chatSchema.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        // 🆕 if not → create
        if (!chat) {
            chat = await chatSchema.create({
                participants: [senderId, receiverId]
            });
        }

        res.status(200).json({ chat });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}


const messagess = async (req, res) => {
    try {
        const { chatId } = req.params;
        const message = await messageSchema.find({ chatId }).sort({ createdAt: 1 });
        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({
            message: "Server Error"
        });
    }
}


const sendMessage = async (req, res) => {
    try {
        const { chatId, text, receiverId } = req.body;
        const senderId = req.user.userId;

        let imageUrl = null;
        if (req.file) {
            const cloudinary_response = await cloudinary.uploader.upload(req.file.path, {
                folder: "instagram_chats"
            });
            imageUrl = cloudinary_response.secure_url;
            fs.unlinkSync(req.file.path);
        }

        const newMessage = await messageSchema.create({
            chatId,
            senderId,
            text: text || "",
            image: imageUrl
        });

        // 🔥 SOCKET PART
        const io = req.app.get("io");
        const users = req.app.get("users");

        const receiverSocketId = users[receiverId];

        if (receiverSocketId) {
            // 🔥 1. send actual message
            io.to(receiverSocketId).emit("receiveMessage", newMessage);

            // 🔥 2. send notification
            io.to(receiverSocketId).emit("newMessageNotification", {
                senderId,
                chatId
            });
        }

        res.status(200).json(newMessage);

    } catch (error) {
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
};


const markMessagesSeen = async (req, res) => {
    try {
        const { chatId } = req.body;
        const myId = req.user.userId; // Receiver of the unseen messages

        // Update all unseen messages in this chat ignoring my own sent ones
        const updated = await messageSchema.updateMany(
            { chatId, senderId: { $ne: myId }, seen: false },
            { $set: { seen: true } }
        );

        if (updated.modifiedCount > 0) {
            // Find the other participant to notify them
            // The sender of those unseen messages is the other person in chat
            const chat = await chatSchema.findById(chatId);
            if (chat) {
                const otherParticipantId = chat.participants.find(p => p.toString() !== myId);
                if (otherParticipantId) {
                    const io = req.app.get("io");
                    const users = req.app.get("users");
                    const socketId = users[otherParticipantId.toString()];
                    if (socketId) {
                        io.to(socketId).emit("messagesSeen", { chatId });
                    }
                }
            }
        }
        res.status(200).json({ success: true, count: updated.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: "Server Error" })
    }
};

module.exports = { create_chat, messagess, sendMessage, markMessagesSeen }