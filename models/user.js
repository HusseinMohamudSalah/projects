const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// User Schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// Generate JWT auth token
UserSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
};

// Generate password reset token
UserSchema.methods.generateResetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

// Remove password from user object
UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
};

// Find user by credentials
UserSchema.methods.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email: new RegExp(email, 'i') });
    if (!user) {
        throw new Error('Unable to login');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login');
    }
    return user;
};

const User = mongoose.model('User', UserSchema);

// Password reset email
const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Express routes
const express = require('express');
const app = express();
app.use(express.json());

// Registration route
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = new User({ name, email, password });
        await user.save();
        const token = user.generateAuthToken();
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: { user, token }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByCredentials(email, password);
        const token = user.generateAuthToken();
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user, token }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Forget password route
app.post('/forget-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const resetToken = await user.generateResetPasswordToken();
        await sendEmail(user.email, 'Password Reset', `Click the link to reset your password: http://localhost:3000/reset-password/${resetToken}`);

        await user.save();
        res.status(200).json({
            success: true,
            message: 'Password reset link sent successfully'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Reset password route
app.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Middleware to protect routes
const guard = (req, res, next) => {
    if (req.headers?.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server error' });
        }

        const decoded = jwt.decode(token);
        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = decoded;
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

// Test protected route
app.get('/protected', guard, (req, res) => {
    res.status(200).json({ message: 'You have access to this protected route', user: req.user });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(3000, () => console.log('Server running on port 3000'));
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err.message);
    });
