"use client";

import React, { useEffect, useState } from "react";
import {
    Mail,
    Phone,
    MapPin,
    Save,
    Calendar,
    User as UserIcon,
    Loader2,
    Lock,
    Pencil,
    Mars,
    Venus,
    VenusAndMars
} from "lucide-react";
// ... (các import khác giữ nguyên)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { userService, UpdateUserDto } from "@/services/userService";
import { authService } from "@/services/authService";
import { STORAGE_KEYS } from "@/lib/constant/storageKey.constant";
import { GenderEnum } from "@/enum";

export default function PersonalInfoPage() {
    // ... (state và logic giữ nguyên)
    const { user, setUser } = useAuthContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        birthday: "",
        sex: "other" as GenderEnum,
    });

    // ... (useEffect và handleSave/Cancel giữ nguyên)
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.first_name || "",
                lastName: user.last_name || "",
                email: user.email || "",
                phone: user.phone_number || "",
                address: user.detail?.address || "",
                birthday: user.detail?.birthday ? new Date(user.detail.birthday).toISOString().split('T')[0] : "",
                sex: (user.detail?.sex as GenderEnum) || GenderEnum.OTHER,
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const updateData: UpdateUserDto = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                address: formData.address,
                sex: formData.sex,
                birthday: formData.birthday ? new Date(formData.birthday).toISOString() : undefined,
            };
            await userService.updateInfo(user.detail.id, updateData);
            const updatedUser = await authService.getUserLoginInfo();
            setUser(updatedUser);
            localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.first_name || "",
                lastName: user.last_name || "",
                address: user.detail?.address || "",
                birthday: user.detail?.birthday ? new Date(user.detail.birthday).toISOString().split('T')[0] : "",
                sex: (user.detail?.sex as GenderEnum) || GenderEnum.OTHER,
            }));
        }
    };

    // Style helpers
    const getFieldClass = (isEditing: boolean) =>
        isEditing
            ? "bg-white focus-visible:ring-emerald-500 border-input shadow-sm"
            : "bg-gray-50 border-gray-100 shadow-none cursor-default focus-visible:ring-0 text-gray-900 font-medium";

    const getIconClass = (isEditing: boolean) =>
        `absolute left-3 top-2.5 h-4 w-4 ${isEditing ? "text-gray-500" : "text-gray-400"}`;

    const getGenderIcon = (sex: string) => {
        switch (sex) {
            case 'male': return Mars;
            case 'female': return Venus;
            default: return VenusAndMars;
        }
    };

    const GenderIcon = getGenderIcon(formData.sex);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
            {/* Header giữ nguyên */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your personal details and contact information.</p>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto">
                        <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={handleCancel} variant="ghost" disabled={isLoading} className="flex-1 sm:flex-none">Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 flex-1 sm:flex-none">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />} Save Changes
                        </Button>
                    </div>
                )}
            </div>

            {/* Form Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                {/* First Name */}
                <div className="space-y-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">First Name</Label>
                    <div className="relative">
                        <UserIcon className={getIconClass(isEditing)} />
                        <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            readOnly={!isEditing}
                            className={`pl-9 ${getFieldClass(isEditing)}`}
                        />
                    </div>
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Last Name</Label>
                    <div className="relative">
                        <UserIcon className={getIconClass(isEditing)} />
                        <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            readOnly={!isEditing}
                            className={`pl-9 ${getFieldClass(isEditing)}`}
                        />
                    </div>
                </div>

                {/* Birthday */}
                <div className="space-y-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Date of Birth</Label>
                    <div className="relative">
                        <Calendar className={getIconClass(isEditing)} />
                        <Input
                            type="date"
                            value={formData.birthday}
                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            readOnly={!isEditing}
                            className={`pl-9 ${getFieldClass(isEditing)}`}
                        />
                    </div>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Gender</Label>
                    <div className="relative">
                        {/* ✅ FIX: Chỉ hiển thị Icon động khi KHÔNG edit */}
                        {!isEditing && <GenderIcon className={getIconClass(isEditing)} />}

                        {isEditing ? (
                            <Select
                                value={formData.sex}
                                onValueChange={(value) => setFormData({ ...formData, sex: value as GenderEnum })}
                            >
                                <SelectTrigger className="w-full focus:ring-emerald-500 bg-white">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">
                                        <div className="flex items-center gap-2">
                                            <Mars size={14} className="text-blue-500" /> Male
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="female">
                                        <div className="flex items-center gap-2">
                                            <Venus size={14} className="text-rose-500" /> Female
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="other">
                                        <div className="flex items-center gap-2">
                                            <VenusAndMars size={14} className="text-purple-500" /> Other
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            // Read-only view
                            <div className={`flex h-10 w-full items-center rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 shadow-none pl-9`}>
                                {formData.sex ? formData.sex.charAt(0).toUpperCase() + formData.sex.slice(1) : "Other"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Address</Label>
                    <div className="relative">
                        <MapPin className={getIconClass(isEditing)} />
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            readOnly={!isEditing}
                            className={`pl-9 ${getFieldClass(isEditing)}`}
                        />
                    </div>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 my-2"></div>

                {/* Email */}
                <div className="space-y-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Email Address</Label>
                    <div className="relative">
                        <Mail className={getIconClass(isEditing)} />
                        <Input
                            value={formData.email}
                            disabled={true}
                            className="pl-9 bg-gray-50/50 text-gray-500 cursor-not-allowed border-gray-100"
                        />
                        <Lock className="absolute right-3 top-2.5 h-3 w-3 text-gray-300" />
                    </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Phone Number</Label>
                    <div className="relative">
                        <Phone className={getIconClass(isEditing)} />
                        <Input
                            value={formData.phone}
                            disabled={true}
                            className="pl-9 bg-gray-50/50 text-gray-500 cursor-not-allowed border-gray-100"
                        />
                        <Lock className="absolute right-3 top-2.5 h-3 w-3 text-gray-300" />
                    </div>
                </div>

            </div>
        </div>
    );
}