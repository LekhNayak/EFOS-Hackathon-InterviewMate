const fs = require('fs');
const pdfParse = require('pdf-parse');
const { uploadBuffer } = require('../config/cloudinary');
const JobDescription = require('../models/jd.model');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const parseJobDescription = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const fileBuffer = req.file.buffer || fs.readFileSync(req.file.path);
        const safePublicId = `${Date.now()}_${req.file.originalname.replace(/\.[^.]+$/, '').replace(/\s+/g, '_')}`;
        const fileUrl = await uploadBuffer(fileBuffer, 'job_descriptions', safePublicId);

        console.log('✅ File uploaded to Cloudinary:', fileUrl);

        const pdfData = await pdfParse(fileBuffer);
        const text = pdfData.text;
        console.log('✅ Extracted text from Job Description PDF');

        const completion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an advanced AI Job Description Parser. Always respond with valid JSON only — no markdown fences, no explanation outside the JSON.',
                },
                {
                    role: 'user',
                    content: `Extract structured information from the following job description text and return a JSON strictly matching this TypeScript interface:

interface JobDescription {
  title: string;
  company: string;
  location: string;
  description: string;
  requiredSkills: string[];
  jobType: "Remote" | "Hybrid" | "On-site" | "";
}

Rules:
1. Leave missing fields as empty string or empty array.
2. For "description": write a clear 2–5 line professional summary of the company + role. If company info is missing, write "The company information is not fully provided, but the role requires..."
3. Do NOT hallucinate company details (employees, funding, revenue).
4. For requiredSkills: extract explicit skills; infer only when 80%+ certain.
5. jobType must be exactly "Remote", "Hybrid", "On-site", or "".

Text:
${text}`,
                },
            ],
            temperature: 0.2,
            max_tokens: 1024,
        });
        const responseText = completion.choices[0].message.content.trim();

        let parsedJd = {};
        try {
            parsedJd = JSON.parse(responseText);
        } catch {
            parsedJd = JSON.parse(responseText.match(/{[\s\S]*}/)?.[0] || '{}');
        }

        // ✅ Save to MongoDB
        const newJd = await JobDescription.create({
            url: fileUrl,
            title: parsedJd.title || 'Untitled JD',
            company: parsedJd.company || 'Unknown',
            location: parsedJd.location || 'Not specified',
            description: parsedJd.description || '',
            requiredSkills: parsedJd.requiredSkills || [],
            experienceLevel: parsedJd.experienceLevel || 'Entry',
            jobType: parsedJd.jobType || 'On-site',
            uploadedBy: req.user._id,
            isPublic: req.body.isPublic || false,
        });

        console.log('✅ JD Parsed and Saved:', newJd.title);

        res.status(201).json({
            success: true,
            message: 'Job Description parsed and uploaded successfully.',
            job: newJd,
        });
    } catch (error) {
        console.error('❌ Error parsing job description:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getAllJD = async (req, res) => {
    try {
        // 🧠 Build query
        const userId = req.user?._id;

        const query = userId
            ? { $or: [{ isPublic: true }, { uploadedBy: userId }] }
            : { isPublic: true };

        const jobs = await JobDescription.find(query)
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error('❌ Error fetching job descriptions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const getUsersJD = async (req, res) => {
    try {
        const jobs = await JobDescription.find({ uploadedBy: req.user._id })
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        console.error('❌ Error fetching jobs by user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const deleteJd = async (req, res) => {
    try {
        const job = await JobDescription.findById(req.params.id);
        if (!job)
            return res.status(404).json({ success: false, error: 'Job not found' });

        if (job.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Unauthorized action' });
        }

        await job.deleteOne();

        res.status(200).json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting job description:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const getJdAsString = async (req, res) => {
    try {
        const job = await JobDescription.findById(req.params.id).populate('uploadedBy', 'name email');

        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job Description not found',
            });
        }

        // 🧠 Allow access if JD is public or belongs to the logged-in user
        const isOwner = req.user && job.uploadedBy._id.toString() === req.user._id.toString();

        if (!job.isPublic && !isOwner) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. This job description is private.',
            });
        }

        // 📝 Combine the job data into a readable string
        const jobText = `
Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Experience Level: ${job.experienceLevel}
Job Type: ${job.jobType}
Required Skills: ${(job.requiredSkills || []).join(', ')}

Description:
${job.description || 'No description provided.'}
    `.trim();

        // 🧾 Send plain text response
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(jobText);
    } catch (error) {
        console.error('❌ Error fetching job description as string:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};


module.exports = { parseJobDescription, getAllJD, getUsersJD, deleteJd, getJdAsString };
