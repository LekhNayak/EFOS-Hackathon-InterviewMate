const Interview = require('../models/interview.model');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const startInterview = async (req, res) => {
    try {
        const { type, transcript, jdId, resumeId } = req.body;
        const videoFile = req.file;

        if (!type) {
            return res.status(400).json({ success: false, error: 'Interview type is required.' });
        }

        if (!videoFile) {
            return res.status(400).json({ success: false, error: 'Video file is required.' });
        }

        // 📤 Upload video to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(videoFile.path, {
            resource_type: 'video',
            folder: 'interviews',
            public_id: `${req.user._id}_${Date.now()}`,
        });

        // 🧾 Parse transcript safely
        let parsedTranscript = [];
        if (transcript) {
            try {
                parsedTranscript = Array.isArray(transcript)
                    ? transcript
                    : JSON.parse(transcript);
            } catch {
                parsedTranscript = [];
            }
        }

        const interviewData = {
            userId: req.user._id,
            type,
            video: uploadResult.secure_url,
            transcript: parsedTranscript,
        };

        if (type === 'Technical' || type === 'Hybrid') {
            if (!jdId || !resumeId) {
                return res.status(400).json({
                    success: false,
                    error: 'jdId and resumeId are required for Technical or Hybrid interviews.',
                });
            }
            interviewData.jdId = jdId;
            interviewData.resumeId = resumeId;
        }

        const newInterview = await Interview.create(interviewData);

        res.status(201).json({
            success: true,
            message: 'Interview started and video uploaded successfully.',
            interview: newInterview,
        });
    } catch (error) {
        console.error('❌ Error starting the interview:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};



const getMyInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.user._id })
            .populate('jdId', 'title company')
            .populate('resumeId', 'title pdfUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: interviews.length,
            interviews,
        });
    } catch (error) {
        console.error('❌ Error fetching user interviews:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const getByJD = async (req, res) => {
    try {
        const { jdId } = req.params;
        const interviews = await Interview.find({ jdId, userId: req.user._id })
            .populate('resumeId', 'title pdfUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: interviews.length,
            interviews,
        });
    } catch (error) {
        console.error('❌ Error fetching interviews by JD:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const getByResume = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const interviews = await Interview.find({ resumeId, userId: req.user._id })
            .populate('jdId', 'title company')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: interviews.length,
            interviews,
        });
    } catch (error) {
        console.error('❌ Error fetching interviews by resume:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};



const getByType = async (req, res) => {
    try {
        const { type } = req.params;
        const interviews = await Interview.find({
            userId: req.user._id,
            type: { $regex: new RegExp(type, 'i') }, // case-insensitive
        })
            .populate('jdId', 'title company')
            .populate('resumeId', 'title pdfUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: interviews.length,
            interviews,
        });
    } catch (error) {
        console.error('❌ Error fetching interviews by type:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const _TYPE_MAP = {
    hr:                 'Behavioral',
    technical_projects: 'Technical',
    technical_role:     'Technical',
    dsa:                'Technical',
    hybrid:             'Hybrid',
};

const saveSession = async (req, res) => {
    try {
        const { role, company, interviewType, level, duration, transcript, feedback } = req.body;
        const type = _TYPE_MAP[interviewType] || 'Technical';

        const record = await Interview.create({
            userId: req.user._id,
            type,
            interviewType: interviewType || '',
            role:     role     || '',
            company:  company  || '',
            level:    level    || '',
            duration: duration || '',
            transcript: Array.isArray(transcript) ? transcript : [],
            feedback:   feedback || {},
        });

        res.status(201).json({ success: true, interview: record });
    } catch (error) {
        console.error('❌ Error saving interview session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    startInterview,
    saveSession,
    getMyInterviews,
    getByJD,
    getByResume,
    getByType,
};
