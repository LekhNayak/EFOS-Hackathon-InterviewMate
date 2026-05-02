const express = require("express");
const router = express.Router();
const axios = require("axios");
const { userAuth } = require("../middleware/auth.middleware");

// 🔥 JOB SEARCH ROUTE
router.post("/search", userAuth, async (req, res) => {
    try {
        const { role } = req.body;
        const user = req.user;

        const skills = user.skills || [];

        const query = [role, ...skills].join(" ");

        const response = await axios.get(
            "https://fresh-linkedin-scraper-api.p.rapidapi.com/api/v1/job/search",
            {
                params: {
                    keyword: query,
                    page: "1",
                    sort_by: "relevant",
                    date_posted: "past_week",
                },
                headers: {
                    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
                    "x-rapidapi-host":
                        "fresh-linkedin-scraper-api.p.rapidapi.com",
                },
            }
        );

        const jobs = response.data?.data || [];

        // 🔥 Match scoring
        const processed = jobs.map((job) => {
            const desc = (job.description || "").toLowerCase();

            let score = 0;
            const matchedSkills = [];

            skills.forEach((skill) => {
                if (desc.includes(skill.toLowerCase())) {
                    score++;
                    matchedSkills.push(skill);
                }
            });

            return {
                title: job.title,
                company: job.company?.name || "Unknown",
                location: job.location || "Remote",
                description: job.description,
                url: job.job_url,
                matchScore: skills.length
                    ? Math.round((score / skills.length) * 100)
                    : 0,
                matchedSkills,
            };
        });

        processed.sort((a, b) => b.matchScore - a.matchScore);

        res.json({ success: true, jobs: processed });

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({
            success: false,
            message: "Job fetch failed",
        });
    }
});

module.exports = router;