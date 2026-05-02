import { useState } from "react";
import { Search, MapPin, Briefcase, Gauge, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface JobFilterBarProps {
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
}

export default function JobFilterBar({ search, setSearch }: JobFilterBarProps) {
    const [mode, setMode] = useState("Location Mode");
    const [type, setType] = useState("Job Type");
    const [difficulty, setDifficulty] = useState("Any Level");

    return (
        <div className="w-full bg-[#F9F9F9] border-[#E5E5E5] border rounded-xl p-2 flex justify-between items-center gap-2 shadow-none">
            <div className="flex items-center gap-2 px-3 flex-[1.5] min-w-[180px]">
                <Search className="w-4 h-8 text-gray-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search company"
                    className="outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full bg-transparent"
                />
            </div>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 pr-2 flex-1 min-w-40">
                <MapPin className="w-4 h-4 text-gray-500" />
                <Select onValueChange={setMode}>
                    <SelectTrigger className="text-sm text-gray-700 border-0 bg-white/80 rounded-xl w-full">
                        <SelectValue placeholder={mode} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl">
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="In-Person">In-Person</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 pr-2 flex-1 min-w-40">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <Select onValueChange={setType}>
                    <SelectTrigger className="text-sm text-gray-700 border-0 bg-white/80 rounded-xl w-full">
                        <SelectValue placeholder={type} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl">
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Full-Time">Full-Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 pr-2 flex-1 min-w-40">
                <Gauge className="w-4 h-4 text-gray-500" />
                <Select onValueChange={setDifficulty}>
                    <SelectTrigger className="text-sm text-gray-700 border-0 bg-white/80 rounded-xl w-full">
                        <SelectValue placeholder={difficulty} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl">
                        <SelectItem value="Any Level">Any Level</SelectItem>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
