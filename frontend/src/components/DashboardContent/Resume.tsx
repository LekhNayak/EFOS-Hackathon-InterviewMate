import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";

interface Note {
    id: number;
    text: string;
}

interface Resume {
    id: number;
    title: string;
    description: string;
    details: string;
    preview: string;
    notes: Note[];
}

export default function ResumePage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [newNote, setNewNote] = useState("");
    const [resumes, setResumes] = useState<Resume[]>([
        {
            id: 1,
            title: "Frontend Developer Resume",
            description: "React, TypeScript, TailwindCSS",
            details:
                "Skilled in building modular UI, design systems, and responsive web apps.",
            preview: "/resumes/frontend.pdf",
            notes: [
                { id: 1, text: "Highlight UI projects with live demos." },
                { id: 2, text: "Add certifications in front-end tech." },
            ],
        },
        {
            id: 2,
            title: "Backend Developer Resume",
            description: "Node.js, Express, PostgreSQL",
            details:
                "Focuses on scalable APIs, cloud deployment, and security best practices.",
            preview: "/resumes/backend.pdf",
            notes: [
                { id: 1, text: "Add experience with microservices and caching." },
                { id: 2, text: "Mention AWS deployment experience." },
            ],
        },
        {
            id: 3,
            title: "Data Engineer Resume",
            description: "ETL, Airflow, BigQuery",
            details:
                "Strong in data pipelines, distributed systems, and data governance.",
            preview: "/resumes/data.pdf",
            notes: [{ id: 1, text: "Include recent data processing project." }],
        },
    ]);

    const handlePrev = () =>
        setCurrentIndex((prev) => (prev === 0 ? resumes.length - 1 : prev - 1));

    const handleNext = () =>
        setCurrentIndex((prev) => (prev === resumes.length - 1 ? 0 : prev + 1));

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        setResumes((prev) =>
            prev.map((r, i) =>
                i === currentIndex
                    ? {
                        ...r,
                        notes: [...r.notes, { id: r.notes.length + 1, text: newNote }],
                    }
                    : r
            )
        );
        setNewNote("");
    };

    const currentResume = resumes[currentIndex];

    const colors = [
        "bg-[#E8F0FE]",
        "bg-[#E6F4EA]",
        "bg-[#FEF7E0]",
        "bg-[#FCE8E6]",
        "bg-[#F3E8FD]",
    ];

    return (
        <main className="flex bg-white gap-4 p-2 h-screen">
            {/* LEFT SECTION — PDF Preview */}
            <div
                className="w-[56%] relative flex flex-col rounded-xl bg-[#f9fafb] border border-gray-200 overflow-hidden"
                style={{ height: "calc(100vh - 1rem)" }}
            >
                <Button
                    size="icon"
                    onClick={handlePrev}
                    className="absolute left-1 top-1/2 z-10 bg-white/60 backdrop-blur-sm rounded-full border border-[#d5d5d5] text-gray-600 hover:bg-gray-100"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                        {currentResume.title}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FileText className="w-4 h-4" />
                        Preview
                    </div>
                    <Button
                        size="icon"
                        onClick={handleNext}
                        className="absolute right-2 z-10 top-1/2 bg-white/60 backdrop-blur-sm rounded-full border border-[#d5d5d5] text-gray-600 hover:bg-gray-100"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 flex justify-center items-center bg-gray-50">
                    <div className="relative w-[94%] aspect-[1/1.414] bg-white shadow-md overflow-hidden flex justify-center items-center">
                        {currentResume.preview.endsWith(".pdf") ? (
                            <iframe
                                src={`${currentResume.preview}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-full border-0"
                                title="Resume Preview"
                            ></iframe>
                        ) : (
                            <img
                                src={currentResume.preview}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION — Resume Titles & Notes */}
            <div
                className="w-1/3 relative flex flex-col rounded-xl border border-gray-200 bg-[#fafafa] overflow-hidden"
                style={{ height: "calc(100vh - 1rem)" }}
            >
                {/* Resume Titles */}
                <div className="p-4 space-y-2 overflow-y-auto border-b border-gray-200" style={{ flex: "1" }}>
                    {resumes.map((resume, index) => {
                        const isActive = index === currentIndex;
                        return (
                            <div
                                key={resume.id}
                                onClick={() => setCurrentIndex(index)}
                                className={`p-3 rounded-xl text-sm font-medium cursor-pointer transition-all ${isActive
                                    ? "bg-blue-100 border border-blue-300 text-blue-800"
                                    : `${colors[index % colors.length]} border border-transparent text-gray-700 hover:border-gray-300`
                                    }`}
                            >
                                {resume.title}
                            </div>
                        );
                    })}
                </div>

                {/* Notes Section */}
                <div
                    className="bg-white p-4 flex flex-col"
                    style={{ flex: "1", overflowY: "auto" }}
                >
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Notes for: {currentResume.title}
                    </h3>

                    <ul className="space-y-2 text-sm flex-1 overflow-y-auto">
                        {currentResume.notes.map((note, i) => (
                            <li
                                key={note.id}
                                className={`flex items-start gap-2 ${colors[i % colors.length]} p-2 rounded-md`}
                            >
                                <span className="text-lg">•</span>
                                <p className="text-gray-800">{note.text}</p>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-3 flex gap-2">
                        <input
                            type="text"
                            placeholder="Add new note..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="flex-1 border rounded-lg p-2 text-sm"
                        />
                        <Button
                            onClick={handleAddNote}
                            className="bg-blue-500 text-white"
                            disabled={!newNote.trim()}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
