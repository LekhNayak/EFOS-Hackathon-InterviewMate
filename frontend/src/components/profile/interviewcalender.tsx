import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthData {
    name: string;
    days: (number | null)[];
}

// Color levels:
// 0 -> no interviews
// 1 -> first color
// 2 -> second color
// 3+ -> third color
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const colors: Record<number, string> = {
    0: "#f5f5f5",
    1: "#ACEEBB",
    2: "#4AC26B",
    3: "#2DA44E"
};

function normalizeDate(input: any) {
    if (!input) return null;
    const d = new Date(input);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
}

// Generate month with fixed 6x7 grid
function generateMonth(year: number, month: number): MonthData {
    const date = new Date(year, month, 1);
    const name = date.toLocaleString("default", { month: "long" });
    const days: (number | null)[] = [];

    // Add nulls for first empty days
    for (let i = 0; i < date.getDay(); i++) days.push(null);

    // Fill actual days
    while (date.getMonth() === month) {
        days.push(date.getDate());
        date.setDate(date.getDate() + 1);
    }

    // Fill trailing nulls to complete 6x7 grid
    while (days.length < 42) days.push(null);

    return { name, days };
}

export default function InterviewCalendar({ userId }: { userId: string }) {
    const [occurrences, setOccurrences] = useState<Record<string, number>>({});
    const [months, setMonths] = useState<MonthData[]>([]);
    const [current, setCurrent] = useState(new Date().getMonth());
    const fetched = useRef(false);

    useEffect(() => {
        if (!userId || fetched.current) return;
        fetched.current = true;

        const fetchInterviews = async () => {
            try {
                const res = await fetch(`${BASE_URL}/interview/user`, {
                    method: "GET",
                    credentials: "include", // this ensures cookies are sent
                    headers: {
                        "Content-Type": "application/json"
                    },
                });
                const data = await res.json();
                if (data.success) {
                    const counts: Record<string, number> = {};
                    data.interviews.forEach((i: any) => {
                        const date = normalizeDate(i.createdAt);
                        if (!date) return;
                        counts[date] = (counts[date] || 0) + 1;
                    });
                    setOccurrences(counts);
                }
            } catch (err) {
                console.error("Error fetching interviews:", err);
            }
        };

        fetchInterviews();

        const year = new Date().getFullYear();
        const allMonths = Array.from({ length: 12 }, (_, i) => generateMonth(year, i));
        setMonths(allMonths);
    }, [userId]);

    if (!months.length) return <div>Loading...</div>;

    const month = months[current];
    const today = new Date();
    const prev = () => setCurrent(c => (c === 0 ? 11 : c - 1));
    const next = () => setCurrent(c => (c === 11 ? 0 : c + 1));

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
                <button onClick={prev}><ChevronLeft size={18} /></button>
                <div className="font-semibold text-gray-700">{month.name} {today.getFullYear()}</div>
                <button onClick={next}><ChevronRight size={18} /></button>
            </div>

            <div className="grid grid-cols-7 px-4 text-[10px] text-center text-gray-500 mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            <div className="grid gap-2 px-4 " style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
                {month.days.map((d, i) => {
                    if (!d) return (
                        <div
                            key={i}
                            className="rounded-full aspect-square flex items-center justify-center border border-dashed border-gray-300"
                        />
                    );

                    const dateStr = `${today.getFullYear()}-${String(current + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

                    const count = occurrences[dateStr] || 0;
                    let level = 0;
                    if (count === 1) level = 1;
                    else if (count === 2) level = 2;
                    else if (count >= 3) level = 3;

                    const isToday = today.getDate() === d && today.getMonth() === current;

                    return (
                        <div
                            key={i}
                            className={`rounded-full aspect-square flex items-center justify-center text-[10px] font-semibold ${isToday ? "ring-2 ring-blue-500" : ""}`}
                            style={{
                                background: colors[level],
                            }}
                        >
                            {d}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
