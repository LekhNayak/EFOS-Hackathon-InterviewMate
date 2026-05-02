const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");
const { createResume, getAllResumes, deleteResume } = require("../handlers/parser.handler");
const ParsedResume = require("../models/parser.model");
const { userAuth } = require('../middleware/auth.middleware');
const { uploadBuffer } = require('../config/cloudinary');

require("dotenv").config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
router.post("/create", userAuth, createResume);
router.get("/all", userAuth, getAllResumes);
router.delete("/delete/:id", userAuth, deleteResume);


router.put("/update/:id", userAuth, async (req, res) => {
  console.log("🔄 Update Resume ID:", req.params.id);

  try {
    const updatedResume = await ParsedResume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedResume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    console.log("✅ Resume updated:", updatedResume);
    res.json({ success: true, updatedResume });

  } catch (error) {
    console.error("❌ Error updating resume:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/parse", userAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, error: "No file uploaded" });

    const safePublicId = `${Date.now()}_${req.file.originalname.replace(/\.[^.]+$/, '').replace(/\s+/g, '_')}`;
    const pdfUrl = await uploadBuffer(req.file.buffer, 'resumes', safePublicId);

    console.log("✅ File uploaded to Cloudinary:", pdfUrl);

    const pdfData = await pdfParse(req.file.buffer);
    console.log("📑 PDF Text Length:", pdfData.text.length);
    const text = pdfData.text;
    console.log("✅ Successfully extracted text from PDF");

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an AI Resume Parser. Always respond with valid JSON only — no markdown fences, no explanation outside the JSON.",
        },
        {
          role: "user",
          content: `Extract structured resume data from the following text and return a valid JSON object strictly matching this TypeScript interface:

interface Resume {
  title: string;
  header: { name: string; phone: string; email: string; github: string };
  objective: string;
  education: Array<{ institution: string; degree: string; duration: string; score: string; }>;
  skills: { languages: string[]; frameworks: string[]; other: string[]; };
  projects: Array<{ title: string; duration: string; tech: string; event: string; points: string[]; }>;
  activities: string[];
}

If any field is missing in the resume text, leave it empty.
Text:
${text}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });
    const responseText = completion.choices[0].message.content.trim();
    let parsedResume;
    try {
      parsedResume = JSON.parse(responseText);
    } catch {
      parsedResume = JSON.parse(responseText.match(/{[\s\S]*}/)?.[0] || "{}");
    }

    parsedResume.userId = req.user._id;
    parsedResume.title = req.body.title || "Imported Resume";
    parsedResume.pdfUrl = pdfUrl;

    req.body = parsedResume;
    console.log("📄 Final Parsed Resume to Save:", parsedResume);
    await createResume(req, res);

  } catch (error) {
    console.error("❌ Error parsing resume:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});



module.exports = router;
