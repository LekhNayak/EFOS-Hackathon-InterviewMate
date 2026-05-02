import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
    open: boolean;
    onClose: () => void;
    signupData: { name: string; email: string; password: string };
    onComplete: () => void;
}

const ProfileSetupModal = ({ open, onClose, onComplete }: Props) => {
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [interests, setInterests] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const handleSave = async () => {
        try {
            setLoading(true);

            if (!file) {
                toast.error("Please upload a resume (PDF)");
                return;
            }

            console.log("📤 Uploading Resume File:", file.name);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", "Imported Resume");

            const parseRes = await fetch("http://localhost:8000/api/parser/parse", {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            console.log("📥 Parse API Response Status:", parseRes.status);
            const parsed = await parseRes.json();
            console.log("📦 Parsed Resume Response:", parsed);

            const parsedSkills = parsed?.resume?.skills || [];

            const skillList = [
                ...(parsedSkills.languages || []),
                ...(parsedSkills.frameworks || []),
                ...(parsedSkills.other || []),
            ];
            console.log("🧠 Extracted Skills:", parsedSkills);

            const updateRes = await fetch("http://localhost:8000/api/user/update", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    linkedinUrl,
                    githubUrl,
                    interests: interests.split(",").map(i => i.trim()),
                    age,
                    gender,
                    skills: skillList
                })
            });

            console.log("✅ Profile Update Response:", await updateRes.json());

            toast.success("Profile completed successfully");
            onClose();
            onComplete();
        } catch (err: any) {
            console.error("❌ Frontend Error:", err);
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label>Age</Label>
                            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                        </div>

                        <div className="flex-1">
                            <Label>Gender</Label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                            >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <Label>LinkedIn URL</Label>
                        <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                    </div>
                    <div>
                        <Label>GitHub URL</Label>
                        <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
                    </div>
                    <div>
                        <Label>Interests (comma separated)</Label>
                        <Input value={interests} onChange={(e) => setInterests(e.target.value)} />
                    </div>
                    <div>
                        <Label>Upload Resume (PDF)</Label>
                        <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>
                    <Button className="w-full bg-black text-white" onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save & Continue"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileSetupModal;