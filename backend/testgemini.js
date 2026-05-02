require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent("Say 'Gemini is connected successfully!'");
        console.log("✅ Gemini Response:", result.response.text());
    } catch (err) {
        console.error("❌ Gemini connection failed:", err);
    }
}

testGemini();
