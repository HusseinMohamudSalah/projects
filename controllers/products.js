const User = require("../models/User");
const Message = require("../models/Message");

// Get all users
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find({});

        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// Create a new user
exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Update user information
exports.updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Delete a user
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Send a message from one user to another
exports.sendMessage = async (req, res, next) => {
    try {
        const { senderId, receiverId, messageContent } = req.body;

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            message: messageContent
        });

        await message.save();

        res.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: message
        });
    } catch (error) {
        next(error);
    }
};

// Get messages between two users
exports.getMessages = async (req, res, next) => {
    const { userId1, userId2 } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        }).populate("sender receiver", "name email");

        res.status(200).json({
            success: true,
            message: "Messages retrieved successfully",
            data: messages
        });
    } catch (error) {
        next(error);
    }
};
