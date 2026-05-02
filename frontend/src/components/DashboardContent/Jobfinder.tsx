import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Briefcase, Loader2, MapPin, Building2,
  TrendingUp, Search, ChevronLeft, ChevronRight
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;
const JOBS_PER_PAGE = 8;

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
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [page, setPage] = useState(1);
  const [apiPage, setApiPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [noMoreFromApi, setNoMoreFromApi] = useState(false);

  const totalPages = Math.ceil(allJobs.length / JOBS_PER_PAGE);
  const jobs = allJobs.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);
  const isLastLocalPage = page >= totalPages;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/user/profile`, { credentials: "include" });
        const data = await res.json();
        if (res.ok) setSkills(data.user.skills || []);
        else toast.error("Failed to load profile");
      } catch {
        toast.error("Error loading user");
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchUser();
  }, []);

  const fetchFromApi = async (targetApiPage: number, append: boolean) => {
    const res = await fetch(`${API}/jobs/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role, location, apiPage: targetApiPage }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch jobs");

    const newJobs: Job[] = data.jobs;

    if (append) {
      setAllJobs((prev) => [...prev, ...newJobs]);
    } else {
      setAllJobs(newJobs);
    }

    setApiPage(targetApiPage);
    setNoMoreFromApi(newJobs.length === 0);
    return newJobs.length;
  };

  const handleSearch = async () => {
    if (!role.trim()) return toast.error("Enter a role");
    setLoading(true);
    setPage(1);
    setNoMoreFromApi(false);
    try {
      const count = await fetchFromApi(1, false);
      setHasSearched(true);
      toast.success(`Found ${count} jobs`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!isLastLocalPage) {
      setPage((p) => p + 1);
      return;
    }
    // At last local page — fetch next API batch and append
    if (noMoreFromApi) return;
    setLoadingMore(true);
    try {
      const count = await fetchFromApi(apiPage + 1, true);
      if (count > 0) setPage((p) => p + 1);
      else toast.info("No more jobs available");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
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
            onKeyDown={handleKeyDown}
            placeholder="e.g. Backend Developer"
            className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
          />
        </div>

        {/* Location Filter */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase">
            Location
          </label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Mumbai, Remote"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm"
            />
          </div>
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
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/40">
        <div className="flex-1 min-h-0 overflow-y-auto p-6">

          {!loading && !hasSearched && (
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

          {!loading && hasSearched && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Briefcase className="h-10 w-10 mb-2 text-gray-300" />
              <p className="text-sm">No jobs found for this search</p>
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-sm transition"
                >
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

                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </p>

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

                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-xs font-medium text-black hover:underline"
                  >
                    View Job →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {hasSearched && !loading && totalPages > 0 && (
          <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-white shrink-0">
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages} &nbsp;·&nbsp; {allJobs.length} jobs
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <button
                onClick={handleNext}
                disabled={loadingMore || (isLastLocalPage && noMoreFromApi)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Next <ChevronRight className="h-3.5 w-3.5" /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
