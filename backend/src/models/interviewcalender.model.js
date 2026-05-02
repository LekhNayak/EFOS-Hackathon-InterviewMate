const mongoose = require("mongoose");

const interviewCalendarSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    occurrences: {
        type: Map,
        of: Number,
        default: {}
    }
});

module.exports = mongoose.model("InterviewCalendar", interviewCalendarSchema);
