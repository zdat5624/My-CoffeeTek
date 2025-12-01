"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  CalendarDays,
  Clock,
  CheckCircle2,
  Loader2,
  Gift,
  AlertCircle,
  Home,
  ChevronRight,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// --- INTERFACES ---
import { VoucherGroup } from "@/services/voucherService";
import { Voucher } from "@/interfaces/types";

// --- MOCK DATA INLINE ---
const MOCK_INLINE_VOUCHER_GROUPS: VoucherGroup[] = [
  {
    group_name: "WELCOME_NEW_MEMBER",
    voucher_name: "Welcome Friend - 50% OFF for your first order",
    discount_percentage: 50,
    valid_from: "2024-01-01T00:00:00Z",
    valid_to: "2025-12-31T23:59:59Z",
    total: 1000,
    active: 800,
    inactive: 200,
  },
  {
    group_name: "SUMMER_VIBES_2024",
    voucher_name: "Summer Cool - 20% OFF",
    discount_percentage: 20,
    valid_from: "2024-05-01T00:00:00Z",
    valid_to: "2024-08-31T23:59:59Z",
    total: 500,
    active: 450,
    inactive: 50,
  },
  {
    group_name: "COFFEE_LOVER",
    voucher_name: "Morning Coffee - 15k OFF",
    discount_percentage: 15,
    valid_from: "2024-01-01T00:00:00Z",
    valid_to: "2024-12-31T23:59:59Z",
    total: 2000,
    active: 1900,
    inactive: 100,
  },
  {
    group_name: "VIP_EXCLUSIVE",
    voucher_name: "VIP Exclusive - 30% OFF on all items",
    discount_percentage: 30,
    valid_from: "2024-06-01T00:00:00Z",
    valid_to: "2024-06-30T23:59:59Z",
    total: 100,
    active: 20,
    inactive: 80,
  },
  {
    group_name: "FREESHIP_06",
    voucher_name: "Freeship 0đ",
    discount_percentage: 100,
    valid_from: "2024-06-06T00:00:00Z",
    valid_to: "2024-06-06T23:59:59Z",
    total: 5000,
    active: 0,
    inactive: 5000,
  },
  {
    group_name: "MID_AUTUMN",
    voucher_name: "Mid-Autumn - Buy 1 Get 1 Free",
    discount_percentage: 50,
    valid_from: "2024-09-01T00:00:00Z",
    valid_to: "2024-09-30T23:59:59Z",
    total: 300,
    active: 300,
    inactive: 0,
  },
  {
    group_name: "WEEKEND_TREAT",
    voucher_name: "Weekend Treat - 10% OFF",
    discount_percentage: 10,
    valid_from: "2024-01-01T00:00:00Z",
    valid_to: "2024-12-31T23:59:59Z",
    total: 5000,
    active: 4500,
    inactive: 500,
  }
];

const MOCK_INLINE_USER_VOUCHERS: Voucher[] = [
  {
    id: 101,
    code: "WELCOME-USER-001",
    group_name: "WELCOME_NEW_MEMBER",
    voucher_name: "Welcome Friend - 50% OFF for your first order",
    discount_percentage: 50,
    minAmountOrder: 0,
    requirePoint: 0,
    valid_from: "2024-01-01T00:00:00Z",
    valid_to: "2024-02-01T00:00:00Z",
    is_active: true,
  },
  {
    id: 102,
    code: "VIP-USER-999",
    group_name: "VIP_EXCLUSIVE",
    voucher_name: "VIP Exclusive - 30% OFF on all items",
    discount_percentage: 30,
    minAmountOrder: 200000,
    requirePoint: 500,
    valid_from: "2024-06-01T00:00:00Z",
    valid_to: "2024-06-30T23:59:59Z",
    is_active: true,
  },
];

