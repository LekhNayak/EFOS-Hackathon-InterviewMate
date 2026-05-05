import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Calendar, ChevronDown, ChevronUp,
    MessageSquare, TrendingUp, AlertCircle, Lightbulb, BookOpenCheck
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/DashboardContent/TopNav";

const API = import.meta.env.VITE_API_BASE_URL;

interface TranscriptEntry { question: string; answer: string; }

interface Scores {
    technical_accuracy: number;
    communication: number;
    depth: number;
    problem_solving: number;
}

interface Feedback {
    overall_rating: string;
    scores?: Scores;
    summary: string;
    strengths: string[];
    areas_for_improvement: string[];
    recommended_next_steps: string[];
}

interface Interview {
    _id: string;
    type: string;
    interviewType: string;
    role: string;
    company: string;
    level: string;
    duration: string;
    transcript: TranscriptEntry[];
    feedback?: Feedback;
    createdAt: string;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
    const pct = Math.round((value / 10) * 100);
    const color = value >= 7 ? "bg-green-500" : value >= 5 ? "bg-yellow-400" : "bg-red-400";
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-semibold w-6 text-right ${value >= 7 ? "text-green-600" : value >= 5 ? "text-yellow-600" : "text-red-500"}`}>
                {value}
            </span>
        </div>
    );
}

const TYPE_LABELS: Record<string, string> = {
    hr:                 "HR",
    technical_projects: "Technical (Projects)",
    technical_role:     "Technical (Role)",
    dsa:                "DSA",
    hybrid:             "Hybrid",
};

const TYPE_COLORS: Record<string, string> = {
    Behavioral: "bg-green-100 text-green-700",
    Technical:  "bg-blue-100 text-blue-700",
    Hybrid:     "bg-purple-100 text-purple-700",
};

export default function Reviews() {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [tab, setTab] = useState<"feedback" | "transcript">("feedback");

    useEffect(() => {
        fetch(`${API}/interview/user`, { credentials: "include" })
            .then(r => r.json())
            .then(data => {
                if (data.success) setInterviews(data.interviews);
                else toast.error("Failed to load interview history");
            })
            .catch(() => toast.error("Network error loading interviews"))
            .finally(() => setLoading(false));
    }, []);

    const toggle = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
        setTab("feedback");
    };

    const rating = (fb?: Feedback) => Number(fb?.overall_rating) || 0;
    const ratingColor = (r: number) => r >= 8 ? "text-green-600" : r >= 5 ? "text-yellow-600" : "text-red-500";
    const ratingRing  = (r: number) => r >= 8 ? "border-green-200 bg-green-50" : r >= 5 ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50";

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

                    <h1 className="text-2xl font-semibold text-gray-800 mb-1">Reviews</h1>
                    <p className="text-sm text-gray-400 mb-6">Your past interview simulation sessions</p>

                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
                    ) : interviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                            <BookOpenCheck className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No interview sessions yet</p>
                            <button onClick={() => navigate("/dashboard?tab=Simulations")} className="mt-2 text-sm text-gray-600 hover:underline">
                                Start a simulation →
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {interviews.map(iv => {
                                const r = rating(iv.feedback);
                                const isOpen = expandedId === iv._id;
                                const typeLabel = TYPE_LABELS[iv.interviewType] || iv.type;

                                return (
                                    <div key={iv._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                        {/* Row header */}
                                        <div
                                            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition"
                                            onClick={() => toggle(iv._id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Rating badge */}
                                                {iv.feedback?.overall_rating ? (
                                                    <div className={`flex flex-col items-center justify-center rounded-xl border ${ratingRing(r)} w-12 h-12 shrink-0`}>
                                                        <span className={`text-lg font-bold ${ratingColor(r)}`}>{iv.feedback.overall_rating}</span>
                                                        <span className="text-[9px] text-gray-400">/10</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 w-12 h-12 shrink-0">
                                                        <span className="text-xs text-gray-400">—</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {iv.role || "Interview"}{iv.company ? ` — ${iv.company}` : ""}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[iv.type] || "bg-gray-100 text-gray-600"}`}>
                                                            {typeLabel}
                                                        </span>
                                                        {iv.level && <span className="text-[10px] text-gray-400 capitalize">{iv.level}</span>}
                                                        {iv.duration && <span className="text-[10px] text-gray-400">{iv.duration}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    {iv.transcript?.length || 0} Q&A
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(iv.createdAt).toLocaleDateString()}
                                                </span>
                                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </div>

                                        {/* Expanded content */}
                                        {isOpen && (
                                            <div className="border-t border-gray-100">
                                                {/* Tab switcher */}
                                                <div className="flex gap-1 px-5 pt-4">
                                                    {(["feedback", "transcript"] as const).map(t => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setTab(t)}
                                                            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition ${tab === t ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                                        >
                                                            {t === "feedback" ? "Feedback" : "Transcript"}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="px-5 py-4 flex flex-col gap-4">
                                                    {tab === "feedback" && (
                                                        iv.feedback?.summary ? (
                                                            <>
                                                                {/* Summary */}
                                                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Summary</p>
                                                                    <p className="text-sm text-gray-700 leading-relaxed">{iv.feedback.summary}</p>
                                                                </div>

                                                                {/* Score breakdown */}
                                                                {iv.feedback?.scores && Object.values(iv.feedback.scores).some(v => v > 0) && (
                                                                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                                                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Score Breakdown</p>
                                                                        <div className="flex flex-col gap-2.5">
                                                                            <ScoreBar label="Technical Accuracy" value={iv.feedback.scores.technical_accuracy} />
                                                                            <ScoreBar label="Communication" value={iv.feedback.scores.communication} />
                                                                            <ScoreBar label="Depth & Detail" value={iv.feedback.scores.depth} />
                                                                            <ScoreBar label="Problem Solving" value={iv.feedback.scores.problem_solving} />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Strengths + Areas */}
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                                                                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-700">
                                                                            <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Strengths
                                                                        </div>
                                                                        <ul className="flex flex-col gap-1">
                                                                            {iv.feedback.strengths?.map((s, i) => (
                                                                                <li key={i} className="text-xs text-gray-600 flex gap-2">
                                                                                    <span className="text-green-500 shrink-0">•</span>{s}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                                                                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-700">
                                                                            <AlertCircle className="h-3.5 w-3.5 text-red-400" /> Areas to Improve
                                                                        </div>
                                                                        <ul className="flex flex-col gap-1">
                                                                            {iv.feedback.areas_for_improvement?.map((a, i) => (
                                                                                <li key={i} className="text-xs text-gray-600 flex gap-2">
                                                                                    <span className="text-red-400 shrink-0">•</span>{a}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </div>

                                                                {/* Next Steps */}
                                                                {iv.feedback.recommended_next_steps?.length > 0 && (
                                                                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                                                                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-700">
                                                                            <Lightbulb className="h-3.5 w-3.5 text-yellow-500" /> Recommended Next Steps
                                                                        </div>
                                                                        <ul className="flex flex-col gap-1">
                                                                            {iv.feedback.recommended_next_steps.map((r, i) => (
                                                                                <li key={i} className="text-xs text-gray-600 flex gap-2">
                                                                                    <span className="text-yellow-500 shrink-0">•</span>{r}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic">No feedback available for this session.</p>
                                                        )
                                                    )}

                                                    {tab === "transcript" && (
                                                        iv.transcript?.length > 0 ? (
                                                            <div className="flex flex-col gap-3">
                                                                {iv.transcript.map((entry, i) => (
                                                                    <div key={i} className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                                                        <p className="text-xs font-semibold text-gray-700 mb-1">Q{i + 1}: {entry.question}</p>
                                                                        <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
                                                                            {entry.answer || <span className="italic text-gray-300">No answer recorded</span>}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic">No transcript available.</p>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
