const { Company } = require("../models/company.model");

const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find();
        res.status(200).json(companies);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch companies" });
    }
};

const addCompany = async (req, res) => {
    try {
        const newCompany = new Company(req.body);
        await newCompany.save();
        res.status(201).json(newCompany);
    } catch (err) {
        res.status(400).json({ error: "Failed to add company" });
    }
};

module.exports = { getAllCompanies, addCompany };
