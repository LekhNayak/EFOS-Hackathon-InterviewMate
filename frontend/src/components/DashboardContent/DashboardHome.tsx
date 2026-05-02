import { useState, useEffect } from "react";
const API = import.meta.env.VITE_API_BASE_URL;
import ProgressGraph from "../profile/progressbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Github, Linkedin, X, Mail, SquareArrowOutUpRight, Pencil } from "lucide-react";
import profileimg from "@/assets/profile.jpg";
import InterviewCalendar from "../profile/interviewcalender";
import CodeforcesCard from "../progress/codeforces";
import LeetCodeCard from "../progress/leetcode";

export default function DashboardHome() {
    const [mongoUser, setMongoUser] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: "",
        email: "",
        age: "",
        gender: "",
        githubUrl: "",
        linkedinUrl: "",
        codeforcesUrl: "",
        leetcodeUrl: "",
        skills: "",
        interests: "",
    });
    // Local user data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API}/user/profile`, {
                    method: "GET",
                    credentials: "include"
                });

                const data = await res.json();
                if (!data.success) {
                    console.log("User not logged in or no profile");
                    return;
                }
                setMongoUser(data.user);

                setProfileForm({
                    name: data.user.name || "",
                    email: data.user.email || "",
                    age: data.user.age || "",
                    gender: data.user.gender || "",
                    githubUrl: data.user.githubUrl || "",
                    linkedinUrl: data.user.linkedinUrl || "",
                    codeforcesUrl: data.user.codeforcesUrl || "",
                    leetcodeUrl: data.user.leetcodeUrl || "",
                    skills: (data.user.skills || []).join(", "),
                    interests: (data.user.interests || []).join(", ")
                });

            } catch (err) {
                console.error("Failed to fetch profile:", err);
            }
        };

        fetchProfile();
    }, []);


    const handleChange = (field: string, value: string) => {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleSave = async () => {
        const payload = {
            name: profileForm.name,
            age: Number(profileForm.age),
            gender: profileForm.gender,
            githubUrl: profileForm.githubUrl,
            linkedinUrl: profileForm.linkedinUrl,
            codeforcesUrl: profileForm.codeforcesUrl,
            leetcodeUrl: profileForm.leetcodeUrl,
            skills: profileForm.skills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
            interests: profileForm.interests.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
        };

        try {
            const res = await fetch(`${API}/user/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data.success) {
                toast.error(data.message || "Update failed");
                return;
            }

            const updatedUser = { ...mongoUser, ...payload };
            setMongoUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setEditMode(false);
            toast.success("Profile updated successfully");
        } catch (err) {
            toast.error("Something went wrong while updating");
        }
    };


    const displayLimit = 5;
    return (
        <div className="flexbg-white gap-4 p-2 "
            style={{ height: "calc(100vh - 5rem)" }}>
            <div className="flex gap-4 text-gray-900 w-full">
                {/* Left Column */}
                <div className="w-[350px] flex flex-col space-y-4 "
                    style={{ height: "calc(100vh - 5rem)" }}>
                    {/* vertical layout with full height */}

                    {/* Profile Card */}
                    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-4 relative">
                                <img
                                    src={mongoUser?.avatarUrl || profileimg}
                                    alt={mongoUser?.name}
                                    className="w-20 h-20 rounded-full border border-[#d5d5d5]"
                                />
                                <div className="w-full text-center">
                                    <h2 className="text-lg font-semibold text-gray-900 flex gap-2 items-center">
                                        {mongoUser?.name}
                                        <p className="text-sm font-normal text-gray-500">#{mongoUser?._id?.slice(-6)}</p>
                                    </h2>
                                    <div className="flex text-sm items-center text-gray-500">
                                        <Mail size={14} className="mr-2" /> {mongoUser?.email}
                                    </div>
                                    <Button
                                        size="sm"
                                        className="absolute right-0 top-0"
                                        onClick={() => setEditMode(true)}
                                    >
                                        <Pencil />
                                    </Button>
                                </div>
                            </div>
                            <hr className="border-gray-200 my-4" />

                            <div className="space-y-4 text-sm">
                                <div>
                                    <label className="block text-[0.8rem] text-gray-400">-- Skills</label>
                                    <div className="flex flex-wrap gap-1">
                                        {(mongoUser?.skills?.slice(0, displayLimit) || []).map((skill: string) => (
                                            <span key={skill} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[0.8rem] text-gray-400">-- Interests</label>
                                    <div className="flex flex-wrap gap-1">
                                        {(mongoUser?.interests?.slice(0, displayLimit) || []).map((interest: string) => (
                                            <span key={interest} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between space-x-4 pt-3 border-t border-gray-200 mt-4">
                                {mongoUser?.linkedinUrl && (
                                    <button
                                        onClick={() => window.open(mongoUser.linkedinUrl, "_blank")}
                                        className="flex items-center text-gray-800 text-sm hover:underline"
                                    >
                                        <Linkedin size={16} className="mr-2" /> LinkedIn <SquareArrowOutUpRight size={16} className="ml-2" />
                                    </button>
                                )}
                                {mongoUser?.githubUrl && (
                                    <button
                                        onClick={() => window.open(mongoUser.githubUrl, "_blank")}
                                        className="flex items-center text-gray-800 text-sm hover:underline"
                                    >
                                        <Github size={16} className="mr-2" /> GitHub <SquareArrowOutUpRight size={16} className="ml-2" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* GitHub / Interview Calendar */}
                    <div className="flex-1">
                        <InterviewCalendar userId={mongoUser?._id} />
                    </div>

                </div>


                {/* Right Column */}
                <div className="flex-1 flex flex-col space-y-4"
                    style={{ height: "calc{100vh-5rem}" }}>
                    <ProgressGraph />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                        {/* Codeforces placeholder */}
                        <CodeforcesCard codeforcesLink={mongoUser?.codeforcesUrl || ""} />
                        <LeetCodeCard leetcodeLink={mongoUser?.leetcodeUrl || ""} />
                    </div>
                </div>
            </div>

            {/* Centered Edit Modal */}
            {
                editMode && (
                    <div className="fixed inset-0 bg-[#a5a5a5]/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#d5d5d5] p-6 w-[700px] max-w-full space-y-4 relative flex flex-col">
                            <button className="absolute top-3 right-3" onClick={() => setEditMode(false)}>
                                <X size={20} />
                            </button>

                            <h2 className="text-lg font-semibold">Edit Profile</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-[0.8rem] text-gray-400">Name</label>
                                    <Input value={profileForm.name} onChange={(e) => handleChange("name", e.target.value)} />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[0.8rem] text-gray-400">Email</label>
                                    <Input value={profileForm.email} disabled />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[0.8rem] text-gray-400">Age</label>
                                    <Input value={profileForm.age} onChange={(e) => handleChange("age", e.target.value)} />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[0.8rem] text-gray-400">Gender</label>
                                    <select
                                        className="border rounded-md px-2 py-2"
                                        value={profileForm.gender}
                                        onChange={(e) => handleChange("gender", e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[0.8rem] text-gray-400">Skills (comma separated)</label>
                                    <Input value={profileForm.skills} onChange={(e) => handleChange("skills", e.target.value)} />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[0.8rem] text-gray-400">Interests (comma separated)</label>
                                    <Input value={profileForm.interests} onChange={(e) => handleChange("interests", e.target.value)} />
                                </div>

                                <div className="flex flex-col col-span-2">
                                    <label className="text-[0.8rem] text-gray-400">GitHub URL</label>
                                    <Input value={profileForm.githubUrl} onChange={(e) => handleChange("githubUrl", e.target.value)} />
                                </div>

                                <div className="flex flex-col col-span-2">
                                    <label className="text-[0.8rem] text-gray-400">LinkedIn URL</label>
                                    <Input value={profileForm.linkedinUrl} onChange={(e) => handleChange("linkedinUrl", e.target.value)} />
                                </div>

                                <div className="flex flex-col col-span-2">
                                    <label className="text-[0.8rem] text-gray-400">Codeforces URL</label>
                                    <Input value={profileForm.codeforcesUrl} onChange={(e) => handleChange("codeforcesUrl", e.target.value)} />
                                </div>

                                <div className="flex flex-col col-span-2">
                                    <label className="text-[0.8rem] text-gray-400">LeetCode URL</label>
                                    <Input value={profileForm.leetcodeUrl} onChange={(e) => handleChange("leetcodeUrl", e.target.value)} />
                                </div>
                            </div>

                            <Button className="w-full mt-4 bg-[#252525] text-[#f9f9f9]" onClick={handleSave}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )

            }
        </div >
    );
}
