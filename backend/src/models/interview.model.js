const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['Technical', 'Behavioral', 'Hybrid'],
        required: true,
    },
    interviewType: { type: String, default: '' },  // raw value: hr, dsa, technical_role, etc.
    role:     { type: String, default: '' },
    company:  { type: String, default: '' },
    level:    { type: String, default: '' },
    duration: { type: String, default: '' },
    jdId: {
        type: mongoose.Types.ObjectId,
        ref: 'JobDescription',
        required: false,
    },
    resumeId: {
        type: mongoose.Types.ObjectId,
        ref: 'ParsedResume',
        required: false,
    },
    video: { type: String, default: '' },
    transcript: [
        {
            question: { type: String, trim: true },
            answer:   { type: String, trim: true },
        }
    ],
    feedback: {
        overall_rating:         { type: String, default: '' },
        summary:                { type: String, default: '' },
        strengths:              [{ type: String }],
        areas_for_improvement:  [{ type: String }],
        recommended_next_steps: [{ type: String }],
    },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
