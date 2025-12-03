"use client";

import React, { useState, useEffect } from "react";
import {
    ShoppingBag,
    Truck,
    Store,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Receipt,
    CreditCard,
    MapPin,
    Package,
    Loader2,
    Filter,
    ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    Order,
    OrderStatus,
    OrderType,
    PaginationMeta,
    OrderDetail
} from "@/interfaces/types";
import { orderService } from "@/services/orderService";
import { OrderTrackingStepper } from "../OrderTrackingStepper";
import { formatVND, getStatusConfig } from "../shared";
import { useAuthContext } from "@/contexts/AuthContext";
import { AppImageSize } from "@/components/commons";

// --- 1. HELPER FUNCTIONS ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getProductImage = (detail: OrderDetail) => {
    if (detail.product?.images && detail.product.images.length > 0) {
        const sortedImages = [...detail.product.images].sort((a, b) => a.sort_index - b.sort_index);
        const imgName = sortedImages[0].image_name;
        if (imgName.startsWith("http")) return imgName;
        return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${imgName}`;
    }
    return "https://placehold.co/100x100?text=No+Image";
};

const formatOrderDetailDescription = (detail: OrderDetail): string => {
    const parts: string[] = [];
    if (detail.size) parts.push(`Size: ${detail.size.name}`);
    if (detail.optionValue && detail.optionValue.length > 0) {
        const optionStr = detail.optionValue.map(opt => opt.name).join(", ");
        parts.push(optionStr);
    }
    if (detail.ToppingOrderDetail && detail.ToppingOrderDetail.length > 0) {
        const toppingStr = detail.ToppingOrderDetail
            .map(t => `${t.topping.name} x${t.quantity}`)
            .join(", ");
        parts.push(`Toppings: ${toppingStr}`);
    }
    return parts.join(" | ");
};

// --- 2. SKELETON COMPONENT (NEW) ---
const OrderListSkeleton = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    {/* Header Skeleton */}
                    {/* <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
                    </div> */}

                    {/* Content Skeleton */}
                    <div className="py-4 border-t border-b border-gray-50 flex gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Footer Skeleton */}
                    <div className="pt-4 flex justify-between items-center">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- 3. SUB-COMPONENT: ORDER DETAIL VIEW ---
const OrderDetailView = ({ order, onBack }: { order: Order; onBack: () => void }) => {
    const statusConfig = getStatusConfig(order.status as OrderStatus);
    const [isCancelling, setIsCancelling] = useState(false);
    // State mới để điều khiển hiển thị Modal
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [visibleCount, setVisibleCount] = useState(5);
    // Hàm thực thi gọi API (được gọi khi bấm Xác nhận ở Modal)
    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        try {
            await orderService.userCancelOrder(order.id);
            toast.success("Order cancelled successfully");
            setShowCancelModal(false); // Đóng modal
            onBack(); // Quay lại danh sách
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel order");
        } finally {
            setIsCancelling(false);
        }
    };


    return (
        <>
            {/* Render Modal Component */}
            <CancelOrderModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleConfirmCancel}
                isLoading={isCancelling}
            />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <Button onClick={onBack} variant="ghost" className="mb-4 pl-0 hover:bg-transparent text-gray-500 hover:text-emerald-700">
                        <ChevronLeft size={20} className="mr-1" /> Back to Orders
                    </Button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
                                <Badge className={statusConfig.color}>
                                    <statusConfig.icon size={14} className="mr-1.5" /> {statusConfig.label}
                                </Badge>
                                {order.orderType === OrderType.ONLINE ? (
                                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                        <Truck size={12} className="mr-1" /> Online
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                                        <Store size={12} className="mr-1" /> POS
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                Placed on {new Date(order.created_at).toLocaleDateString("en-GB", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {order.status === OrderStatus.PENDING && (
                                <Button
                                    onClick={() => setShowCancelModal(true)} // Mở Modal thay vì gọi API trực tiếp
                                    disabled={isCancelling}
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                >
                                    Cancel Order
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* STEPPER */}
                <div className="my-6 px-6">
                    <OrderTrackingStepper
                        status={order.status as OrderStatus}
                        orderType={order.orderType}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2 font-semibold text-gray-800">
                                <ShoppingBag size={18} className="text-emerald-600" /> Order Items
                            </div>

                            <div className="divide-y divide-gray-100">
                                {order.order_details.slice(0, visibleCount).map((item) => (
                                    <div key={item.id} className="p-4 flex gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="w-20 h-20 shrink-0 border border-gray-100 rounded-lg overflow-hidden bg-white">
                                            <AppImageSize
                                                srcObj={getProductImage(item)}
                                                alt={item.product_name}
                                                width="100%"
                                                height="100%"
                                                className="w-full h-full"
                                            />

                                        </div>

                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 line-clamp-1">
                                                        {item.product_name}
                                                    </h4>
                                                    <span className="font-semibold text-gray-900 shrink-0 ml-2">
                                                        {formatVND(item.unit_price * item.quantity)}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-gray-500 mt-1 line-clamp-3 md:line-clamp-none leading-relaxed">
                                                    {formatOrderDetailDescription(item)}
                                                </p>
                                            </div>

                                            <div className="flex justify-between items-end mt-2">
                                                <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">
                                                    {formatVND(item.unit_price)} / unit
                                                </div>
                                                <div className="text-sm font- text-gray-700">x{item.quantity}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {visibleCount < order.order_details.length && (
                                <div className="p-4 text-center border-t bg-white">
                                    <Button
                                        variant="outline"
                                        onClick={() => setVisibleCount(prev => prev + 5)}
                                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                    >
                                        Load more ({order.order_details.length - visibleCount} remaining)
                                    </Button>
                                </div>
                            )}
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border border-gray-100 p-4 h-full">
                                <div className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                                    <Receipt size={18} className="text-emerald-600" /> Note
                                </div>
                                <p className="text-sm text-gray-600 italic">
                                    {order.note ? `"${order.note}"` : "No special instructions."}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4 h-full">
                                <div className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                                    <CreditCard size={18} className="text-emerald-600" /> Payment
                                </div>
                                {/* <p className="text-sm text-gray-600">
                                    Method: <span className="font-medium text-gray-900">{order.paymentDetailId ? "Online (VNPAY)" : "Cash / COD"}</span>
                                </p> */}
                                <div className="mt-3">
                                    {(order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.SHIPPING)
                                        ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>
                                        : <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Payment Pending</Badge>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Info & Summary */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Package size={18} className="text-emerald-600" />
                                {order.orderType === OrderType.ONLINE ? "Delivery Info" : "Pickup Info"}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                                        {order.orderType === OrderType.ONLINE ? "Receiver" : "Customer"}
                                    </p>
                                    <p className="font-medium text-gray-900">
                                        {order.Customer ? `${order.Customer.first_name} ${order.Customer.last_name}` : "Guest"}
                                    </p>
                                    <p className="text-sm text-gray-500">{order.customerPhone}</p>
                                </div>
                                {order.orderType === OrderType.ONLINE && order.shippingAddress && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Delivery Address</p>
                                        <div className="flex gap-2 items-start">
                                            <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-gray-600 leading-relaxed">{order.shippingAddress}</p>
                                        </div>
                                    </div>
                                )}
                                {order.orderType === OrderType.POS && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Store Location</p>
                                        <div className="flex gap-2 items-start">
                                            <Store size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-gray-600 leading-relaxed">Purchased at Store (POS)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                            <h3 className="font-bold text-gray-900 mb-4">Payment Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatVND(order.original_price)}</span>
                                </div>
                                {order.orderType === OrderType.ONLINE && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping Fee</span>
                                        <span>{formatVND(Math.max(0, order.final_price - order.original_price))}</span>
                                    </div>
                                )}
                                {order.original_price > order.final_price && (
                                    <div className="flex justify-between text-emerald-600 font-medium">
                                        <span>Discount</span>
                                        <span>-{formatVND(order.original_price - order.final_price)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between text-base font-bold text-gray-900">
                                    <span>Total</span>
                                    <span className="text-emerald-700">{formatVND(order.final_price)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};

// --- 2.5 SUB-COMPONENT: CANCEL MODAL ---
interface CancelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

const CancelOrderModal = ({ isOpen, onClose, onConfirm, isLoading }: CancelModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-200 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                        <ArrowUpDown size={24} className="rotate-45" /> {/* Or import AlertTriangle from lucide-react */}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel this order?</h3>
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                        Are you sure you want to cancel this pending order?
                        This action cannot be undone.
                    </p>

                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 border-gray-200"
                        >
                            Close
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            Confirm cancellation
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- 4. MAIN PAGE COMPONENT ---
export default function OrdersPage() {
    const { user } = useAuthContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ page: 1, size: 5, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    // --- FILTER & SORT STATE ---
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<string>("newest");

    // Fetch Data
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                let orderBy = "created_at";
                let orderDirection: "asc" | "desc" = "desc";

                if (sortBy === "oldest") {
                    orderDirection = "asc";
                } else if (sortBy === "price_desc") {
                    orderBy = "final_price";
                    orderDirection = "desc";
                } else if (sortBy === "price_asc") {
                    orderBy = "final_price";
                    orderDirection = "asc";
                }

                const res = await orderService.getAllOfUser({
                    page: currentPage,
                    size: 5,
                    orderDirection,
                    orderBy,
                    searchCustomerPhone: user?.phone_number,
                    searchStatuses: statusFilter !== "ALL" ? statusFilter : undefined
                });
                setOrders(res.data);
                setMeta(res.meta);
            } catch (error) {
                console.error("Failed to fetch orders", error);
                toast.error("Failed to load order history");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentPage, selectedOrderId, statusFilter, sortBy, user?.phone_number]);

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    // 1. Render Detail View
    if (selectedOrderId && selectedOrder) {
        return <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrderId(null)} />;
    }

    // 2. Render List View
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
            {/* Header & Filters */}
            <div className="border-b border-gray-100 bg-gray-50/50">
                <div className="p-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                        <p className="text-sm text-gray-500 mt-1">Track and manage your past orders</p>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 hidden sm:inline-block">Sort by:</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[200px] h-9 bg-white border-gray-200 focus:ring-emerald-500">
                                <ArrowUpDown size={14} className=" text-gray-400" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="px-6 pb-0 overflow-x-auto scrollbar-hide">
                    <Tabs
                        defaultValue="ALL"
                        value={statusFilter}
                        onValueChange={(val) => {
                            setStatusFilter(val);
                            setCurrentPage(1);
                        }}
                        className="w-full"
                    >
                        <TabsList className="w-full justify-start">
                            {[
                                "ALL",
                                OrderStatus.PENDING,
                                OrderStatus.PAID,
                                OrderStatus.SHIPPING,
                                OrderStatus.COMPLETED,
                                OrderStatus.CANCELED,
                            ].map((status) => (
                                <TabsTrigger
                                    key={status}
                                    value={status}
                                    className="
          capitalize
          text-gray-600 
          hover:text-emerald-600
          data-[state=active]:text-emerald-700
          data-[state=active]:border-emerald-600
          data-[state=active]:shadow-[inset_0_-2px_0_0_rgb(5,150,105)]
        "
                                >
                                    {status.toLowerCase().replace('_', ' ')}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                </div>
            </div>

            {/* List Content */}
            <div className="p-6 bg-gray-50/30 min-h-[400px]">
                {loading ? (
                    // ✅ Improved Skeleton Loading
                    <OrderListSkeleton />
                ) : orders.length > 0 ? (
                    <>
                        <div className="mb-4 text-sm text-gray-500">
                            Found <span className="font-bold text-gray-900">{meta.total}</span> orders
                        </div>
                        <div className="space-y-4">
                            {orders.map((order) => {
                                const statusConfig = getStatusConfig(order.status as OrderStatus);
                                return (
                                    <div
                                        key={order.id}
                                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                                                    <ShoppingBag size={20} className="text-gray-500 group-hover:text-emerald-600" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 text-lg block">Order #{order.id}</span>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(order.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        {order.orderType === OrderType.ONLINE ? (
                                                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                                <Truck size={12} /> Online
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                                                                <Store size={12} /> POS
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                                <Badge className={statusConfig.color}>
                                                    <statusConfig.icon size={12} className="mr-1" /> {statusConfig.label}
                                                </Badge>
                                                <div className="text-right sm:min-w-[100px]">
                                                    <span className="text-lg font-bold text-emerald-600">
                                                        {formatVND(order.final_price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div className="text-sm text-gray-600 w-full sm:w-auto flex items-center gap-1 max-w-full overflow-hidden">
                                                <span className="font-medium text-gray-900 whitespace-nowrap">
                                                    {order.order_details.reduce((acc, i) => acc + i.quantity, 0)} items
                                                </span>

                                                <span className="text-gray-400">|</span>

                                                <span className="text-gray-500 truncate">
                                                    {order.order_details.map(i => i.product_name).join(", ")}
                                                </span>
                                            </div>

                                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex-1 sm:flex-none h-9 hover:bg-gray-100 group-hover:text-emerald-700"
                                                    onClick={() => setSelectedOrderId(order.id)}
                                                >
                                                    View Details <ChevronRight size={16} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                        <Filter size={48} className="text-gray-200 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No orders found</p>
                        <p className="text-sm mb-6">Try changing the filter or search criteria.</p>
                        <Button
                            variant="outline"
                            onClick={() => { setStatusFilter("ALL"); setSortBy("newest"); }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>

            {/* PAGINATION */}
            {meta.totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="text-sm text-gray-500 hidden sm:block">
                        Page {meta.page} of {meta.totalPages}
                    </div>
                    <div className="flex items-center gap-2 mx-auto sm:mx-0">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg border-gray-200"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            <ChevronLeft size={16} />
                        </Button>

                        {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                            (page === 1 || page === meta.totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) ? (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    className={`h-9 w-9 p-0 rounded-lg ${currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : "border-gray-200 text-gray-600"}`}
                                    onClick={() => setCurrentPage(page)}
                                    disabled={loading}
                                >
                                    {page}
                                </Button>
                            ) : (
                                (page === currentPage - 2 || page === currentPage + 2) && <span key={page} className="text-gray-400 px-1">...</span>
                            )
                        ))}

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg border-gray-200"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, meta.totalPages))}
                            disabled={currentPage === meta.totalPages || loading}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}