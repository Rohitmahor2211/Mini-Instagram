const userSchema = require('../modal/user.schema')
const chatSchema = require('../modal/chat.schema')
const messageSchema = require('../modal/message.schema')
const mongoose = require('mongoose')

const dashboard = async (req, res) => {
    const userId = req.user.userId;

    try {
        const response = await userSchema.find({
            _id: { $ne: userId },
        }).select("profileName profilePic").lean();

        if (!response) {
            return res.status(404).json({
                message: "no users"
            })
        }

        const myChats = await chatSchema.find({ participants: userId });
        const chatIds = myChats.map(c => c._id);

        const unreadCounts = await messageSchema.aggregate([
            { 
                $match: { 
                    chatId: { $in: chatIds }, 
                    senderId: { $ne: new mongoose.Types.ObjectId(userId) }, 
                    seen: false 
                } 
            },
            { $group: { _id: "$senderId", count: { $sum: 1 } } }
        ]);

        const unreadMap = {};
        unreadCounts.forEach(item => {
            unreadMap[item._id.toString()] = item.count;
        });

        const usersWithCounts = response.map(user => ({
            ...user,
            unreadCount: unreadMap[user._id.toString()] || 0
        }));

        return res.status(200).json({
            message: "all users send to client..!",
            response: usersWithCounts
        })
    } catch (error) {
        res.status(500).json({
            message: "server Error",
            error: error.message
        })
    }
}

const searchUsers = async (req, res) => {
    const userId = req.user.userId;
    const { q } = req.query;

    try {
        if (!q || !q.trim()) {
            return res.status(200).json({ results: [] });
        }

        const results = await userSchema.find({
            _id: { $ne: userId },
            profileName: { $regex: q.trim(), $options: 'i' }
        }).select("profileName profilePic").lean();

        return res.status(200).json({ results });
    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
}

module.exports = { dashboard, searchUsers }