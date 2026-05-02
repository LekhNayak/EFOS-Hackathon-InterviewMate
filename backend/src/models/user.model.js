const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [100, 'Name must be less than 100 characters'],
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, 'Please provide a valid email'],
            index: true,
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
            select: false,
        },

        age: {
            type: Number,
            min: [10, 'Age must be at least 10'],
            max: [100, 'Age must be less than 100'],
        },

        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            trim: true,
        },

        githubUrl: {
            type: String,
            trim: true,
            validate: {
                validator: (v) => !v || validator.isURL(v, { require_protocol: true }),
                message: 'Invalid GitHub URL format',
            },
        },

        linkedinUrl: {
            type: String,
            trim: true,
            validate: {
                validator: (v) => !v || validator.isURL(v, { require_protocol: true }),
                message: 'Invalid LinkedIn URL format',
            },
        },

        codeforcesUrl: {
            type: String,
            trim: true,
            validate: {
                validator: (v) => !v || validator.isURL(v, { require_protocol: true }),
                message: 'Invalid Codeforces URL format',
            },
        },

        leetcodeUrl: {
            type: String,
            trim: true,
            validate: {
                validator: (v) => !v || validator.isURL(v, { require_protocol: true }),
                message: 'Invalid LeetCode URL format',
            },
        },

        skills: [{ type: String, trim: true, lowercase: true }],
        interests: [{ type: String, trim: true, lowercase: true }],
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getJWT = async function () {
    return jwt.sign({ _id: this._id }, process.env.SECRET_KEY, { expiresIn: '7d' });
};

module.exports = mongoose.model('User', userSchema);
