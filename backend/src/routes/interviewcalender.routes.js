const express = require("express");
const InterviewCalendar = require("../models/interviewcalender.model");
const { userAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post("/add", async (req, res) => {
    const { userId, date } = req.body;
    try {
        const calendar = await InterviewCalendar.findOneAndUpdate(
            { userId },
            { $inc: { [`occurrences.${date}`]: 1 } },
            { upsert: true, new: true }
        );
        res.json(calendar);
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/activity", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const doc = await InterviewCalendar.findOne({ userId });

        if (!doc || !doc.occurrences) {
            return res.json([]);
        }

        // ✅ Convert Mongoose Map → JS object safely
        let occurrencesObj;
        if (doc.occurrences instanceof Map) {
            occurrencesObj = Object.fromEntries(doc.occurrences.entries());
        } else {
            occurrencesObj = doc.occurrences; // already plain object
        }

        // ✅ Convert object to array of { date, count }
        const formatted = Object.entries(occurrencesObj).map(([date, count]) => ({
            date,
            count: Number(count) || 0
        }));

        res.json(formatted);

    } catch (err) {
        console.error("Activity Fetch Error:\n", err);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
