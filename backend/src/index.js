require("dotenv").config();
const colors = require("colors");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const { connect } = require("../src/config/db");

// Routes
const userRouter = require("../src/routes/user.routes");
const parserRouter = require("./routes/parser.routes");
const jdRouter = require("../src/routes/jd.routes");
const companyRoutes = require("../src/routes/company.routes");
const atsRouter = require('./routes/ats.routes');
const interviewRouter = require('./routes/interview.routes');
const jobRoutes = require("../src/routes/job.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:8080", "https://inter-view-mate.vercel.app"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(cookieParser());

app.use((req, res, next) => {
    console.log("Incoming:", req.method, req.url);
    next();
});

// API Routes
app.use("/api/user", userRouter);
app.use("/api/parser", parserRouter);
app.use("/api/jd", jdRouter);
app.use("/api/companies", companyRoutes);
app.use("/api/ats", atsRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/jobs", jobRoutes);
// Start server
connect()
    .then(() => {
        console.log("✅ Connected to database".cyan);
        app.listen(process.env.PORT || 5000, () => {
            console.log(`🚀 Server running on port ${process.env.PORT}`.magenta);
        });
    })
    .catch((err) => console.log("❌ Database connection failed".red, err));
