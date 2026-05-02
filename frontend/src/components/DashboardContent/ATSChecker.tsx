import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Briefcase, FileText, Loader2, ChevronDown,
    AlertCircle, CheckCircle2, TrendingUp, Lightbulb, ScanSearch, FolderKanban
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

interface Resume { _id: string; title: string; }
interface JD { _id: string; title: string; company: string; }
interface ATSResult {
    localAtsScore: number;
    jdMatch: string;
    profileSummary: string;
    missingKeywords: string[];
    technicalSkillsMatch: string[];
    softSkillsMatch: string[];
    experienceAlignment: string;
    improvementSuggestions: string[];
    projectsAnalysis: string;
    overallComment: string;
}
type Mode = "quick" | "jd";

function ScoreDial({ score }: { score: number }) {
    const color = score >= 70 ? "text-green-500" : score >= 45 ? "text-yellow-500" : "text-red-500";
    const ring = score >= 70 ? "border-green-200 bg-green-50" : score >= 45 ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50";
    return (
        <div className={`flex flex-col items-center justify-center rounded-2xl border-2 ${ring} p-5 shrink-0 w-36`}>
            <span className={`text-5xl font-bold ${color}`}>{Math.round(score)}</span>
            <span className="text-[11px] text-gray-400 mt-1 font-medium uppercase tracking-wide">ATS Score</span>
        </div>
    );
}

function Chip({ label, green }: { label: string; green?: boolean }) {
    return (
        <span className={`inline-block text-[11px] px-2.5 py-1 rounded-full border ${green
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-gray-200 bg-gray-50 text-gray-600"}`}>
            {label}
        </span>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                {icon} {title}
            </div>
            {children}
        </div>
    );
}

