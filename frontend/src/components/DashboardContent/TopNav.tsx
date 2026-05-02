import { Bell, Moon, Info, } from "lucide-react";

export default function TopNav() {
    return (
        <div className="p-2 pb-0">
            <div className="w-full flex items-center justify-between px-6 py-3 bg-[#F9F9F9] border-[#E5E5E5] border rounded-2xl">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="opacity-70">Invoices</span>
                    <span className="opacity-50">/</span>
                    <span className="font-medium text-gray-800">New Invoice</span>
                </div>

                {/* Icons */}
                <div className="flex items-center gap-5 text-gray-700">

                    <Bell className="w-5 h-5 cursor-pointer hover:text-black transition" />
                    <Moon className="w-5 h-5 cursor-pointer hover:text-black transition" />
                    <Info className="w-5 h-5 cursor-pointer hover:text-black transition" />
                </div>
            </div>
        </div>
    );
}