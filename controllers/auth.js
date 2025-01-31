const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/mailer");  // Haddii aad rabto inaad email dirto
const User = require("../models/User");
const Message = require("../models/Message");

const app = express();
app.use(express.json());

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return token;
};

const User = mongoose.model("User", userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// User Registration
app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });

        await newUser.save();

        const token = newUser.generateAuthToken();

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: { user: newUser, token }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Login
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { user, token }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send Message
app.post("/api/send-message", async (req, res) => {
    const { senderId, receiverId, messageContent } = req.body;

    try {
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
        res.status(500).json({ message: error.message });
    }
});

// Get Messages for User
app.get("/api/messages/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }).populate("sender receiver", "name email");

        res.status(200).json({
            success: true,
            message: "Messages retrieved successfully",
            data: messages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
