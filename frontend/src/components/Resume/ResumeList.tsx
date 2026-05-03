import React, { useState } from "react";
const API = import.meta.env.VITE_API_BASE_URL;
import { toast } from "sonner";
import { MoreVertical, Download, Plus, Save, FilePlus, Upload } from "lucide-react";
import type { Resume } from "../../types";

interface Props {
    resumes: Resume[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
    onImport: (parsedResume: Resume) => void;
    onUpdate: (id: string, updatedResume: Resume) => void;
    onCreate: (newResume: Resume) => void;
}

const generateLatex = (resume: Resume) => {
    const escape = (str?: string) =>
        (str || "").replace(/([&_#%{}$])/g, "\\$1");

    const education = (resume.education || [])
        .map(
            (edu) =>
                `\\resumeEdu{${escape(edu.institution)}}{${escape(
                    edu.duration
                )}}{${escape(edu.degree)}}{${escape(edu.score)}}`
        )
        .join("\n\n");

    const skills = `
\\resumeItem{\\textbf{Languages}: ${escape(
        (resume.skills?.languages || []).join(", ")
    )}}
\\resumeItem{\\textbf{Frameworks \\& Tools}: ${escape(
        (resume.skills?.frameworks || []).join(", ")
    )}}
\\resumeItem{\\textbf{Other}: ${escape(
        (resume.skills?.other || []).join(", ")
    )}}`;

    const projects = (resume.projects || [])
        .map(
            (proj, idx, arr) => `
\\resumeSubheading{${escape(proj.title)}}{${escape(proj.duration)}}{${escape(
                proj.tech
            )}}{${escape(proj.event)}}
\\begin{itemize}[leftmargin=*]
${(proj.points || []).map((p) => `\\resumeItem{${escape(p)}}`).join("\n")}
\\end{itemize}
${idx < arr.length - 1 ? "\\vspace{4pt}\\rule{\\linewidth}{0.4pt}\\vspace{4pt}" : ""}`
        )
        .join("\n\n");

    const activities = (resume.activities || [])
        .map((a) => `\\resumeItem{${escape(a)}}`)
        .join("\n");

    return `\\documentclass[a4paper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{left=1in,right=1in,top=0.8in,bottom=0.8in}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{fontawesome}

\\titleformat{\\section}{\\large\\bfseries}{\\thesection}{1em}{}[{\\titlerule[0.8pt]}]
\\titlespacing*{\\section}{0pt}{10pt}{5pt}

\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{4pt}

\\newcommand{\\resumeItem}[1]{\\item #1}
\\newcommand{\\resumeSubheading}[4]{\\textbf{#1} \\hfill #2 \\\\ \\textit{#3} \\hfill #4}
\\newcommand{\\resumeEdu}[4]{\\textbf{#1} \\hfill #2 \\\\ \\textit{#3} \\hfill #4}

\\begin{document}

\\begin{center}
    {\\Huge \\textbf{${escape(resume.header?.name)}}} \\\\
    \\vspace{5pt}
    \\faPhone \\ ${escape(resume.header?.phone)} \\ \\textbullet\\ 
    \\faEnvelope \\ \\href{mailto:${escape(resume.header?.email)}}{${escape(resume.header?.email)}} \\ 
    \\textbullet\\ \\faGithub \\ \\href{${escape(resume.header?.github)}}{${escape(resume.header?.github)}}
    \\vspace{5pt}
\\end{center}

\\section{Objective}
${escape(resume.objective)}

\\section{Education}
${education}

\\section{Technical Skills}
\\begin{itemize}[leftmargin=*]
${skills}
\\end{itemize}

\\section{Projects}
${projects}

\\section{Extracurricular Activities}
\\begin{itemize}[leftmargin=*]
${activities}
\\end{itemize}

\\end{document}`;

};



const ResumeList: React.FC<Props> = ({
    resumes,
    selectedId,
    onSelect,
    onAdd,
    onRename,
    onDelete,
    onImport,
    onUpdate,
    onCreate,
}) => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");

    // ==========================
    // Handlers
    // ==========================

    const handleDownloadLatex = (resume: Resume) => {
        const latexContent = generateLatex(resume);

        const blob = new Blob([latexContent], { type: "application/x-tex" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${resume.header?.name || "resume"}.tex`;
        link.click();
        URL.revokeObjectURL(link.href);
    };


    const handleUploadPDF = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name.replace(/\.pdf$/i, "").replace(/_/g, " "));
        try {
            const res = await fetch(`${API}/parser/parse`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const data = await res.json();
            const parsed = data.parsedResume || data.resume;
            if (data.success && parsed) onImport(parsed);
            else toast.error("PDF parsing failed");
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Error uploading file");
        }
    };

    const handleSaveResume = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const storedUser = localStorage.getItem("user");
            const user = storedUser ? JSON.parse(storedUser) : null;
            const userId = user?._id;

            if (!userId) throw new Error("User not logged in");

            const resumeToSave = resumes.find((r) => r._id === selectedId);
            if (!resumeToSave) throw new Error("Resume not found");

            const isMongoId = /^[0-9a-fA-F]{24}$/.test(resumeToSave._id || "");

            if (!isMongoId) {
                const createRes = await fetch(`${API}/parser/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ ...resumeToSave, userId }),
                });

                if (!createRes.ok) throw new Error("Failed to create resume");

                const created = await createRes.json();
                onCreate(created.resume || created.parsedResume);
                toast.success("New resume created successfully!");
            } else {
                const updateRes = await fetch(
                    `${API}/parser/update/${resumeToSave._id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...resumeToSave, userId }),
                        credentials: "include",
                    }
                );

                if (!updateRes.ok) throw new Error("Failed to update resume");

                const updated = await updateRes.json();
                onUpdate(resumeToSave._id!, updated.updatedResume || updated.resume);
                toast.success("Resume updated successfully!");
            }
        } catch (err) {
            console.error("Save failed:", err);
            toast.error("Could not save resume");
        } finally {
            setIsSaving(false);
        }
    };

    // ==========================
    // UI Rendering (Alpha 2.5)
    // ==========================

    return (
        <div className="flex flex-col h-full bg-neutral-50/60  backdrop-blur-sm">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-200/60">
                <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">
                    Resume Library
                </p>
            </div>

            {/* Resume List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#ccc transparent",
                }}>
                {resumes.map((r) => (
                    <div
                        key={r._id}
                        onClick={() => onSelect(r._id!)}
                        className={`group relative p-4 rounded-2xl border text-[14px] transition-all duration-200 cursor-pointer
                            ${selectedId === r._id
                                ? "bg-blue-50/60 border-blue-300/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                : "bg-white/80 border-gray-200/70 hover:bg-gray-50/70 hover:border-gray-300/70"
                            }`}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-800 truncate">
                                {r.title || r.header?.name || "Untitled Resume"}
                            </h3>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenu(openMenu === r._id ? null : r._id!);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-all p-1 rounded-md hover:bg-gray-100/60"
                            >
                                <MoreVertical size={16} />
                            </button>
                        </div>

                        {/* Context Menu */}
                        {openMenu === r._id && (
                            <div
                                className="absolute right-3 top-12 bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200/70 rounded-xl w-44 text-sm z-20 py-1 backdrop-blur-md animate-fadeIn overflow-y-auto"
                            >
                                {renamingId === r._id ? (
                                    <div className="px-3 py-2" onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            value={renameValue}
                                            onChange={e => setRenameValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter" && renameValue.trim()) {
                                                    onRename(r._id!, renameValue.trim());
                                                    setRenamingId(null);
                                                    setOpenMenu(null);
                                                }
                                                if (e.key === "Escape") setRenamingId(null);
                                            }}
                                            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-gray-500"
                                        />
                                        <div className="flex gap-1 mt-1.5">
                                            <button
                                                onClick={() => {
                                                    if (renameValue.trim()) {
                                                        onRename(r._id!, renameValue.trim());
                                                        setRenamingId(null);
                                                        setOpenMenu(null);
                                                    }
                                                }}
                                                className="text-xs px-2.5 py-1 bg-black text-white rounded-lg"
                                            >Save</button>
                                            <button
                                                onClick={() => setRenamingId(null)}
                                                className="text-xs px-2.5 py-1 border border-gray-300 rounded-lg text-gray-600"
                                            >Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100/80 rounded-md transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRenamingId(r._id!);
                                            setRenameValue(r.title || r.header?.name || "");
                                        }}
                                    >
                                        Rename
                                    </button>
                                )}
                                <button
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100/80 rounded-md flex items-center gap-2 text-gray-700 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadLatex(r);
                                    }}
                                >
                                    <Download size={14} /> Download PDF
                                </button>
                                {confirmDeleteId === r._id ? (
                                    <div className="px-3 py-2 border-t border-red-100 bg-red-50/50" onClick={e => e.stopPropagation()}>
                                        <p className="text-xs text-gray-600 mb-1.5">Delete this resume?</p>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    onDelete(r._id!);
                                                    setConfirmDeleteId(null);
                                                    setOpenMenu(null);
                                                }}
                                                className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-lg"
                                            >Delete</button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-xs px-2.5 py-1 border border-gray-300 rounded-lg text-gray-600"
                                            >Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        className="w-full text-left px-4 py-2 hover:bg-red-50/80 rounded-md text-red-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDeleteId(r._id!);
                                        }}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex gap-4 border-t border-gray-200/70 p-5 bg-white/70 backdrop-blur-sm rounded-t-2xl">
                <div className="relative flex-1">
                    <button
                        onClick={handleSaveResume}
                        disabled={isSaving}
                        className={`w-full py-1  rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200
                        ${isSaving
                                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                                : "bg-[#252525] text-white hover:bg-black active:scale-[0.98]"
                            }`}
                    >
                        <Save size={16} /> {isSaving ? "Saving..." : "Save Resume"}
                    </button>
                </div>

                <div className="relative flex-1">
                    <button
                        onClick={() => setOpenMenu(openMenu === "add" ? null : "add")}
                        className="w-full border border-dashed border-gray-400/70 py-1 rounded-xl hover:bg-gray-100/70 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 text-gray-700"
                    >
                        <Plus size={16} /> Add Resume
                    </button>

                    {openMenu === "add" && (
                        <div className="absolute bottom-14 left-0 bg-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-gray-200/70 rounded-xl w-56 text-sm z-30 overflow-hidden backdrop-blur-md animate-fadeIn">
                            <button
                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100/80 transition-colors"
                                onClick={() => {
                                    setOpenMenu(null);
                                    onAdd();
                                }}
                            >
                                <FilePlus size={15} /> Create from Scratch
                            </button>

                            <label
                                htmlFor="uploadResume"
                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100/80 transition-colors cursor-pointer"
                            >
                                <Upload size={15} /> Upload PDF
                                <input
                                    id="uploadResume"
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadPDF(file);
                                    }}
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default ResumeList;
