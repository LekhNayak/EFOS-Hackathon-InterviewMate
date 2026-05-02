import mongoose from "mongoose";
import dotenv from "dotenv";
import JobDescription from "./src/models/jd.model.js"; // IMPORTANT: .js extension required in ESM

dotenv.config();

const userId = "68f87fa1c319bb90eaf9f64f";

const pdfUrl =
    "https://firebasestorage.googleapis.com/v0/b/vesapp-e6a7d.appspot.com/o/job_descriptions%2Fsample.pdf?alt=media";

const companies = [
    { company: "Google", title: "Cloud Developer", location: "Bangalore", type: "Hybrid" },

];

async function insertData() {
    try {
        const MONGO_URL = process.env.MONGO_URI;

        await mongoose.connect(MONGO_URL);
        console.log("MongoDB Connected");

        const jdDocs = companies.map(c => ({
            url: pdfUrl,
            title: c.title,
            company: c.company,
            location: c.location,
            description: `${c.company} is hiring a ${c.title}. Work with global teams to build scalable products.`,
            requiredSkills: ["JavaScript", "Node.js", "React"],
            experienceLevel: "Entry",
            jobType: c.type,
            uploadedBy: userId,
            isPublic: true
        }));

        await JobDescription.insertMany(jdDocs);

        console.log("✅ Inserted 10 Job Descriptions Successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

insertData();
