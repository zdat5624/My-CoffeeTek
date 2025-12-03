"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    User,
    ShoppingBag,
    Lock,
    Camera,
    ChevronRight,
    LogOut,
    Crown,
    Gem,
    Loader2,
    UploadCloud,
    ImagePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { userService, MyPointResponse } from "@/services/userService";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { STORAGE_KEYS } from "@/lib/constant/storageKey.constant";

// --- Shadcn Components ---
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ProfileSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    // ✅ Lấy thêm biến loading từ context
    const { user, setUser, setIsAuthenticated, loading: authLoading } = useAuthContext();

    // --- STATE ---
    const [pointData, setPointData] = useState<MyPointResponse | null>(null);
    const [loadingPoints, setLoadingPoints] = useState(true);

    // Logout State
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    // Avatar Upload State
    const [showAvatarDialog, setShowAvatarDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- 1. Fetch Points ---
    useEffect(() => {
        const fetchPoints = async () => {
            // Chỉ fetch khi user đã load xong
            if (!user) return;
            try {
                const data = await userService.getMyPoints();
                setPointData(data);
            } catch (error) {
                console.error("Failed to fetch points:", error);
            } finally {
                setLoadingPoints(false);
            }
        };

        // Nếu auth đang load thì chưa fetch vội
        if (!authLoading && user) {
            fetchPoints();
        }
    }, [user, authLoading]);

    // --- 2. Helper Functions ---
    const getAvatarUrl = (url?: string) => {
        if (!url) return "https://github.com/shadcn.png";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${url}`;
    };

    const formatPoint = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    // --- 3. Handle Avatar Logic ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File is too large. Please select an image under 5MB.");
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSaveAvatar = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            await userService.updateAvatar(selectedFile);

            if (user) {
                const updatedUser = await authService.getUserLoginInfo();
                setUser(updatedUser);
                localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
            }

            toast.success("Profile picture updated successfully!");
            handleCloseAvatarDialog();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile picture.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCloseAvatarDialog = () => {
        setShowAvatarDialog(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // --- 4. Handle Logout ---
    const confirmLogout = () => {
        localStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
        setShowLogoutDialog(false);
        router.push("/auth/login");
        toast.success("Logged out successfully");
    };

    // --- RENDER PREPARATION ---
    const menuItems = [
        { href: '/profile/info', label: 'Personal Info', icon: User },
        { href: '/profile/orders', label: 'My Orders', icon: ShoppingBag },
        { href: '/profile/security', label: 'Change Password', icon: Lock },
    ];
    const isActive = (path: string) => pathname === path;
    const displayName = user ? `${user.first_name} ${user.last_name}` : "User";
    const currentDisplayAvatar = previewUrl || getAvatarUrl(user?.detail?.avatar_url);

    // ✅ SKELETON LOADING STATE
    // Nếu Auth đang loading, hiển thị khung xương để tránh nháy ảnh mặc định
    if (authLoading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit sticky top-24 p-6">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="w-24 h-24 rounded-full bg-gray-200 mb-3" />
                    <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
                    <div className="w-full h-24 bg-gray-100 rounded-xl mb-6" />
                    <div className="w-full space-y-4">
                        <div className="h-10 w-full bg-gray-100 rounded-lg" />
                        <div className="h-10 w-full bg-gray-100 rounded-lg" />
                        <div className="h-10 w-full bg-gray-100 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit sticky top-24">

                {/* --- HEADER --- */}
                <div className="p-6 bg-gradient-to-b from-emerald-50/50 to-white text-center border-b border-gray-100">
                    <div className="relative inline-block group">
                        <img
                            src={getAvatarUrl(user?.detail?.avatar_url)}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto mb-3 transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => { e.currentTarget.src = "https://github.com/shadcn.png"; }}
                        />
                        {/* Trigger Avatar Dialog */}
                        <button
                            onClick={() => setShowAvatarDialog(true)}
                            className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white hover:bg-emerald-700 transition-colors shadow-sm border-2 border-white cursor-pointer"
                        >
                            <Camera size={14} />
                        </button>
                    </div>

                    <h3 className="font-bold text-gray-900 text-xl mb-1">{displayName}</h3>
                    <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

                    {/* Loyalty Card */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-md mx-auto max-w-[240px]">
                        <div className="bg-white/10 backdrop-blur-[2px] rounded-[10px] p-3 text-white">
                            {loadingPoints ? (
                                <div className="flex justify-center py-2">
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-col items-start">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-100 uppercase tracking-wider">
                                            <Crown size={12} className="fill-amber-200 text-amber-200" />
                                            <span>Rank</span>
                                        </div>
                                        <div className="font-bold text-base mt-0.5 text-white drop-shadow-sm">
                                            {pointData?.loyalLevel?.name || "Member"}
                                        </div>
                                    </div>
                                    <div className="w-[1px] h-8 bg-white/30"></div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-100 uppercase tracking-wider">
                                            <span>Points</span>
                                            <Gem size={12} className="fill-amber-200 text-amber-200" />
                                        </div>
                                        <div className="font-extrabold text-xl mt-0.5 text-white drop-shadow-sm tabular-nums">
                                            {pointData?.points ? formatPoint(pointData.points) : 0}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
                            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-amber-300/20 rounded-full blur-xl pointer-events-none"></div>
                        </div>
                    </div>
                </div>

                {/* --- MENU --- */}
                <div className="p-3 mt-1">
                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive(item.href)
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100/50"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} className={isActive(item.href) ? "text-emerald-600" : "text-gray-400"} />
                                    {item.label}
                                </div>
                                {isActive(item.href) && <ChevronRight size={16} className="text-emerald-500" />}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* --- LOGOUT BUTTON --- */}
                <div className="p-4 mt-2 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={() => setShowLogoutDialog(true)}
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3"
                    >
                        <LogOut size={18} /> Sign Out
                    </Button>
                </div>
            </div>

            {/* --- 1. AVATAR UPLOAD DIALOG --- */}
            <Dialog open={showAvatarDialog} onOpenChange={handleCloseAvatarDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Profile Picture</DialogTitle>
                        <DialogDescription>
                            Choose a new image for your avatar. Supported formats: JPG, PNG.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center gap-6 py-4">
                        {/* Preview Area - Wrapped in Label */}
                        <div className="relative group cursor-pointer">
                            <Label htmlFor="avatar-upload" className="cursor-pointer block relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-inner">
                                    <img
                                        src={currentDisplayAvatar}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = "https://github.com/shadcn.png"; }}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ImagePlus className="text-white w-8 h-8" />
                                </div>
                            </Label>
                        </div>

                        <Input
                            ref={fileInputRef}
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                            >
                                <UploadCloud className="mr-2 h-4 w-4" />
                                {selectedFile ? "Change Image" : "Upload Image"}
                            </Button>

                            {selectedFile && (
                                <span className="text-xs text-gray-500 max-w-[200px] truncate">
                                    Selected: {selectedFile.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between flex-row gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCloseAvatarDialog}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveAvatar}
                            disabled={!selectedFile || isUploading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- 2. LOGOUT ALERT DIALOG --- */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will log you out.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmLogout}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                        >
                            Sign Out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};