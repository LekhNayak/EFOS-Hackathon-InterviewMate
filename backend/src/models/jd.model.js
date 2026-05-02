const mongoose = require('mongoose');
const validator = require('validator');

const jdSchema = new mongoose.Schema({
    url: {
        type: String,
        trim: true,
        validate: {
            validator: (v) => validator.isURL(v, { require_protocol: true }),
            message: 'Please provide a valid URL'
        }
    },
    title: {
        type: String,
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    company: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    location: {
        type: String,
        trim: true,
        default: 'Not specified'
    },
    description: {
        type: String,
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [5000, 'Description is too long']
    },
    requiredSkills: {
        type: [String],
        trim: true,
        lowercase: true,
        index: true
    },
    jobType: {
        type: String,
        enum: ['Remote', 'Hybrid', 'On-site'],
        default: 'On-site'
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('JobDescription', jdSchema);
