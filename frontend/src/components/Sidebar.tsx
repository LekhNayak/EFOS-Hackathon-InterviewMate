import { useState, useEffect } from "react";
const API = import.meta.env.VITE_API_BASE_URL;
import {
    LayoutDashboard,
    PlayCircle,
    FileUser,
    ScanSearch,
    PanelLeft,
    PanelRight,
    LogOut,
    Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
    activeMenu: string;
    setActiveMenu: (menu: string) => void;
}

export default function Sidebar({ activeMenu, setActiveMenu }: SidebarProps) {
    const [expanded, setExpanded] = useState(true);
    const [showLogout, setShowLogout] = useState(false);
    const [mongoUser, setMongoUser] = useState<any>(null);
    const navigate = useNavigate();


    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${API}/user/profile`, { credentials: "include" });
                const data = await res.json();
                if (res.ok && data.user) {
                    setMongoUser(data.user);
                    localStorage.setItem("user", JSON.stringify(data.user));
                } else {
                    const stored = localStorage.getItem("user");
                    if (stored) setMongoUser(JSON.parse(stored));
                }
            } catch {
                const stored = localStorage.getItem("user");
                if (stored) setMongoUser(JSON.parse(stored));
            }
        };
        fetchUser();
    }, []);

    // ✅ Handle logout for both
    const handleLogout = async () => {
        localStorage.removeItem("user");

        navigate("/auth");
    };

    // ✅ Unified user display
    const displayName =
        mongoUser?.name ||
        mongoUser?.email ||
        "Guest User";

    const displayEmail =
        mongoUser?.email || "guest@example.com";

    const photo =
        mongoUser?.avatar || "https://placehold.co/40x40?text=👤";

    const menu = [
        { label: "Dashboard", icon: LayoutDashboard },
        { label: "Simulations", icon: PlayCircle },
        { label: "Resume Building", icon: FileUser },
        { label: "Resume ATS Checker", icon: ScanSearch },
        {
    label: "Find Jobs",
    icon: Briefcase, // reuse same icon
}
    ];

    return (
        <div className="h-screen bg-white flex items-stretch border-r border-gray-200">
            <div className="p-2 flex">
                <aside
                    className={`flex flex-col justify-between bg-[#F9F9F9] border-[#E5E5E5] border rounded-2xl transition-all duration-300 ${expanded ? "w-62 px-4" : "w-13 px-2"
                        }`}
                    style={{ height: "calc(100vh - 1rem)" }}
                >
                    <div>
                        <div
                            className={`flex items-center py-5 h-20 border-b border-gray-300 ${expanded ? "justify-between" : "justify-center"
                                }`}
                        >
                            {expanded && (
                                <div className="flex items-center gap-2">
                                    <div className="bg-black text-white rounded-lg w-6 h-6 flex items-center justify-center text-[12px] font-bold">
                                        IM
                                    </div>
                                    <div>
                                        <h1 className="font-semibold text-base">InterviewMate</h1>
                                        <p className="text-xs text-gray-500">AI Interview Prep</p>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                {expanded ? (
                                    <PanelLeft className="h-5 w-5" />
                                ) : (
                                    <PanelRight className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        <ul className="space-y-1 mt-4">
                            {menu.map((item) => (
                                <li
                                    key={item.label}
                                    onClick={() => setActiveMenu(item.label)}
                                    className={`flex items-center gap-3 text-sm px-2 py-2 rounded-xl cursor-pointer transition-all ${activeMenu === item.label
                                        ? "bg-[#EAEAEA] text-black"
                                        : "text-gray-700 hover:bg-[#EAEAEA] hover:text-black"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5 text-gray-500" />
                                    {expanded && <span>{item.label}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative border-t border-gray-300 pt-2 pb-2">
                        <div
                            onClick={() => setShowLogout((prev) => !prev)}
                            className={`flex items-center gap-3 cursor-pointer rounded-xl hover:bg-gray-100 transition ${expanded ? "px-3 py-2" : "p-2 px-1 justify-center"
                                }`}
                        >
                            <img
                                src={photo}
                                alt="profile"
                                className="w-6 h-6 rounded-full object-cover"
                            />
                            {expanded && (
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium leading-tight">
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {displayEmail}
                                    </p>
                                </div>
                            )}
                        </div>

                        {showLogout && (
                            <div
                                className={`absolute bottom-16 ${expanded ? "left-3 w-[90%]" : "left-14 w-48"
                                    } z-10`}
                            >
                                <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
