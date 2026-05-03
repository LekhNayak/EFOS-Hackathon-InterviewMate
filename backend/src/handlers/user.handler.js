const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const sendEmail = require('../config/mailer');
const { validateSignUpData } = require('../utils/validate');
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const requestOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ message: "Email is required" });

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.findOneAndUpdate({ email }, { otp, createdAt: new Date() }, { upsert: true });

        await sendEmail(email, "Your OTP for Resume Parser Signup", `Your OTP is: ${otp}`);

        res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (error) {
        console.error("OTP Request Error:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
};

const signup = async (req, res) => {
    console.log("Signup Body:", req.body);
    try {
        const { name, email, password, otp } = req.body;

        validateSignUpData(req);

        const validOtp = await OTP.findOne({ email });
        if (!validOtp || validOtp.otp !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        await OTP.deleteOne({ email });

        const newUser = new User({ name, email, password });
        await newUser.save();

        const token = await newUser.getJWT();

        // ✅ Store JWT inside httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // works locally too
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email
            },
        });
    } catch (error) {
        console.error("Signup Error:", error);

        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Password is incorrect',
            });
        }

        const token = await user.getJWT();
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};


const profile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};



const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            name,
            age,
            gender,
            skills,
            interests,
            githubUrl,
            linkedinUrl,
            codeforcesUrl,
            leetcodeUrl,
        } = req.body;

        // ✅ Prepare allowed fields dynamically
        const allowedUpdates = {};
        if (name) allowedUpdates.name = name;
        if (age) allowedUpdates.age = age;
        if (gender) allowedUpdates.gender = gender;
        if (skills) allowedUpdates.skills = skills;
        if (interests) allowedUpdates.interests = interests;
        if (githubUrl) allowedUpdates.githubUrl = githubUrl;
        if (linkedinUrl) allowedUpdates.linkedinUrl = linkedinUrl;
        if (codeforcesUrl) allowedUpdates.codeforcesUrl = codeforcesUrl;
        if (leetcodeUrl) allowedUpdates.leetcodeUrl = leetcodeUrl;

        if (Object.keys(allowedUpdates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update.",
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: allowedUpdates },
            { new: true, runValidators: true, context: "query" }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                age: updatedUser.age,
                gender: updatedUser.gender,
                skills: updatedUser.skills,
                interests: updatedUser.interests,
                githubUrl: updatedUser.githubUrl,
                linkedinUrl: updatedUser.linkedinUrl,
                codeforcesUrl: updatedUser.codeforcesUrl,
                leetcodeUrl: updatedUser.leetcodeUrl,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
            },
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser)
            return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select("+password");
        console.log(user);

        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.comparePassword(currentPassword))
            return res.status(400).json({ message: "Current password incorrect" });

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    signup,
    login,
    profile,
    updateProfile,
    requestOtp,
    logout,
    deleteUser,
    changePassword
};
