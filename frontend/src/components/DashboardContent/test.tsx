import React, { useState, useEffect } from "react";
import { toast } from "sonner";
const API = import.meta.env.VITE_API_BASE_URL;
import { v4 as uuidv4 } from "uuid";
import ResumePreview from "@/components/Resume/ResumePreview";
import ResumeEditor from "@/components/Resume/Resumeeditor";
import ResumeList from "@/components/Resume/ResumeList";
import type { Resume } from "../../types";

const createEmptyResume = (title: string = "Untitled Resume"): Resume => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const userId = user?._id || "";

    return {
        _id: uuidv4(),
        userId,
        title,
        header: { name: "", phone: "", email: "", github: "" },
        objective: "",
        education: [],
        skills: { languages: [], frameworks: [], other: [] },
        projects: [],
        activities: [],
    };
};

const ResumeBuilder: React.FC = () => {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const res = await fetch(`${API}/parser/all`, {
                    method: "GET",
                    credentials: "include"
                });
                const data = await res.json();
                if (data.success && data.resumes.length > 0) {
                    setResumes(data.resumes);
                    setSelectedId(data.resumes[0]._id);
                } else {
                    const newResume = createEmptyResume();
                    setResumes([newResume]);
                    setSelectedId(newResume._id ?? null);
                }
            } catch (err) {
                console.error("Failed to fetch resumes:", err);
            }
        };

        fetchResumes();
    }, []);

    const selectedResume =
        resumes.find((r) => r._id === selectedId) ||
        resumes[0] ||
        createEmptyResume();

    // ✅ only updates local state — no backend calls
    const updateSelectedResume = (updated: Resume) => {
        setResumes((prev) => prev.map((r) => (r._id === selectedId ? updated : r)));
    };

    const addNewResume = () => {
        const newResume = createEmptyResume(`Resume ${resumes.length + 1}`);
        setResumes((prev) => [...prev, newResume]);
        setSelectedId(newResume._id ?? null);
    };

    const renameResume = async (id: string, newTitle: string) => {
        setResumes((prev) =>
            prev.map((r) => (r._id === id ? { ...r, title: newTitle } : r))
        );

        const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
        if (!isMongoId) return;

        try {
            await fetch(`${API}/parser/update/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ title: newTitle }),
            });
        } catch (err) {
            console.error("Rename failed to save:", err);
        }
    };

    const deleteResume = async (id: string) => {
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
        if (!confirm("Are you sure you want to delete this resume?")) return;

        try {
            if (isMongoId) {
                const res = await fetch(`${API}/parser/delete/${id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                if (!res.ok) throw new Error("Failed to delete from server");
            }

            // Always update local state (remove from list)
            setResumes((prev) => prev.filter((r) => r._id !== id));

            // If the deleted one was selected, pick another
            setSelectedId((prevSelected) =>
                prevSelected === id && resumes.length > 1
                    ? resumes.find((r) => r._id !== id)?._id ?? null
                    : null
            );

            toast.success("Resume deleted successfully!");
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Error deleting resume");
        }
    };
    const handleImport = (parsedResume: Resume) => {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?._id || "";

        const importedResume = { ...parsedResume, _id: uuidv4(), userId };
        setResumes((prev) => [...prev, importedResume]);
        setSelectedId(importedResume._id);
    };

    const handleUpdate = (id: string, updatedResume: Resume) => {
        setResumes((prev) => prev.map((r) => (r._id === id ? updatedResume : r)));
    };

    const handleCreate = (newResume: Resume) => {
        setResumes((prev) => [...prev, newResume]);
        setSelectedId(newResume._id ?? null);
    };

    return (
        <main className="flex bg-white gap-4 px-6 py-2 h-screen overflow-hidden"

            style={{ height: "calc(99vh - 3rem)" }}>
            <div className="w-[48%] relative flex flex-col rounded-xl bg-white border border-gray-200 overflow-y-auto shadow-sm">
                <ResumePreview resume={selectedResume} />
            </div>
            <div className="w-[48%] grid grid-rows-[1fr_300px] gap-4">
                <div className="relative flex flex-col bg-[#F9F9F9] rounded-xl border border-[#E5E5E5] overflow-y-auto">
                    <ResumeEditor resume={selectedResume} onChange={updateSelectedResume} />
                </div>

                <div className="relative flex flex-col bg-[#F9F9F9] rounded-xl border border-[#E5E5E5] overflow-y-auto">
                    <ResumeList
                        resumes={resumes}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onAdd={addNewResume}
                        onRename={renameResume}
                        onDelete={deleteResume}
                        onImport={handleImport}
                        onUpdate={handleUpdate}
                        onCreate={handleCreate}
                    />
                </div>
            </div>

        </main>
    );
};

export default ResumeBuilder;
