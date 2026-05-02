import { useState } from "react";
import { 
    ExternalLink, GraduationCap, Code2, Database, BookOpen, 
    Mic, Languages, Users, Type, ChevronLeft, ChevronRight,
    Sparkles, MessageCircle
} from "lucide-react";

const techPlatforms = [
    { name: "boot.dev", url: "https://boot.dev", icon: Database, color: "text-orange-500", bg: "bg-orange-50", label: "Backend Engineering" },
    { name: "takeUforward", url: "https://takeuforward.org", icon: Code2, color: "text-blue-500", bg: "bg-blue-50", label: "DSA & Interview Prep" },
    { name: "Coursera", url: "https://coursera.org", icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-50", label: "University Courses" },
    { name: "Udemy", url: "https://udemy.com", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50", label: "Skill-based Learning" }
];

const commPlatforms = [
    { name: "Elsa Speak", url: "https://elsaspeak.com", icon: Mic, color: "text-red-500", bg: "bg-red-50", label: "English Pronunciation" },
    { name: "Duolingo", url: "https://duolingo.com", icon: Languages, color: "text-green-500", bg: "bg-green-50", label: "Language Fluency" },
    { name: "Toastmasters", url: "https://www.toastmasters.org", icon: Users, color: "text-rose-700", bg: "bg-rose-50", label: "Public Speaking" },
    { name: "Grammarly", url: "https://grammarly.com", icon: Type, color: "text-emerald-500", bg: "bg-emerald-50", label: "Writing & Grammar" }
];

export default function ProgressGraph() {
    const [page, setPage] = useState(0); // 0 for Tech, 1 for Comm

    const currentPlatforms = page === 0 ? techPlatforms : commPlatforms;
    const title = page === 0 ? "Tech Skill Boost" : "Communication Skill Boost";
    const Icon = page === 0 ? Sparkles : MessageCircle;

    const nextPage = () => setPage((prev) => (prev + 1) % 2);
    const prevPage = () => setPage((prev) => (prev === 0 ? 1 : 0));

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between" style={{ minHeight: "340px" }}>
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                        <Icon size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Recommended</p>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={prevPage}
                        className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button 
                        onClick={nextPage}
                        className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {currentPlatforms.map((p) => (
                    <a 
                        key={p.name}
                        href={p.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl ${p.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                                <p.icon size={22} className={p.color} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 leading-none mb-1.5">{p.name}</p>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{p.label}</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-white group-hover:shadow-sm transition-all">
                            <ExternalLink size={14} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                    </a>
                ))}
            </div>

            {/* Pagination Indicators */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex gap-1.5">
                    <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${page === 0 ? 'w-6 bg-gray-900' : 'w-2 bg-gray-200'}`}
                    />
                    <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${page === 1 ? 'w-6 bg-gray-900' : 'w-2 bg-gray-200'}`}
                    />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Page {page + 1} of 2
                </p>
            </div>
        </div>
    );
}
