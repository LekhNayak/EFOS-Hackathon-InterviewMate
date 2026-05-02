import { useState } from "react";
import { 
    ExternalLink, GraduationCap, Code2, Database, BookOpen, 
    Mic, Languages, Users, Type, ChevronLeft, ChevronRight,
    Sparkles, MessageCircle, Code, Terminal
} from "lucide-react";

const techPlatforms = [
    { name: "boot.dev", url: "https://boot.dev", icon: Database, color: "text-orange-500", bg: "bg-orange-50", label: "Backend" },
    { name: "takeUforward", url: "https://takeuforward.org", icon: Code2, color: "text-blue-500", bg: "bg-blue-50", label: "DSA & Prep" },
    { name: "LeetCode", url: "https://leetcode.com", icon: Code, color: "text-yellow-600", bg: "bg-yellow-50", label: "Challenges" },
    { name: "HackerRank", url: "https://hackerrank.com", icon: Terminal, color: "text-emerald-600", bg: "bg-emerald-50", label: "Certification" },
    { name: "Coursera", url: "https://coursera.org", icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-50", label: "University" },
    { name: "Udemy", url: "https://udemy.com", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50", label: "Courses" }
];

const commPlatforms = [
    { name: "Elsa Speak", url: "https://elsaspeak.com", icon: Mic, color: "text-red-500", bg: "bg-red-50", label: "Pronunciation" },
    { name: "Duolingo", url: "https://duolingo.com", icon: Languages, color: "text-green-500", bg: "bg-green-50", label: "Fluency" },
    { name: "Toastmasters", url: "https://www.toastmasters.org", icon: Users, color: "text-rose-700", bg: "bg-rose-50", label: "Public Speaking" },
    { name: "Grammarly", url: "https://grammarly.com", icon: Type, color: "text-emerald-500", bg: "bg-emerald-50", label: "Writing" }
];

export default function ProgressGraph() {
    const [page, setPage] = useState(0); // 0: Tech, 1: Comm

    const pages = [
        { title: "Tech Skill Boost", icon: Sparkles, platforms: techPlatforms },
        { title: "Communication Skill Boost", icon: MessageCircle, platforms: commPlatforms }
    ];

    const current = pages[page];

    const nextPage = () => setPage((prev) => (prev + 1) % pages.length);
    const prevPage = () => setPage((prev) => (prev === 0 ? pages.length - 1 : prev - 1));

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between" style={{ minHeight: "340px" }}>
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                        <current.icon size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Recommended</p>
                        <h3 className="text-md font-bold text-gray-900 tracking-tight">{current.title}</h3>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={prevPage}
                        className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={nextPage}
                        className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Platform Grid */}
            <div className={`grid grid-cols-2 gap-3 flex-1 items-center ${current.platforms.length > 4 ? 'content-start' : 'content-center'}`}>
                {current.platforms.map((p) => (
                    <a 
                        key={p.name}
                        href={p.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-2.5 rounded-xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-lg ${p.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                                <p.icon size={18} className={p.color} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-gray-900 leading-none mb-1 truncate">{p.name}</p>
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-tighter truncate">{p.label}</p>
                            </div>
                        </div>
                        <ExternalLink size={12} className="text-gray-200 group-hover:text-indigo-600 transition-colors shrink-0" />
                    </a>
                ))}
            </div>

            {/* Pagination Indicators */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                <div className="flex gap-1">
                    {pages.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-300 ${page === idx ? 'w-5 bg-gray-900' : 'w-1.5 bg-gray-200'}`}
                        />
                    ))}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    Page {page + 1} / {pages.length}
                </p>
            </div>
        </div>
    );
}