export default function PromotionsPage() {
  const router = useRouter();
  const [voucherGroups, setVoucherGroups] = useState<VoucherGroup[]>([]);
  const [userVouchers, setUserVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingGroup, setClaimingGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setVoucherGroups(MOCK_INLINE_VOUCHER_GROUPS);
        setUserVouchers(MOCK_INLINE_USER_VOUCHERS);
      } catch (error) {
        console.error("Failed to fetch promotions", error);
        toast.error("Failed to load promotions");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClaimVoucher = async (group: VoucherGroup) => {
    if (group.active <= 0) {
      toast.error("So sorry!", { description: "This voucher is out of stock." });
      return;
    }
    setClaimingGroup(group.group_name);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const newVoucher: Voucher = {
        id: Math.random(),
        code: `${group.group_name}-NEW-${Math.floor(Math.random() * 1000)}`,
        group_name: group.group_name,
        voucher_name: group.voucher_name || "New Voucher",
        discount_percentage: group.discount_percentage || 0,
        minAmountOrder: 0,
        requirePoint: 0,
        valid_from: new Date().toISOString(),
        valid_to: group.valid_to || new Date().toISOString(),
        is_active: true,
        customerPhone: "0909000000"
      };
      setUserVouchers((prev) => [...prev, newVoucher]);
      toast.success("Success!", {
        description: `You have received: ${group.voucher_name}`,
      });
    } catch (error) {
      toast.error("Error", { description: "Cannot claim voucher at this time." });
    } finally {
      setClaimingGroup(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "No Expiry";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <main className="container mx-auto px-4 py-8">
          <div className="h-48 bg-white rounded-3xl animate-pulse mb-8 border border-gray-200"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="h-40 bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="container mx-auto px-4 py-8">

        {/* --- HERO / HEADER SECTION --- */}
        <div className="relative bg-gradient-to-r from-emerald-50 to-white rounded-3xl p-6 mb-8 overflow-hidden border border-emerald-100 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-4">
              <span className="cursor-pointer hover:underline flex items-center gap-1" onClick={() => router.push('/')}>
                <Home size={14} /> Home
              </span>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-gray-500">Promotions</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <Gift className="text-emerald-600" size={28} />
                  Promotion Hunt
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Discover exclusive deals and claim your vouchers now.
                </p>
              </div>
              <div className="bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm flex items-center gap-2 text-sm text-emerald-700">
                <Ticket size={16} />
                Active Vouchers: <span className="font-bold">{userVouchers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- VOUCHER LIST (FLEXBOX FOR CENTERED LAST ROW) --- */}
        {/* Changed from Grid to Flex to center the last row items */}
        <div className="flex flex-wrap justify-center gap-4">
          {voucherGroups.map((group) => {
            const existingVoucher = userVouchers.find(
              (v) => v.group_name === group.group_name && v.is_active
            );
            const isReceived = !!existingVoucher;
            const isOutOfStock = group.active <= 0;

            return (
              <div
                key={group.group_name}
                // WIDTH CALCULATION: 
                // gap-4 = 1rem = 16px
                // 5 cols: (100% - 4 gaps) / 5
                // 4 cols: (100% - 3 gaps) / 4 ...
                className={`
                  relative bg-white rounded-xl border transition-all duration-300 overflow-hidden flex flex-col group
                  w-full 
                  sm:w-[calc(50%-0.5rem)] 
                  lg:w-[calc(33.333%-0.67rem)] 
                  xl:w-[calc(25%-0.75rem)] 
                  2xl:w-[calc(20%-0.8rem)]
                  ${isReceived
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-gray-200 hover:shadow-md hover:border-emerald-200"
                  }
                  ${isOutOfStock && !isReceived ? "opacity-70 grayscale-[0.5]" : ""}
                `}
              >
                {/* Circles */}
                <div className="absolute top-[45%] -left-2 w-4 h-4 bg-gray-50 rounded-full border-r border-gray-200 z-10" />
                <div className="absolute top-[45%] -right-2 w-4 h-4 bg-gray-50 rounded-full border-l border-gray-200 z-10" />

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col relative h-full">

                  {/* Top: Header + Discount */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex-1">
                      {isReceived ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0 h-5 mb-1.5">
                          Owned
                        </Badge>
                      ) : isOutOfStock ? (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[10px] px-2 py-0 h-5 mb-1.5">
                          Out of Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] px-2 py-0 h-5 mb-1.5">
                          Available
                        </Badge>
                      )}
                      <h3 className="text-base font-bold text-gray-900 leading-snug">
                        {group.voucher_name || "Special Offer"}
                      </h3>
                    </div>

                    <div className="flex flex-col items-center bg-emerald-50 rounded-lg p-1.5 min-w-[50px] shrink-0">
                      <span className="text-xl font-black text-emerald-600 leading-none">
                        {group.discount_percentage}%
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 uppercase">OFF</span>
                    </div>
                  </div>

                  {/* Middle: Info */}
                  {/* flex-1 to push footer down, making cards uniform height visually */}
                  <div className="flex-1 space-y-1.5 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-emerald-500 shrink-0" />
                      <span className="truncate">Exp: {formatDate(group.valid_to)}</span>
                    </div>
                    {!isReceived && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-emerald-500 shrink-0" />
                        <span>Left: <span className="font-medium text-gray-700">{group.active}</span>/{group.total}</span>
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="border-t-2 border-dashed border-gray-200/60 -mx-4 mb-3 mt-auto shrink-0"></div>

                  {/* Bottom: Action */}
                  <div className="shrink-0">
                    {isReceived ? (
                      <div className="space-y-2">
                        <Button
                          className="w-full h-8 text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold shadow-none cursor-default hover:bg-emerald-100"
                          variant="outline"
                          disabled
                        >
                          <CheckCircle2 size={14} className="mr-1.5" />
                          Received
                        </Button>
                        <p className="text-center text-[10px] text-gray-500 font-mono flex justify-center items-center gap-1 h-3">
                          Code: <span className="font-bold text-gray-700">{existingVoucher.code}</span>
                        </p>
                      </div>
                    ) : (
                      <>
                        <Button
                          className={`w-full h-9 text-xs font-bold shadow-sm transition-all
                              ${isOutOfStock
                              ? "bg-gray-100 text-gray-400 hover:bg-gray-100"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-100"
                            }`}
                          disabled={isOutOfStock || claimingGroup === group.group_name}
                          onClick={() => handleClaimVoucher(group)}
                        >
                          {claimingGroup === group.group_name ? (
                            <Loader2 size={14} className="animate-spin mr-1.5" />
                          ) : (
                            <Ticket size={14} className="mr-1.5" />
                          )}
                          {isOutOfStock ? "Out of Stock" : "Claim"}
                        </Button>
                        {/* Placeholder to keep height consistent with received cards */}
                        <div className="h-3 mt-2"></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-10 gap-2">
          <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0"><span className="sr-only">Prev</span>&lt;</Button>
          <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-emerald-600">1</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">2</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">3</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0"><span className="sr-only">Next</span>&gt;</Button>
        </div>

      </main>
    </div>
  );
}