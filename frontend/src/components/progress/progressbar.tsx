import { Check } from "lucide-react";

interface Props {
    totalEasy: number;
    totalMedium: number;
    totalHard: number;
    solvedEasy: number;
    solvedMedium: number;
    solvedHard: number;
}

// Colors configuration
const COLORS = {
    background: {
        easy: "#D2F1F1",
        medium: "#FFF1CC",
        hard: "#FDD7D7",
    },
    solved: {
        easy: "#1CBABA",
        medium: "#FFB700",
        hard: "#F63737",
    },
};

export default function LeetCodeSegmentCircle({
    totalEasy,
    totalMedium,
    totalHard,
    solvedEasy,
    solvedMedium,
    solvedHard,
}: Props) {
    const total = totalEasy + totalMedium + totalHard;
    const totalSolved = solvedEasy + solvedHard + solvedMedium;
    const arcAngle = 270;
    const startAngle = (360 - arcAngle) / 2;
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const visibleLength = (arcAngle / 360) * circumference;

    const gap = 6;

    const stroke = 4;

    const totalVisible = visibleLength - 2 * gap;
    const easyArc = (totalEasy / total) * totalVisible;
    const mediumArc = (totalMedium / total) * totalVisible;
    const hardArc = (totalHard / total) * totalVisible;

    const easySolvedArc = (solvedEasy / totalEasy) * easyArc;
    const mediumSolvedArc = (solvedMedium / totalMedium) * mediumArc;
    const hardSolvedArc = (solvedHard / totalHard) * hardArc;

    const offsets = {
        easy: 0,
        medium: easyArc + gap,
        hard: easyArc + mediumArc + 2 * gap,
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center -rotate-90">
            <svg
                viewBox="0 0 100 100"
                className="-rotate-90 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Background segments */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={COLORS.background.easy}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${easyArc} ${circumference - easyArc}`}
                    strokeDashoffset={circumference * (startAngle / 360) - offsets.easy}
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={COLORS.background.medium}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${mediumArc} ${circumference - mediumArc}`}
                    strokeDashoffset={circumference * (startAngle / 360) - offsets.medium}
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={COLORS.background.hard}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${hardArc} ${circumference - hardArc}`}
                    strokeDashoffset={circumference * (startAngle / 360) - offsets.hard}
                />

                {/* Solved arcs */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={COLORS.solved.easy}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${easySolvedArc} ${circumference - easySolvedArc}`}
                    strokeDashoffset={circumference * (startAngle / 360) - offsets.easy}
                    strokeLinecap="round"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={COLORS.solved.medium}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${mediumSolvedArc} ${circumference - mediumSolvedArc}`}
                    strokeDashoffset={circumference * (startAngle / 360) - offsets.medium}
                    strokeLinecap="round"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={COLORS.solved.hard}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${hardSolvedArc} ${circumference - hardSolvedArc}`}
                    strokeDashoffset={circumference * (startAngle / 360) - offsets.hard}
                    strokeLinecap="round"
                />
            </svg>

            <div className="absolute rotate-90 text-center  justify-center">

                <div className="" >
                    <span className="text-2xl font-semibold">{totalSolved}</span>/<span>{total}</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-700">
                    <Check className="w-3 h-3 text-green-600" /> Solved
                </div>

            </div>
        </div >
    );
}
