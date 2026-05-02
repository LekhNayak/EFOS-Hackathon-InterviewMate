const express = require("express");
const { getAllCompanies, addCompany } = require("../handlers/company.handler");

const router = express.Router();

router.get("/", getAllCompanies);
router.post("/", addCompany);

module.exports = router;
