import { SquareArrowOutUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

export default function CodeforcesCard({ codeforcesLink }: { codeforcesLink: string }) {
    const [data, setData] = useState<any>(null);
    const [ratingHistory, setRatingHistory] = useState<any[]>([]);


    const username = useMemo(() => {
        if (!codeforcesLink) return "";
        const clean = codeforcesLink.trim().replace(/\/+$/, "");
        return clean.split("/profile/")[1] || "";
    }, [codeforcesLink]);

    useEffect(() => {
        if (!username) return; // ⛔ Prevent early fetch when link is empty

        async function fetchData() {
            try {
                const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
                const info = await infoRes.json();

                const histRes = await fetch(`https://codeforces.com/api/user.rating?handle=${username}`);
                const histData = await histRes.json();

                if (info.status === "OK" && histData.status === "OK") {
                    setData(info.result[0]);
                    setRatingHistory(histData.result.slice(-8));
                }
            } catch (err) {
                console.error("Error fetching Codeforces data:", err);
            }
        }

        fetchData();
    }, [username]);


    if (!data || !ratingHistory.length) {
        return (
            <div className="p-6 rounded-2xl bg-white shadow-sm border text-gray-600 text-sm">
                Loading Codeforces data…
            </div>
        );
    }

    // Prepare chart data
    const chartData = ratingHistory.map((r, i) => ({
        name: `#${i + 1}`,
        rating: r.newRating,
        contestName: r.contestName,
        contestId: r.contestId,
        date: new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString(),
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const { contestName, date, rating } = payload[0].payload;
            const truncatedName =
                contestName.length > 22
                    ? contestName.substring(0, 22) + "..."
                    : contestName;
            return (
                <div className="bg-white border border-gray-200 rounded-md p-2 shadow-md text-[10px]">
                    <p className="font-semibold text-gray-800">{truncatedName}</p>
                    <p className="text-gray-600">Rating: {rating}</p>
                    <p className="text-gray-400">{date}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 bg-white border border-gray-200 rounded-2xl w-full h-64 flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-[10px] font-medium text-gray-500">
                        Codeforces Rating Trend
                    </h2>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {data.rating || "Unrated"}
                    </h1>
                    <p className="text-[10px] text-gray-500">Last 8 contests</p>
                </div>
                <div className="text-right">
                    <button
                        onClick={() => window.open(`https://codeforces.com/profile/${data.handle}`, "_blank")}
                        className="flex items-center text-gray-800 text-[0.8rem] hover:underline"
                    >
                        {data.handle} <SquareArrowOutUpRight size={10} className="ml-2" />
                    </button>
                    <p className="text-[10px] text-gray-500 mt-1">Max Rating</p>
                    <p className="text-xs font-semibold text-gray-800">
                        {data.maxRating || "N/A"}
                    </p>
                </div>
            </div>

            {/* Graph */}
            <div className="flex-1 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        barGap={0}
                        barCategoryGap={0}
                    >
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            fontSize={10}
                            tickMargin={4}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                        <Bar
                            dataKey="rating"
                            radius={[4, 4, 0, 0]}
                            fill="#FF8181"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <p>
                    Rank:{" "}
                    <span className="text-gray-800 font-medium">
                        {data.rank || "—"}
                    </span>
                </p>
                <p>
                    Contests:{" "}
                    <span className="text-gray-800 font-medium">
                        {ratingHistory.length}
                    </span>
                </p>
                <p>
                    Max:{" "}
                    <span className="text-gray-800 font-medium">
                        {data.maxRank || "—"}
                    </span>
                </p>
            </div>
        </div>
    );
}
