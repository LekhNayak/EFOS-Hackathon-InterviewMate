import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Sparkle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header: FC = () => {
    const navigate = useNavigate();

    return (
        <header className="absolute container z-10 mx-auto px-6 py-4 rounded-lg">
            <nav className="flex items-stretch justify-between">
                <div className="flex gap-3 bg-[#F2F2F2] backdrop-blur-sm rounded-full px-0 py-0 items-center">
                    <div className="rounded-lg flex items-center justify-center">
                        <Sparkle className="text-white rounded-full bg-[#252525]" />
                    </div>
                    <span className="text-lg font-medium tracking-wide text-foreground pr-4">
                        InterviewMate
                    </span>
                </div>
                <div className="flex gap-3 bg-[#F2F2F2] backdrop-blur-sm rounded-full  items-center">
                    <Button variant="ghost" onClick={() => navigate("/auth")}>
                        Sign In
                    </Button>
                    <Button
                        onClick={() => navigate("/auth")}
                        className="bg-[#252525] text-white rounded-full pr-4"
                    >
                        Get Started
                    </Button>
                </div>
            </nav>
        </header>
    );
};

export default Header;
