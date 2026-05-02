import React, { useEffect, useState } from "react";
interface TimelineEvent {
    id: string;
    title: string;
    description: string;
}

interface CareerTimelineProps {
    events?: TimelineEvent[];
    title?: string;
    subtitle?: string;
}

const CareerTimeline: React.FC<CareerTimelineProps> = ({
    events,
    title = "Powerful Tools for Career Success",
    subtitle = "Everything you need to prepare for interviews and land your dream job",
}) => {
    const sample: TimelineEvent[] = [
        {
            id: "resume-analyzer",
            title: "Resume Analyzer",
            description:
                "Upload or paste resumes; parses fields, extracts skills/experience and produces structured JSON and suggestions.",
        },
        {
            id: "jd-comparator",
            title: "JD Comparator",
            description:
                "Compare resume parsed data with JD and highlight gaps/opportunities.",
        },
        {
            id: "ats-score",
            title: "ATS Score Generator",
            description:
                "Compute an ATS-style match score and give actionable rewrite suggestions to improve match.",
        },
        {
            id: "interview-scheduling",
            title: "Interview Scheduling",
            description:
                "Calendar booking, time-zone aware reminders and interview session creation.",
        },
        {
            id: "mock-interview",
            title: "Mock Interview & Scoring",
            description:
                "LLM-powered mock interviews, transcript capture, scorer and AI feedback for improvement.",
        },
    ];

    const items = events && events.length > 0 ? events : sample;
    const [activeIndex, setActiveIndex] = useState(0);

    // Animated loop with delay
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % items.length);
        }, 3000); // change every 2 seconds
        return () => clearInterval(interval);
    }, [items.length]);

    const benefits = [
        "AI-powered insights to boost your interview readiness",
        "End-to-end preparation — from resume to mock interview",
        "Personalized improvement feedback using LLMs",
        "Smart ATS compatibility and resume optimization",
        "Automated scheduling with reminders and calendar sync",
    ];

    return (
        <section className="w-full py-20 px-6 ">
            {/* Header */}
            <div className="text-center mb-24">
                <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    {title}
                </h2>
                <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
                    {subtitle}
                </p>
            </div>

            {/* Timeline */}
            <div className="relative w-full max-w-6xl mx-auto flex justify-between items-start gap-10">
                {/* Line */}
                <div className="absolute top-[20px] left-0 right-0 border-t-4 border-dashed border-gray-300 z-0 mx-auto w-[85%]" />

                {items.map((it, index) => (
                    <div
                        key={it.id}
                        className="relative flex flex-col items-center text-center w-full z-10 transition-all duration-700"
                    >
                        {/* Circle */}
                        <div
                            className={`w-10 h-10 rounded-full mb-8 transition-colors duration-700 ${index === activeIndex ? "bg-[#252525]" : "bg-gray-300"
                                }`}
                        />

                        {/* Text */}
                        <div
                            className={`transition-all duration-700 ease-out transform ${index === activeIndex
                                ? "scale-110 opacity-100"
                                : "scale-95 opacity-60"
                                }`}
                        >
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                {it.title}
                            </h4>
                            <p className="text-sm text-gray-500 max-w-[230px] leading-snug">
                                {it.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <section
                className="container mx-auto mt-24 rounded-[32px] px-6 md:px-16 py-10"
            >
                <div className="w-full">
                    <h2 className="text-3xl md:text-5xl text-center font-extrabold mb-16">
                        Why Choose <span>InterviewMate AI?</span>
                    </h2>


                    {/* Horizontal row of modern cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 ">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="flex flex-col justify-between p-8 pb-16 rounded-2xl  overflow-hidden bg-white/80 backdrop-blur-2xl  hover:scale-[1.03] hover: transition-all duration-300 relative"
                            >
                                {/* Top label */}
                                <span className="text-s z-10 font-medium text-gray-500 ">
                                    {benefit}
                                </span>

                                {/* Main number */}
                                <h3 className="text-[8rem] font-semibold text-[#252525] -bottom-20 absolute">
                                    0{index + 1}
                                </h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </section >
    );
};

export default CareerTimeline;
