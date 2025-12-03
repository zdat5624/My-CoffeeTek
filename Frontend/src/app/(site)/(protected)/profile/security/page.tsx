"use client";

import React, { useState, useEffect } from "react";
import {
    Eye,
    EyeOff,
    Lock,
    Save,
    Loader2,
    ShieldCheck,
    KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";

export default function SecurityPage() {
    const { user } = useAuthContext();

    // Loading State
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    // Visibility State
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Form Data
    const [passForm, setPassForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // --- HANDLE CHANGE PASSWORD ---
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation Client-side
        if (!passForm.oldPassword) {
            toast.error("Please enter your current password.");
            return;
        }
        if (passForm.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters.");
            return;
        }
        if (passForm.newPassword !== passForm.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        if (passForm.oldPassword === passForm.newPassword) {
            toast.error("New password must be different from the old one.");
            return;
        }

        setIsPasswordLoading(true);

        try {
            // 2. Call Service
            await authService.changePassword({
                oldPassword: passForm.oldPassword,
                newPassword: passForm.newPassword
            });

            toast.success("Password changed successfully!");

            // 3. Reset Form
            setPassForm({
                oldPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || "Failed to change password.";
            toast.error(msg);
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
            {/* --- HEADER --- */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" size={24} />
                    Security Settings
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your password and account security.
                </p>
            </div>

            <div className="p-6 max-w-2xl">
                {/* --- CHANGE PASSWORD FORM --- */}
                <form onSubmit={handleChangePassword} className="space-y-6">

                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
                        <KeyRound className="text-gray-400" size={18} />
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Change Password
                        </h3>
                    </div>

                    {/* Old Password */}
                    <div className="space-y-2">
                        <Label htmlFor="old-pass">Current Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="old-pass"
                                type={showOldPass ? "text" : "password"}
                                value={passForm.oldPassword}
                                onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                                className="pl-9 pr-10 focus-visible:ring-emerald-500"
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPass(!showOldPass)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="new-pass">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="new-pass"
                                    type={showNewPass ? "text" : "password"}
                                    value={passForm.newPassword}
                                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                                    className="pl-9 pr-10 focus-visible:ring-emerald-500"
                                    placeholder="Min 6 chars"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPass(!showNewPass)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm-pass">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="confirm-pass"
                                    type={showConfirmPass ? "text" : "password"}
                                    value={passForm.confirmPassword}
                                    onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                                    className="pl-9 pr-10 focus-visible:ring-emerald-500"
                                    placeholder="Re-enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50-50 border border-green-100 rounded-lg p-4 text-sm text-green-700">
                        <p className="font-medium mb-1">Password Requirements:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-green-600/80 text-xs">
                            <li>Minimum 6 characters long</li>
                            <li>Should contain at least one number</li>
                            <li>Should contain at least one special character</li>
                        </ul>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={isPasswordLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]"
                        >
                            {isPasswordLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Update Password
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}