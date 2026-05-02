import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, MapPin, Briefcase, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/DashboardContent/TopNav";

const API = import.meta.env.VITE_API_BASE_URL;

interface JD {
    _id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    requiredSkills: string[];
    description: string;
    createdAt: string;
}


export default function JdOnboarding() {
    const navigate = useNavigate();
    const [jds, setJds] = useState<JD[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Simulation modal state
    const [modalJd, setModalJd] = useState<JD | null>(null);
    const [interviewType, setInterviewType] = useState("technical_role");
    const [level, setLevel] = useState("medium");
    const [duration, setDuration] = useState("30min");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetch(`${API}/jd/user`, { credentials: "include" })
            .then(r => r.json())
            .then(data => {
                if (data.success) setJds(data.jobs);
                else toast.error("Failed to load your JDs");
            })
            .catch(() => toast.error("Network error loading JDs"))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`${API}/jd/${id}`, { method: "DELETE", credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setJds(prev => prev.filter(j => j._id !== id));
                toast.success("JD deleted");
            } else toast.error(data.error || "Failed to delete JD");
        } catch {
            toast.error("Network error deleting JD");
        } finally {
            setDeletingId(null);
        }
    };

    const openModal = (jd: JD) => {
        setModalJd(jd);
        setInterviewType("technical_role");
        setLevel("medium");
        setDuration("30min");
        setResumeFile(null);
    };

    const startSimulation = async () => {
        if (!modalJd) return;
        if (!resumeFile) return toast.error("Please upload your resume.");

        setStarting(true);
        try {
            const formData = new FormData();
            formData.append("file", resumeFile);
            formData.append("title", resumeFile.name.replace(/\.pdf$/i, "").replace(/_/g, " "));

            const res = await fetch(`${API}/parser/parse`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });
            const data = await res.json();
            if (!data.success) return toast.error("Failed to parse resume: " + (data.error || "Unknown error"));

            const parsedResume = data.createdResume || data.updatedResume || data;
            const jdText = `
Job Title: ${modalJd.title}
Company: ${modalJd.company}
Location: ${modalJd.location}
Job Type: ${modalJd.jobType}
Required Skills: ${(modalJd.requiredSkills || []).join(", ")}

Description:
${modalJd.description || ""}
`.trim();

            navigate("/interview", {
                state: {
                    company: modalJd.company,
                    role: modalJd.title,
                    jobDescription: jdText,
                    level,
                    duration,
                    interviewType,
                    resume: parsedResume,
                },
            });
        } catch {
            toast.error("Failed to start simulation.");
        } finally {
            setStarting(false);
        }
    };

    return (
        <div className="h-screen flex overflow-hidden">
            <Sidebar activeMenu="Simulations" setActiveMenu={() => navigate("/dashboard?tab=Simulations")} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <TopNav />
                <div className="flex-1 overflow-y-auto px-8 py-6 w-full">
                    <button
                        onClick={() => navigate("/dashboard?tab=Simulations")}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Simulations
                    </button>

                    <h1 className="text-2xl font-semibold text-gray-800 mb-1">My Uploads</h1>
                    <p className="text-sm text-gray-400 mb-6">Job descriptions you've uploaded for interview simulations</p>

                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
                    ) : jds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                            <Briefcase className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No job descriptions uploaded yet</p>
                            <button onClick={() => navigate("/dashboard?tab=Simulations")} className="mt-2 text-sm text-gray-600 hover:underline">
                                Go upload one →
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {jds.map(jd => (
                                <div key={jd._id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h2 className="font-semibold text-gray-800 text-sm leading-tight">{jd.title || "Untitled"}</h2>
                                            <p className="text-xs text-gray-500 mt-0.5">{jd.company || "Unknown Company"}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(jd._id)}
                                            disabled={deletingId === jd._id}
                                            className="text-gray-300 hover:text-red-500 transition shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                        {jd.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {jd.location}</span>}
                                        {jd.jobType && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {jd.jobType}</span>}
                                    </div>

                                    {jd.requiredSkills?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {jd.requiredSkills.slice(0, 4).map(skill => (
                                                <span key={skill} className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full">{skill}</span>
                                            ))}
                                            {jd.requiredSkills.length > 4 && (
                                                <span className="text-[11px] text-gray-400 px-1">+{jd.requiredSkills.length - 4} more</span>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 line-clamp-2 mt-auto">{jd.description}</p>

                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[11px] text-gray-300">{new Date(jd.createdAt).toLocaleDateString()}</span>
                                        <button
                                            onClick={() => openModal(jd)}
                                            className="text-xs bg-black text-white px-3 py-1.5 rounded-xl hover:bg-gray-800 transition"
                                        >
                                            Simulate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Simulation Settings Modal */}
            {modalJd && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex justify-center items-center z-50">
                    <div className="bg-white relative w-[420px] p-6 rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                        <h2 className="text-2xl font-semibold mb-2 tracking-tight">Simulation Settings</h2>
                        <p className="text-sm text-gray-500 mb-4">Interview for: {modalJd.company}</p>

                        <button
                            className="rounded-xl border-0 m-2 px-3 py-2 absolute top-0 right-0 hover:bg-gray-100 transition"
                            onClick={() => setModalJd(null)}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">1. Interview Type</label>
                            <select
                                value={interviewType}
                                onChange={e => setInterviewType(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-100 border border-gray-200 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                            >
                                <option value="hr">HR Interview</option>
                                <option value="technical_projects">Technical Interview (Projects Based)</option>
                                <option value="technical_role">Technical Interview (Role Based)</option>
                                <option value="dsa">DSA Interview</option>
                                <option value="hybrid">Hybrid (DSA + Technical)</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">2. Difficulty Level</label>
                            <select
                                value={level}
                                onChange={e => setLevel(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-100 border border-gray-200 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                            >
                                <option value="easy">Beginner</option>
                                <option value="medium">Intermediate</option>
                                <option value="hard">Expert</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">3. Duration</label>
                            <select
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-100 border border-gray-200 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                            >
                                <option value="5min">5 Minutes</option>
                                <option value="10min">10 Minutes</option>
                                <option value="15min">15 Minutes</option>
                                <option value="30min">30 Minutes</option>
                                <option value="45min">45 Minutes</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">4. Upload Your Resume (PDF/DOCX)</label>
                            <div className="flex items-center gap-3 p-3 bg-gray-100 border border-gray-200 rounded-xl">
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={e => setResumeFile(e.target.files?.[0] || null)}
                                    className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                                />
                                {resumeFile && <span className="text-xs text-green-600 truncate max-w-[100px]">{resumeFile.name}</span>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setModalJd(null)}
                                className="rounded-xl flex-1 py-2.5 border border-gray-300 text-sm hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startSimulation}
                                disabled={!resumeFile || starting}
                                className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</> : "Start Simulation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