function SelectField({ label, value, onChange, children, hint }: {
    label: string; value: string; onChange: (v: string) => void;
    children: React.ReactNode; hint?: string;
}) {
    return (
        <div>
            <label className="text-[11px] font-semibold text-gray-400 mb-1.5 block tracking-wider uppercase">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 pr-9 focus:outline-none focus:border-gray-400 transition"
                >
                    {children}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

export default function ATSChecker() {
    const [mode, setMode] = useState<Mode>("quick");
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [jds, setJds] = useState<JD[]>([]);
    const [resumeId, setResumeId] = useState("");
    const [jobRole, setJobRole] = useState("");
    const [jdId, setJdId] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ATSResult | null>(null);

    useEffect(() => {
        fetch(`${API}/parser/all`, { credentials: "include" })
            .then(r => r.json()).then(d => { if (d.success) setResumes(d.resumes); });
        fetch(`${API}/jd/user`, { credentials: "include" })
            .then(r => r.json()).then(d => { if (d.success) setJds(d.jobs); });
    }, []);

    const handleAnalyze = async () => {
        if (!resumeId) return toast.error("Please select a resume.");
        if (mode === "quick" && !jobRole.trim()) return toast.error("Please enter a job role.");
        if (mode === "jd" && !jdId) return toast.error("Please select a job description.");

        setLoading(true);
        setResult(null);
        try {
            const endpoint = mode === "quick" ? `${API}/ats/quick-analyze` : `${API}/ats/analyze`;
            const body = mode === "quick" ? { resumeId, jobRole } : { resumeId, jdId };
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.error || "Analysis failed. Make sure the ATS service is running.");
                return;
            }
            setResult(data.ats);
            toast.success("ATS analysis complete!");
        } catch {
            toast.error("Network error. Make sure all services are running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        /* Fills exactly the space below TopNav — no page scroll */
        <div className="flex overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>

            {/* ── LEFT PANEL: form ── */}
            <div className="w-[320px] shrink-0 border-r border-gray-200 flex flex-col gap-5 p-6 overflow-y-auto">
                <div>
                    <h1 className="text-lg font-semibold text-gray-800">ATS Checker</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Analyze your resume against a role or JD</p>
                </div>

                {/* Mode toggle */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => { setMode("quick"); setResult(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border ${mode === "quick"
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                    >
                        <Briefcase className="h-4 w-4" /> Quick Check (Job Role)
                    </button>
                    <button
                        onClick={() => { setMode("jd"); setResult(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border ${mode === "jd"
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                    >
                        <FileText className="h-4 w-4" /> Check with JD
                    </button>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Resume selector */}
                <SelectField
                    label="Select Resume"
                    value={resumeId}
                    onChange={setResumeId}
                    hint={resumes.length === 0 ? "No resumes found — go to Resume Building first." : undefined}
                >
                    <option value="">— Choose a resume —</option>
                    {resumes.map(r => <option key={r._id} value={r._id}>{r.title}</option>)}
                </SelectField>

                {/* Mode-specific input */}
                {mode === "quick" ? (
                    <div>
                        <label className="text-[11px] font-semibold text-gray-400 mb-1.5 block tracking-wider uppercase">Job Role</label>
                        <input
                            type="text"
                            placeholder="e.g. Software Engineer"
                            value={jobRole}
                            onChange={e => setJobRole(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition"
                        />
                    </div>
                ) : (
                    <SelectField
                        label="Select Job Description"
                        value={jdId}
                        onChange={setJdId}
                        hint={jds.length === 0 ? "No JDs found — upload one in Simulations first." : undefined}
                    >
                        <option value="">— Choose a JD —</option>
                        {jds.map(j => <option key={j._id} value={j._id}>{j.title} — {j.company}</option>)}
                    </SelectField>
                )}

                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                >
                    {loading
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                        : "Run ATS Analysis"}
                </button>
            </div>

            {/* ── RIGHT PANEL: results ── */}
            <div className="flex-1 overflow-y-auto bg-gray-50/40 p-6">
                {!result && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 select-none">
                        <ScanSearch className="h-14 w-14 mb-3" />
                        <p className="text-sm font-medium">Results will appear here</p>
                        <p className="text-xs mt-1">Select a resume and role, then click Run ATS Analysis</p>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm">Analyzing resume…</p>
                    </div>
                )}

                {result && (
                    <div className="flex flex-col gap-4 max-w-2xl">

                        {/* Score + JD match */}
                        <div className="flex gap-4">
                            <ScoreDial score={result.localAtsScore} />
                            <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-center">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">JD Match</p>
                                <p className="text-4xl font-bold text-gray-800">{result.jdMatch || "—"}</p>
                                {result.profileSummary && (
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{result.profileSummary}</p>
                                )}
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="grid grid-cols-2 gap-4">
                            <Section title="Technical Skills" icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}>
                                {result.technicalSkillsMatch?.length > 0
                                    ? <div className="flex flex-wrap gap-1.5">{result.technicalSkillsMatch.map(s => <Chip key={s} label={s} green />)}</div>
                                    : <p className="text-xs text-gray-400">None detected</p>}
                            </Section>
                            <Section title="Soft Skills" icon={<CheckCircle2 className="h-4 w-4 text-blue-400" />}>
                                {result.softSkillsMatch?.length > 0
                                    ? <div className="flex flex-wrap gap-1.5">{result.softSkillsMatch.map(s => <Chip key={s} label={s} green />)}</div>
                                    : <p className="text-xs text-gray-400">None detected</p>}
                            </Section>
                        </div>

                        {/* Missing keywords */}
                        {result.missingKeywords?.length > 0 && (
                            <Section title="Missing Keywords" icon={<AlertCircle className="h-4 w-4 text-red-400" />}>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.missingKeywords.map(k => <Chip key={k} label={k} />)}
                                </div>
                            </Section>
                        )}

                        {/* Experience alignment */}
                        {result.experienceAlignment && (
                            <Section title="Experience Alignment" icon={<TrendingUp className="h-4 w-4 text-purple-400" />}>
                                <p className="text-sm text-gray-600 leading-relaxed">{result.experienceAlignment}</p>
                            </Section>
                        )}

                        {/* Suggestions */}
                        {result.improvementSuggestions?.length > 0 && (
                            <Section title="Improvement Suggestions" icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}>
                                <ul className="flex flex-col gap-2">
                                    {result.improvementSuggestions.map((s, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex gap-2 leading-snug">
                                            <span className="text-yellow-400 shrink-0 mt-0.5">•</span> {s}
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {/* Projects analysis */}
                        {result.projectsAnalysis && (
                            <Section title="Projects Analysis" icon={<FolderKanban className="h-4 w-4 text-indigo-400" />}>
                                <p className="text-sm text-gray-600 leading-relaxed">{result.projectsAnalysis}</p>
                            </Section>
                        )}

                        {/* Overall comment */}
                        {result.overallComment && (
                            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-500 leading-relaxed italic">
                                "{result.overallComment}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
