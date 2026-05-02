const mongoose = require('mongoose');

const atsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        jobDescription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobDescription',
            required: false,
        },
        jobRole: { type: String, default: '' },
        resume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParsedResume',
            required: true,
        },

        // 🧠 Gemini AI Analysis Fields
        jdMatch: { type: String, default: '' },
        missingKeywords: [{ type: String }],
        profileSummary: { type: String, default: '' },
        technicalSkillsMatch: [{ type: String }],
        softSkillsMatch: [{ type: String }],
        experienceAlignment: { type: String, default: '' },
        improvementSuggestions: [{ type: String }],
        projectsAnalysis: { type: String, default: '' },
        overallComment: { type: String, default: '' },

        localAtsScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        topResumes: [
            {
                filename: { type: String },
                snippet: { type: String },
            },
        ],
    },
    { timestamps: true }
);

// 🔍 Index for faster lookup by user/JD
atsSchema.index({ user: 1, jobDescription: 1 });

module.exports = mongoose.model('ATS', atsSchema);
