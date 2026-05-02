const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: String,
    brief: String,
    type: String,
    mode: String,
    color: String,
    link: String,
    pdf: String,
});

const Company = mongoose.model("Company", companySchema);

module.exports = { Company };
