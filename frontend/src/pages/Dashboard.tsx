import { useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

import DashboardHome from "@/components/DashboardContent/DashboardHome";
import Simulations from "@/components/DashboardContent/Simulations";
import Test from "@/components/DashboardContent/test";
import ATSChecker from "@/components/DashboardContent/ATSChecker";
import TopNav from "@/components/DashboardContent/TopNav";

export default function Dashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeMenu, setActiveMenu] = useState(searchParams.get("tab") || "");
    const [search, setSearch] = useState("");

    const handleMenuChange = (menu: string) => {
        setActiveMenu(menu);
        setSearchParams({ tab: menu }, { replace: true });
    };

    const scroll = (children: ReactNode) => (
        <div className="flex-1 overflow-y-auto">{children}</div>
    );

    const renderContent = () => {
        switch (activeMenu) {
            case "Dashboard":
                return scroll(<DashboardHome />);
            case "Simulations":
                return scroll(<Simulations search={search} setSearch={setSearch} />);
            case "Resume Building":
                return scroll(<Test />);
            case "Resume ATS Checker":
                return <ATSChecker />;
            default:
                return scroll(<DashboardHome />);
        }
    };

    return (
        <div className="min-h-screen flex">
            <Sidebar activeMenu={activeMenu} setActiveMenu={handleMenuChange} />
            <main className="flex-1 overflow-hidden flex flex-col">
                <TopNav />
                {renderContent()}
            </main>
        </div>
    );
}
