import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
    { name: "Apr", value: 90 },
    { name: "May", value: 120 },
    { name: "Jun", value: 160 },
    { name: "Jul", value: 130 },
    { name: "Aug", value: 200 },
    { name: "Sep", value: 140 },
    { name: "Oct", value: 150 },
    { name: "Nov", value: 170 }
];

export default function ProgressGraph() {
    const highlightIndex = 4;
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 flex flex-col ">
            <div className="flex justify-between mb-2">
                <div>
                    <p className="text-sm text-gray-500">Avg Per Month</p>
                    <p className="text-xl font-semibold">1,860/3K <span className="text-green-500 text-sm">50.2% ↑</span></p>
                </div>
                <button className="text-sm border px-2 py-1 rounded-md text-gray-600">Last Month ▾</button>
            </div>

            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={false} />
                        <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                            {data.map((_NULL, index) => (
                                <Cell
                                    key={index}
                                    fill={index === highlightIndex ? "#4B5563" : "#E5E7EB"}
                                    opacity={index === highlightIndex ? 1 : 0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
