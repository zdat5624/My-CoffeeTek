"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockKeyhole, LogOut, ShieldAlert, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LockedPageContent() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.clear();
        router.push("/auth/login");
    };

    const handleGoHome = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4 font-sans">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-red-500/5 blur-[100px]" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[100px]" />
            </div>

            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-red-500 relative bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center shadow-inner animate-pulse-slow">
                        <LockKeyhole className="w-10 h-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Account Locked
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        Access to your account has been temporarily suspended.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 font-medium leading-relaxed">
                            Please contact the administrator if you believe this is a mistake.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 bg-gray-50/80 p-6 rounded-b-xl border-t">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-gray-300 hover:bg-gray-100"
                        onClick={handleGoHome}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>


                </CardFooter>
            </Card>
        </div>
    );
}