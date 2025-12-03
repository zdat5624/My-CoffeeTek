"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  CalendarDays,
  Clock,
  CheckCircle2,
  Loader2,
  Gift,
  Home,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// --- SERVICES & TYPES ---
import { voucherService, VoucherGroup } from "@/services/voucherService";
import { Voucher, PaginationMeta } from "@/interfaces/types";

// --- CONTEXT ---
import { useAuthContext } from "@/contexts/AuthContext"; // ✅ Import Auth Context

export default function PromotionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- STATE ---
  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = 12;

  const [voucherGroups, setVoucherGroups] = useState<VoucherGroup[]>([]);
  const [userVouchers, setUserVouchers] = useState<Voucher[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingGroup, setClaimingGroup] = useState<string | null>(null);

  // --- AUTHENTICATION (Integrated) ---
  const { user } = useAuthContext(); // ✅ Lấy user từ Context thay vì LocalStorage thủ công

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch Voucher Groups
      const groupPromise = voucherService.getGroups({
        page: currentPage,
        size: itemsPerPage,
        onlyActive: true,
        orderBy: 'valid_to',
        orderDirection: 'asc'
      });

      // 2. Fetch User's Active Vouchers (Nếu đã login)
      let userVoucherPromise = Promise.resolve([] as Voucher[]);

      // ✅ Sử dụng user từ context
      if (user?.phone_number) {
        userVoucherPromise = voucherService.getUserActiveVoucher(user.phone_number);
      }

      const [groupRes, userVouchersRes] = await Promise.all([groupPromise, userVoucherPromise]);

      setVoucherGroups(groupRes.data || []);
      setPaginationMeta(groupRes.meta);
      setUserVouchers(userVouchersRes || []);

    } catch (error) {
      console.error("Failed to fetch promotions", error);
      toast.error("Failed to load promotions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Dependency updated: user?.phone_number
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone_number, currentPage]);


  // --- HANDLERS ---

  const handleClaimVoucher = async (group: VoucherGroup) => {
    // ✅ Check login từ user context
    if (!user?.phone_number) {
      toast.info("Please login to claim vouchers");
      router.push("/auth/login"); // Hoặc dẫn đến trang auth phù hợp
      return;
    }

    if (group.active <= 0) {
      toast.error("Out of stock", { description: "This voucher is no longer available." });
      return;
    }

    setClaimingGroup(group.group_name);

    try {
      // ✅ Dùng phone từ user context
      await voucherService.exchangeByGroup(group.group_name, user.phone_number);

      toast.success("Claimed successfully!", {
        description: `You have received voucher from ${group.voucher_name || group.group_name}`,
      });

      const newUserVouchers = await voucherService.getUserActiveVoucher(user.phone_number);
      setUserVouchers(newUserVouchers);

      setVoucherGroups(prev => prev.map(g => {
        if (g.group_name === group.group_name) {
          return { ...g, active: Math.max(0, g.active - 1) };
        }
        return g;
      }));

    } catch (error: any) {
      console.error("Claim error:", error);
      const msg = error?.response?.data?.message || error.message || "Cannot claim voucher.";
      toast.error("Claim Failed", { description: msg });
    } finally {
      setClaimingGroup(null);
    }
  };

  // Xử lý chuyển trang: Cập nhật URL
  const handlePageChange = (newPage: number) => {
    if (!paginationMeta || newPage < 1 || newPage > paginationMeta.totalPages) return;

    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "No Expiry";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // --- RENDER LOADING ---
  // Có thể bỏ check isLoading này nếu muốn hiển thị Skeleton khi chuyển trang mà không flash màn hình trắng
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <main className="container mx-auto px-4 py-8">
          <div className="h-48 bg-white rounded-3xl animate-pulse mb-8 border border-gray-200"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
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
                Your Active Vouchers: <span className="font-bold">{userVouchers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- VOUCHER LIST --- */}
        {voucherGroups.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>No promotions available at the moment.</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {voucherGroups.map((group) => {
              const existingVoucher = userVouchers.find(
                (v) => v.group_name === group.group_name && v.is_active
              );
              const isReceived = !!existingVoucher;
              const isOutOfStock = group.active <= 0;
              const isClaiming = claimingGroup === group.group_name;

              return (
                <div
                  key={group.group_name}
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
                  {/* Circles Decoration */}
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
                        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2" title={group.voucher_name || ""}>
                          {group.voucher_name || group.group_name}
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
                            disabled={isOutOfStock || isClaiming}
                            onClick={() => handleClaimVoucher(group)}
                          >
                            {isClaiming ? (
                              <Loader2 size={14} className="animate-spin mr-1.5" />
                            ) : (
                              <Ticket size={14} className="mr-1.5" />
                            )}
                            {isOutOfStock ? "Out of Stock" : isClaiming ? "Claiming..." : "Claim"}
                          </Button>
                          <div className="h-3 mt-2"></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- PAGINATION --- */}
        {paginationMeta && paginationMeta.totalPages > 1 && (
          <div className="flex justify-center mt-10 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <span className="sr-only">Prev</span>
              <ChevronLeft size={16} />
            </Button>

            {/* Render số trang đơn giản */}
            {Array.from({ length: paginationMeta.totalPages }, (_, i) => i + 1)
              .filter(page =>
                page === 1 ||
                page === paginationMeta.totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => {
                const isGap = index > 0 && page - array[index - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {isGap && <span className="flex items-end px-1">...</span>}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${currentPage === page ? "bg-emerald-600" : ""}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                );
              })
            }

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage >= paginationMeta.totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <span className="sr-only">Next</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

      </main>
    </div>
  );
}