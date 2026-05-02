import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE_URL;
import { toast } from "sonner";
import JobFilterBar from "@/components/jobfilter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import JDFolder from "../simulations/JdFolder";

// --- Interfaces ---
const pastelColors = [
    "#E8F0FE",
    "#EAF7EC",
    "#E9F6F8",
    "#FFF3E6",
    "#F3E8FF",
    "#E6F4EA",
    "#FDE8E8",
    "#E8F9FE",
];

interface Role {
    _id: string;
    title: string;
    url: string;
    jobType: string;
    // Assuming you have the JD text available when you fetch the data. 
    // If not, you'll need another API call. We'll simulate this with a placeholder.
    jdText: string;
}

interface CompanyData {
    company: string;
    description: string;
    roles: Role[];
}

interface SimulationsProps {
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
}

export default function Simulations({ search, setSearch }: SimulationsProps) {
    const navigate = useNavigate();

    const [companies, setCompanies] = useState<CompanyData[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
    const [popupOpen, setPopupOpen] = useState(false);

    // --- NEW STATE FOR SIMULATION SETTINGS ---
    const [selectedLevel, setSelectedLevel] = useState<string>("medium");
    const [selectedDuration, setSelectedDuration] = useState<string>("30min");
    const [selectedInterviewType, setSelectedInterviewType] = useState<string>("technical_role");
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    // --- State for JD Upload Modal ---
    const [uploadModal, setUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);


    // --- Fetch Companies/JDs on Mount ---
    useEffect(() => {
        const getCompanies = async () => {
            try {
                const res = await fetch(`${API}/jd/`, {
                    credentials: "include"
                });

                const data = await res.json();

                // Add dummy JD text for simulation demo if not present
                const jobsWithJDText = data.jobs.map((job: any) => ({
                    ...job,
                    jdText: job.description || `Job description for ${job.title} at ${job.company}. Requires skill in ${job.jobType}.`
                }));


                const grouped: { [key: string]: CompanyData } = {};
                jobsWithJDText.forEach((job: any) => {
                    if (!grouped[job.company]) {
                        grouped[job.company] = {
                            company: job.company,
                            description: job.description, // Company description or first JD description
                            roles: []
                        };
                    }
                    grouped[job.company].roles.push({
                        _id: job._id,
                        title: job.title,
                        url: job.url,
                        jobType: job.jobType,
                        jdText: job.jdText
                    });
                });


                setCompanies(Object.values(grouped));
            } catch (error) {
                console.error("Failed to fetch companies:", error);
                // Handle error state if necessary
            }
        };

        getCompanies();
    }, []);

    // --- Filtering Logic (Currently unused in JSX but kept) ---
    const filtered = companies.filter((i) =>
        i.company.toLowerCase().includes(search.toLowerCase())
    );

    // --- Start Simulation Handler (Updated to include Resume and JD text) ---
    const startSimulation = async () => {
        if (!selectedCompany) return;

        const roleId = (document.getElementById("role") as HTMLSelectElement).value;
        const selectedRole = selectedCompany.roles.find(r => r._id === roleId);

        if (!selectedRole) {
            toast.error("Please select a valid role.");
            return;
        }

        if (!resumeFile) {
            toast.error("Please upload your resume file to start the simulation.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", resumeFile);
            formData.append("title", resumeFile.name);

            const res = await fetch(`${API}/parser/parse`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const data = await res.json();

            if (!data.success) {
                toast.error("Failed to parse resume: " + (data.error || "Unknown error"));
                return;
            }

            // Parsed resume JSON returned from backend
            const parsedResume = data.createdResume || data.updatedResume || data;

            navigate("/interview", {
                state: {
                    company: selectedCompany.company,
                    role: selectedRole.title,
                    jobDescription: selectedRole.jdText,
                    level: selectedLevel,
                    duration: selectedDuration,
                    interviewType: selectedInterviewType,
                    resume: parsedResume,
                },
            });

        } catch (err) {
            console.error("Resume upload/parse failed:", err);
            toast.error("Failed to upload and parse resume.");
        }
    };

    // --- JD Upload Handler (Existing Logic) ---
    const uploadJDFile = async () => {
        if (!selectedFile) {
            toast.error("Please select a PDF file");
            return;
        }

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append("jd", selectedFile);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API}/jd/parse`);
            xhr.withCredentials = true;

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setProgress(percent);
                }
            };

            xhr.onload = () => {
                setUploading(false);
                if (xhr.status >= 200 && xhr.status < 300) {
                    setProgress(100);
                    setTimeout(() => {
                        toast.success("JD uploaded successfully!");
                        setUploadModal(false);
                        setSelectedFile(null);
                        window.location.reload();
                    }, 300);
                } else {
                    toast.error(`Failed to upload JD. Status: ${xhr.status}`);
                    setSelectedFile(null);
                }
            };

            xhr.onerror = () => {
                toast.error("Upload error.");
                setUploading(false);
                setSelectedFile(null);
            };

            xhr.send(formData);

        } catch (err) {
            console.error(err);
            toast.error("Failed to upload JD (Client error).");
            setUploading(false);
            setSelectedFile(null);
        }
    };


    return (
        <main className="flex-1 pt-2 overflow-y-auto p-4">
            {/* My Activity Section */}
            <div className="my-2">
                <h2 className="text-xl font-semibold text-gray-800 px-1">My Activity</h2>
                <div className="w-full flex gap-4 items-center rounded-2xl">
                    <div className="relative mt-2 flex flex-col gap-4 rounded-2xl hover:bg-[#f6f6f6] px-6 py-4">
                        <JDFolder name="My Uploads" fileCount={companies.length} redirectTo="/jd/onboarding" />
                        <p className="text-sm text-gray-600 mt-2 text-center font-semibold">My Uploads</p>
                    </div>
                    <div className="relative mt-2 flex flex-col gap-4 rounded-2xl hover:bg-[#f6f6f6] px-6 py-4">
                        <JDFolder name="Reviews" fileCount={0} redirectTo="/reviews" />
                        <p className="text-sm text-gray-600 mt-2 text-center font-semibold">Reviews</p>
                    </div>
                </div>
            </div>

            {/* New Simulations Section */}
            <div>
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 px-1">New Simulations</h2>
                    <Button
                        className="bg-[#252525] text-white rounded-xl hover:bg-gray-900 px-5 py-2"
                        onClick={() => setUploadModal(true)}
                    >
                        Upload JD
                    </Button>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <JobFilterBar search={search} setSearch={setSearch} />
                </div>

                {/* Company Carousel */}
                <div className="relative mt-2 px-4">
                    <button
                        className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
                        onClick={() => {
                            const scrollEl = document.getElementById("companyScroll");
                            if (scrollEl) scrollEl.scrollBy({ left: -320, behavior: "smooth" });
                        }}
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>

                    <div
                        id="companyScroll"
                        className="flex overflow-x-auto gap-6 scroll-smooth"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        onWheel={(e) => {
                            const container = e.currentTarget;
                            container.scrollLeft += e.deltaY;
                        }}
                    >
                        <style>{`#companyScroll::-webkit-scrollbar { display: none; }`}</style>

                        {/* CARD LOOP */}
                        {filtered.map((company, index) => (
                                <div
                                    key={index}
                                    className="min-w-[320px] max-w-[320px] rounded-lg shadow-sm hover:shadow-md transition-all p-5 shrink-0"
                                    style={{ backgroundColor: pastelColors[index % pastelColors.length] }}
                                >
                                    <div className="flex flex-col justify-between h-full">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                {company.company}
                                            </h3>

                                            <p className="text-xs text-gray-700 leading-relaxed mb-3 line-clamp-4">
                                                {company.description}
                                            </p>
                                        </div>

                                        <div className="flex flex-row w-full gap-2 mt-4">
                                            <Button
                                                variant="outline"
                                                className="border-gray-300 rounded-xl hover:bg-gray-100/30 text-gray-800"
                                                onClick={() => window.open(company.roles[0]?.url, "_blank")}
                                            >
                                                Description
                                            </Button>

                                            <Button
                                                className="bg-[#252525] rounded-xl text-white hover:bg-black px-6 py-2"
                                                onClick={() => {
                                                    setSelectedCompany(company);
                                                    setPopupOpen(true);
                                                }}
                                            >
                                                Start Simulation
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                    </div>

                    <button
                        className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
                        onClick={() => {
                            const scrollEl = document.getElementById("companyScroll");
                            if (scrollEl) scrollEl.scrollBy({ left: 320, behavior: "smooth" });
                        }}
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                </div>
            </div>

            {/* --- SIMULATION SETTINGS MODAL (POPUP) --- */}
            {popupOpen && selectedCompany && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex justify-center items-center z-50">
                    <div className="bg-white relative w-[420px] p-6 rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.12)]">

                        <h2 className="text-2xl font-semibold mb-2 tracking-tight">Simulation Settings</h2>
                        <p className="text-sm text-gray-500 mb-4">Interview for: {selectedCompany.company}</p>

                        <button
                            className="rounded-xl border-0 m-2 px-3 py-2 absolute top-0 right-0 hover:bg-gray-100 transition"
                            onClick={() => setPopupOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">1. Select Role</label>
                            <select
                                id="role"
                                defaultValue={selectedCompany.roles[0]?._id}
                                className="w-full p-3 rounded-xl bg-gray-100 border border-gray-200 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                            >
                                {selectedCompany.roles.map(role => (
                                    <option key={role._id} value={role._id}>{role.title} ({role.jobType})</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">2. Interview Type</label>
                            <select
                                value={selectedInterviewType}
                                onChange={e => setSelectedInterviewType(e.target.value)}
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
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">3. Difficulty Level</label>
                            <select
                                value={selectedLevel}
                                onChange={e => setSelectedLevel(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-100 border border-gray-200 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                            >
                                <option value="easy">Beginner</option>
                                <option value="medium">Intermediate</option>
                                <option value="hard">Expert</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">4. Duration</label>
                            <select
                                value={selectedDuration}
                                onChange={e => setSelectedDuration(e.target.value)}
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
                            <label className="text-sm font-medium text-gray-700 mx-2 mb-1 block">5. Upload Your Resume (PDF/DOCX)</label>
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
                                onClick={() => setPopupOpen(false)}
                                className="rounded-xl flex-1 py-2.5 border border-gray-300 text-sm hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startSimulation}
                                disabled={!resumeFile}
                                className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start Simulation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- JD UPLOAD MODAL (Existing Logic) --- */}
            {
                uploadModal && (
                    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-80 shadow-xl animate-fadeIn">
                            <h2 className="text-xl font-semibold mb-4">Upload Job Description</h2>

                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center mb-4">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="w-full opacity-70"
                                />
                            </div>

                            {/* Upload Progress Bar */}
                            {uploading && (
                                <div className="w-full mt-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Uploading...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-black h-2 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-5">
                                <Button
                                    variant="outline"
                                    onClick={() => !uploading && setUploadModal(false)}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>

                                <Button
                                    disabled={uploading || !selectedFile}
                                    className={`rounded-xl px-4 ${uploading ? "bg-gray-400" : "bg-black text-white"
                                        }`}
                                    onClick={uploadJDFile}
                                >
                                    {uploading ? "Uploading..." : "Upload"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </main >
    );
}