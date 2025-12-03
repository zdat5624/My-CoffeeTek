"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Home, ChevronRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { MOCK_ORDERS } from "./shared";
import { ProfileSidebar } from "./ProfileSidebar";

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">
            <main className="container mx-auto px-4 py-8">

                {/* --- HERO / HEADER SECTION (Dùng chung cho mọi tab) --- */}
                <div className="relative bg-gradient-to-r from-emerald-50 to-white rounded-3xl p-6 mb-8 overflow-hidden border border-emerald-100 shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-4">
                            <span className="cursor-pointer hover:underline flex items-center gap-1" onClick={() => router.push('/')}>
                                <Home size={14} /> Home
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                            <span className="text-gray-500">My Profile</span>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                                    <ShieldCheck className="text-emerald-600" size={28} />
                                    Account Settings
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Manage your personal info, order history, and security.
                                </p>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm flex items-center gap-2 text-sm text-emerald-700">
                                <ShoppingBag size={16} />
                                Total Orders: <span className="font-bold">{MOCK_ORDERS.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN LAYOUT GRID --- */}
                <div className="flex flex-col md:flex-row gap-8">
                    {/* LEFT SIDEBAR */}
                    <aside className="w-full md:w-72 flex-shrink-0">
                        <ProfileSidebar />
                    </aside>

                    {/* RIGHT CONTENT (Thay đổi theo Route) */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>

            </main>
        </div>
    );
}