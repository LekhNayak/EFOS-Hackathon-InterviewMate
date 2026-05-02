import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Briefcase, Loader2, MapPin, Building2,
  TrendingUp, Search
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  matchScore?: number;
  matchedSkills?: string[];
}

export default function JobFinder() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // 🔥 Fetch user skills
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/user/profile`, {
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) {
          setSkills(data.user.skills || []);
        } else {
          toast.error("Failed to load profile");
        }
      } catch {
        toast.error("Error loading user");
      } finally {
        setLoadingSkills(false);
      }
    };

    fetchUser();
  }, []);

  // 🔥 Search jobs
  const handleSearch = async () => {
  if (!role.trim()) return toast.error("Enter a role");

  setLoading(true);

  try {
    const res = await fetch(`${API}/jobs/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      toast.error(data.message || "Failed to fetch jobs");
      return;
    }

    setJobs(data.jobs);
    toast.success("Jobs fetched!");
  } catch (err) {
    console.error(err);
    toast.error("Server error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>

      {/* LEFT PANEL */}
      <div className="w-[320px] border-r border-gray-200 p-6 flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-gray-800">Find Jobs</h1>
        <p className="text-xs text-gray-400">Search jobs based on your skills</p>

        {/* Role Input */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase">
            Role
          </label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Backend Developer"
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
          />
        </div>

        {/* Skills Display */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
            Your Skills
          </p>

          {loadingSkills ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : skills.length === 0 ? (
            <p className="text-xs text-gray-400">No skills found</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-black text-white text-sm px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search Jobs
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/40">

        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <Briefcase className="h-12 w-12 mb-2" />
            <p className="text-sm">No jobs yet</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {jobs.map((job, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-sm transition"
            >
              {/* Title */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    {job.title}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" /> {job.company}
                  </p>
                </div>

                {job.matchScore !== undefined && (
                  <div className="text-xs font-semibold text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {job.matchScore}%
                  </div>
                )}
              </div>

              {/* Location */}
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {job.location}
              </p>

              {/* Skills */}
              {job.matchedSkills && job.matchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.matchedSkills.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <a
                href={job.url}
                target="_blank"
                className="mt-2 text-xs font-medium text-black hover:underline"
              >
                View Job →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}