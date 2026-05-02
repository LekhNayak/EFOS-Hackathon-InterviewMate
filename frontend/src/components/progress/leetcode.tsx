import { useEffect, useMemo, useState } from "react";
import { SquareArrowOutUpRight } from "lucide-react";
import LeetCodeSegmentCircle from "./progressbar";

export default function LeetCodeCard({ leetcodeLink }: { leetcodeLink: string }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const username = useMemo(() => {
        const x = leetcodeLink.trim().replace(/\/+$/, "");
        return x.split("/u/")[1];
    }, [leetcodeLink]);

    useEffect(() => {
        if (!username) return;
        const fetchLC = async () => {
            try {
                const res = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
                const data = await res.json();
                setStats(data);
            } finally {
                setLoading(false);
            }
        };
        fetchLC();
    }, [username]);

    const streak = useMemo(() => {
        const cal = stats?.submissionCalendar || {};
        const days = Object.keys(cal).map(Number).map((t) => Math.floor(t / 86400)).sort((a, b) => b - a);
        let c = 0;
        let d = Math.floor(Date.now() / 1000 / 86400);
        while (days.includes(d)) { c++; d--; }
        return c;
    }, [stats]);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-center h-64 text-gray-500 text-sm">
                Loading LeetCode data…
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-center h-64 text-gray-500 text-sm">
                Failed to load data
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 w-full h-64 flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[10px] text-gray-500">LeetCode Progress</p>
                    <h1 className="text-xl font-bold text-gray-900">{stats.totalSolved}</h1>
                    <p className="text-[10px] text-gray-500">Total Solved</p>
                </div>

                <button
                    onClick={() => window.open(leetcodeLink, "_blank")}
                    className="flex items-center text-gray-800 text-[0.8rem] hover:underline"
                >
                    {username} <SquareArrowOutUpRight size={10} className="ml-1" />
                </button>
            </div>

            <div className="flex items-center justify-between flex-1 relative -top-5">
                <div className="space-y-2 text-center px-2">
                    <div className="py-2 px-3 bg-[#fafafa] rounded-lg">
                        <p className="text-[10px] text-gray-500">Ranking</p>
                        <p className="text-lg font-semibold text-gray-800">#{stats.ranking}</p>
                    </div>
                    <div className="py-2 px-3 bg-[#fafafa] rounded-lg">
                        <p className="text-[10px] text-gray-500">Streak</p>
                        <p className="text-lg font-semibold text-gray-800">{streak} days</p>
                    </div>
                </div>

                <div className="flex items-center justify-center w-full h-4/5">
                    <LeetCodeSegmentCircle
                        totalEasy={stats.totalEasy}
                        totalMedium={stats.totalMedium}
                        totalHard={stats.totalHard}
                        solvedEasy={stats.easySolved}
                        solvedMedium={stats.mediumSolved}
                        solvedHard={stats.hardSolved}
                    />
                </div>

                <div className="space-y-2 text-center px-2 text-[10px]">
                    <div className="p-2 bg-[#fafafa] rounded-lg">
                        <p className="text-[#1CBABA] font-medium">Easy</p>
                        <p className="text-gray-800 font-semibold">{stats.easySolved}/{stats.totalEasy}</p>
                    </div>
                    <div className="p-2 bg-[#fafafa] rounded-lg">
                        <p className="text-[#FFB700] font-medium">Medium</p>
                        <p className="text-gray-800 font-semibold">{stats.mediumSolved}/{stats.totalMedium}</p>
                    </div>
                    <div className="p-2 bg-[#fafafa] rounded-lg">
                        <p className="text-[#F63737] font-medium">Hard</p>
                        <p className="text-gray-800 font-semibold">{stats.hardSolved}/{stats.totalHard}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
