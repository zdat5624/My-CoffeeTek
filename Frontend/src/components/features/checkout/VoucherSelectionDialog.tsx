"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Ticket, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Voucher } from "@/interfaces/types";
import { voucherService } from "@/services/voucherService";
import { useAuthContext } from "@/contexts/AuthContext"; // ✅ 1. Import Auth Context

// Helper format currency
const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

interface VoucherSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedVoucher: Voucher | null;
    onSelect: (voucher: Voucher | null) => void;
    subtotal: number;
    customerPhone?: string;
}

export const VoucherSelectionDialog: React.FC<VoucherSelectionDialogProps> = ({
    open,
    onOpenChange,
    selectedVoucher,
    onSelect,
    subtotal,
    customerPhone // Nhận prop dự phòng
}) => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inputCode, setInputCode] = useState("");
    const [isCheckingCode, setIsCheckingCode] = useState(false);

    // ✅ 2. Lấy user từ Context
    const { user } = useAuthContext();

    // Xác định số điện thoại: Ưu tiên từ User Context -> Prop -> Rỗng
    const effectivePhone = user?.phone_number || customerPhone || "";

    // --- PAGINATION STATE ---
    const ITEMS_PER_PAGE = 5;
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    useEffect(() => {
        if (open) {
            // Chỉ fetch nếu có số điện thoại
            if (effectivePhone) {
                fetchUserVouchers(effectivePhone);
            }
            setInputCode("");
            setVisibleCount(ITEMS_PER_PAGE);
        }
    }, [open, effectivePhone]);

    const fetchUserVouchers = async (phone: string) => {
        setIsLoading(true);
        try {
            const data = await voucherService.getUserActiveVoucher(phone);
            setVouchers(data);
        } catch (error) {
            console.error("Failed to load vouchers:", error);
            toast.error("Failed to load your vouchers");
        } finally {
            setIsLoading(false);
        }
    };

    // --- FILTER UNIQUE VOUCHERS ---
    const uniqueVouchers = useMemo(() => {
        const seenNames = new Set<string>();
        return vouchers.filter((v) => {
            const name = v.voucher_name || v.group_name || "Unknown";
            if (seenNames.has(name)) {
                return false;
            }
            seenNames.add(name);
            return true;
        });
    }, [vouchers]);

    // --- CLIENT-SIDE PAGINATION ---
    const displayedVouchers = uniqueVouchers.slice(0, visibleCount);
    const hasMore = visibleCount < uniqueVouchers.length;

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    };

    const handleApplyCode = async () => {
        if (!inputCode.trim()) return;

        setIsCheckingCode(true);
        try {
            const voucher = await voucherService.getByCode(inputCode.trim());

            if (!voucher) {
                toast.error("Voucher not found");
                return;
            }

            if (!voucher.is_active) {
                toast.error("Voucher is inactive");
                return;
            }

            const exists = vouchers.find(v => v.id === voucher.id);
            if (!exists) {
                setVouchers([voucher, ...vouchers]);
            }

            if (subtotal >= voucher.minAmountOrder) {
                onSelect(voucher);
                toast.success("Voucher applied successfully!");
                onOpenChange(false);
            } else {
                toast.warning(`Order needs to be at least ${formatVND(voucher.minAmountOrder)}`);
            }
        } catch (error) {
            toast.error("Invalid voucher code");
        } finally {
            setIsCheckingCode(false);
        }
    };

    const handleSelectVoucher = (voucher: Voucher) => {
        if (subtotal < voucher.minAmountOrder) {
            toast.error(`Minimum order amount is ${formatVND(voucher.minAmountOrder)}`);
            return;
        }

        if (selectedVoucher?.id === voucher.id) {
            onSelect(null);
        } else {
            onSelect(voucher);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* ✅ FIX LAYOUT: 
                - Thêm `max-h-[90vh]`: Giới hạn chiều cao tối đa 90% màn hình để không bị tràn.
                - Giữ `flex flex-col` để phần header/footer cố định, phần giữa scroll.
            */}
            <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh] h-auto">
                <DialogHeader>
                    <DialogTitle>Select Voucher</DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 my-2 shrink-0">
                    <Input
                        placeholder="Enter voucher code"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
                    />
                    <Button onClick={handleApplyCode} disabled={isCheckingCode || !inputCode}>
                        {isCheckingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        </div>
                    ) : vouchers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Ticket className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p>You don't have any vouchers yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 py-2">
                            {displayedVouchers.map((voucher) => {
                                const isApplicable = subtotal >= voucher.minAmountOrder;
                                const isSelected = selectedVoucher?.id === voucher.id;

                                return (
                                    <div
                                        key={voucher.id}
                                        className={`
                                            relative p-4 rounded-xl border transition-all cursor-pointer select-none
                                            ${!isApplicable
                                                ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                                                : isSelected
                                                    ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                                                    : "bg-white border-gray-200 hover:border-emerald-200 hover:shadow-sm"
                                            }
                                        `}
                                        onClick={() => {
                                            if (isApplicable) handleSelectVoucher(voucher);
                                        }}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className={`
                                                w-12 h-12 rounded-lg flex items-center justify-center shrink-0
                                                ${isSelected ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}
                                            `}>
                                                <Ticket size={24} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 truncate pr-2">{voucher.voucher_name}</h4>
                                                    <span className={`text-sm font-bold whitespace-nowrap ${isSelected ? "text-emerald-700" : "text-gray-700"}`}>
                                                        {voucher.discount_percentage}% OFF
                                                    </span>
                                                </div>

                                                <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 inline-block px-1.5 py-0.5 rounded">
                                                    {voucher.code}
                                                </p>

                                                <div className="mt-2 flex items-center justify-between text-xs">
                                                    <span className={isApplicable ? "text-gray-500" : "text-red-500 font-medium"}>
                                                        Min. order: {formatVND(voucher.minAmountOrder)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Check Icon Centered Vertically on Right */}
                                        {isSelected && (
                                            <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-50" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* LOAD MORE BUTTON */}
                            {hasMore && (
                                <div className="pt-2 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLoadMore}
                                        className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                                    >
                                        <ChevronDown className="w-4 h-4 mr-1" />
                                        Load More ({uniqueVouchers.length - visibleCount})
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onOpenChange(false)}
                        disabled={!selectedVoucher}
                    >
                        Confirm Selection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};