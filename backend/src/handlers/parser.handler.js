const ParsedResume = require("../models/parser.model");
console.log("ParsedResume:", ParsedResume);
const User = require("../models/user.model");

exports.createResume = async (req, res) => {
    try {
        const { ...data } = req.body;
        const parsedResume = new ParsedResume(data);
        console.log("✅ Resume created:", parsedResume);
        await parsedResume.save();

        console.log("✅ Saving Resume:", parsedResume); // <--- ADD THIS

        res.status(201).json({ success: true, resume: parsedResume });
    } catch (err) {
        console.error("Error creating resume:", err);
        res.status(500).json({ success: false, message: "Failed to create resume", error: err.message });
    }
};

// ✅ Get all resumes (for admin use)
exports.getAllResumes = async (req, res) => {
    try {
        const resumes = await ParsedResume.find();
        res.json({ success: true, resumes });
    } catch (error) {
        console.error("❌ Get All Resumes Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ Get resumes by specific userId
exports.getResumesByUser = async (req, res) => {
    try {
        const { userId } = req.user._id;
        const resumes = await ParsedResume.find({ userId });
        res.json({ success: true, resumes });
    } catch (error) {
        console.error("❌ Get Resumes By User Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ Delete a parsed resume by _id (not id)
exports.deleteResume = async (req, res) => {
    try {
        console.log("DELETE request received for:", req.params.id);
        const deleted = await ParsedResume.findByIdAndDelete(req.params.id);
        console.log("Mongoose delete result:", deleted);

        if (!deleted)
            return res.status(404).json({ success: false, message: "Resume not found" });

        res.json({ success: true, message: "Resume deleted", deleted });
    } catch (error) {
        console.error("❌ Delete Resume Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
