import React, { useState } from "react";
import type { Resume } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

interface Props {
    resume: Resume;
    onChange: (updated: Resume) => void;
}

const tabs = ["About", "Education", "Skills", "Projects", "Activities"];

const ResumeEditor: React.FC<Props> = ({ resume, onChange }) => {
    const [activeTab, setActiveTab] = useState("About");

    const updateField = <K extends keyof Resume>(key: K, value: Resume[K]) => {
        onChange({ ...resume, [key]: value });
    };

    const updateNested = <T,>(path: string[], value: T) => {
        const updated = { ...resume };
        let current: any = updated;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        onChange(updated);
    };

    const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#fafafa] text-gray-800">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 text-sm font-medium bg-white sticky top-0 z-10 rounded-t-xl">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 transition-all duration-150 hover:bg-[#f5f5f5] ${activeTab === tab
                                ? "font-semibold text-gray-900 bg-[#f9f9f9]"
                                : "text-gray-500"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <AnimatePresence mode="wait">
                    {/* ABOUT */}
                    {activeTab === "About" && (
                        <motion.div
                            key="About"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="space-y-4"
                        >
                            <div className="bg-[#fcfcfc] border border-gray-200 rounded-xl p-4 space-y-4 hover:border-gray-400 transition">
                                {[
                                    { label: "Full Name", path: ["header", "name"], value: resume.header.name || "" },
                                    { label: "Phone", path: ["header", "phone"], value: resume.header.phone || "" },
                                    { label: "Email", path: ["header", "email"], value: resume.header.email || "" },
                                    { label: "GitHub URL", path: ["header", "github"], value: resume.header.github || "" },
                                ].map((f, i) => (
                                    <div key={i} className="space-y-1">
                                        <label className="block text-[.8rem] text-gray-400">
                                            {"-- " + f.label}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={f.label}
                                            value={f.value}
                                            onChange={(e) => updateNested(f.path, e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-300 outline-none text-sm"
                                        />
                                    </div>
                                ))}

                                <div className="space-y-1">
                                    <label className="block text-[.8rem] text-gray-400">-- Objective</label>
                                    <textarea
                                        placeholder="Objective (2–3 sentences)"
                                        value={resume.objective || ""}
                                        onChange={(e) => {
                                            autoResize(e);
                                            updateField("objective", e.target.value);
                                        }}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-300 outline-none resize-none overflow-hidden text-sm leading-relaxed"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* EDUCATION */}
                    {activeTab === "Education" && (
                        <motion.div
                            key="Education"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="space-y-4"
                        >
                            <button
                                onClick={() =>
                                    updateField("education", [
                                        ...(resume.education || []),
                                        { institution: "", degree: "", duration: "", score: "" },
                                    ])
                                }
                                className="text-sm px-4 py-2 rounded-lg bg-[#f4f4f4] hover:bg-[#ededed] border border-gray-200 text-gray-700"
                            >
                                + Add Education
                            </button>

                            {(resume.education || []).map((edu, i) => (
                                <motion.div
                                    key={i}
                                    layout
                                    className="relative bg-[#fcfcfc] border border-gray-200 rounded-xl p-4 space-y-2 hover:border-gray-400 transition"
                                >
                                    <button
                                        onClick={() =>
                                            updateField(
                                                "education",
                                                (resume.education || []).filter((_, idx) => idx !== i)
                                            )
                                        }
                                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { field: "institution", label: "Institution" },
                                            { field: "degree", label: "Degree" },
                                            { field: "duration", label: "Duration" },
                                            { field: "score", label: "Score / CGPA" },
                                        ].map(({ field, label }) => (
                                            <div key={field} className="space-y-1">
                                                <label className="block text-[.8rem] text-gray-400">
                                                    {"-- " + label}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={label}
                                                    value={(edu as any)[field] || ""}
                                                    onChange={(e) => {
                                                        const updated = [...(resume.education || [])];
                                                        (updated[i] as any)[field] = e.target.value;
                                                        updateField("education", updated);
                                                    }}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-300 outline-none text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* SKILLS */}
                    {activeTab === "Skills" && (
                        <motion.div
                            key="Skills"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="bg-[#fcfcfc] border border-gray-200 rounded-xl p-4 space-y-4 hover:border-gray-400 transition"
                        >
                            {["languages", "frameworks", "other"].map((field) => (
                                <div key={field} className="space-y-1">
                                    <label className="block text-[.8rem] text-gray-400">{"-- " + field}</label>
                                    <input
                                        type="text"
                                        placeholder={`Enter ${field} (comma-separated)`}
                                        value={((resume.skills as any)[field] || []).join(", ")}
                                        onChange={(e) =>
                                            updateNested(
                                                ["skills", field],
                                                e.target.value
                                                    .split(",")
                                                    .map((s) => s.trim())
                                                    .filter(Boolean)
                                            )
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-300 outline-none text-sm"
                                    />
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* PROJECTS */}
                    {activeTab === "Projects" && (
                        <motion.div
                            key="Projects"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="space-y-4"
                        >
                            <button
                                onClick={() =>
                                    updateField("projects", [
                                        ...(resume.projects || []),
                                        { title: "", duration: "", tech: "", event: "", points: [""] },
                                    ])
                                }
                                className="text-sm px-4 py-2 rounded-lg bg-[#f4f4f4] hover:bg-[#ededed] border border-gray-200 text-gray-700"
                            >
                                + Add Project
                            </button>

                            {(resume.projects || []).map((proj, i) => (
                                <motion.div
                                    key={i}
                                    layout
                                    className="bg-[#fcfcfc] border border-gray-200 rounded-xl p-4 space-y-2  hover:border-gray-400 transition relative"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { field: "title", label: "Project Title" },
                                            { field: "duration", label: "Duration" },
                                            { field: "tech", label: "Tech Stack" },
                                            { field: "event", label: "Event / Context" },
                                        ].map(({ field, label }) => (
                                            <div key={field} className="space-y-1">
                                                <label className="block text-[.8rem] text-gray-400">
                                                    {"-- " + label}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={label}
                                                    value={(proj as any)[field] || ""}
                                                    onChange={(e) => {
                                                        const updated = [...(resume.projects || [])];
                                                        (updated[i] as any)[field] = e.target.value;
                                                        updateField("projects", updated);
                                                    }}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-gray-300 outline-none text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-[.8rem] text-gray-400 mb-2">
                                            -- Key Highlights
                                        </label>

                                        {(proj.points || []).map((point, j) => (
                                            <motion.div
                                                key={j}
                                                layout
                                                className="flex items-center gap-2 mb-2 bg-gray-100 border-gray-200 border rounded-lg"
                                            >
                                                <textarea
                                                    placeholder="Achievement or feature..."
                                                    value={point || ""}
                                                    onChange={(e) => {
                                                        const updated = [...(resume.projects || [])];
                                                        updated[i].points[j] = e.target.value;
                                                        updateField("projects", updated);
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-white rounded-lg focus:ring-1 focus:ring-gray-300 outline-none resize-none overflow-hidden text-sm"
                                                    rows={2}
                                                    onInput={autoResize}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const updated = [...(resume.projects || [])];
                                                        updated[i].points = updated[i].points.filter((_, k) => k !== j);
                                                        updateField("projects", updated);
                                                    }}
                                                    className="p-2 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </motion.div>
                                        ))}
                                        <div className="flex flex-1 justify-between items-center mt-4">
                                            <button
                                                onClick={() => {
                                                    const updated = [...(resume.projects || [])];
                                                    updated[i].points.push("");
                                                    updateField("projects", updated);
                                                }}
                                                className="text-xs font-medium border border-dashed border-gray-400 p-1.5 rounded-md text-gray-400 hover:text-gray-800 hover:border-gray-800 "
                                            >
                                                + Add Point
                                            </button>
                                            <button
                                                onClick={() =>
                                                    updateField(
                                                        "projects",
                                                        (resume.projects || []).filter((_, idx) => idx !== i)
                                                    )
                                                }
                                                className="flex items-center gap-2 text-sm text-gray-200 bg-[#252525] hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition"
                                            >
                                                Delete Project
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* ACTIVITIES */}
                    {activeTab === "Activities" && (
                        <motion.div
                            key="Activities"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="space-y-4"
                        >
                            <button
                                onClick={() =>
                                    updateField("activities", [...(resume.activities || []), ""])
                                }
                                className="text-sm px-4 py-2 rounded-lg bg-[#f4f4f4] hover:bg-[#ededed] border border-gray-200 text-gray-700"
                            >
                                + Add Activity
                            </button>

                            {(resume.activities || []).map((act, i) => (
                                <motion.div
                                    key={i}
                                    layout
                                    className="flex items-center gap-2 mb-2 bg-gray-100 border-gray-200 border rounded-lg"
                                >
                                    <textarea
                                        placeholder="Extracurricular activity, responsibility, or achievement..."
                                        value={act || ""}
                                        onChange={(e) => {
                                            const updated = [...(resume.activities || [])];
                                            updated[i] = e.target.value;
                                            updateField("activities", updated);
                                        }}
                                        className="flex-1 px-3 py-2 bg-white rounded-lg focus:ring-1 focus:ring-gray-300 outline-none resize-none overflow-hidden text-sm"
                                        rows={3}
                                        onInput={autoResize}
                                    />
                                    <button
                                        onClick={() =>
                                            updateField(
                                                "activities",
                                                (resume.activities || []).filter((_, idx) => idx !== i)
                                            )
                                        }
                                        className="p-2 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ResumeEditor;
