"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Trash2,
    Minus,
    Plus,
    MapPin,
    Ticket,
    CreditCard,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Home,
    ShoppingBag,
    X,
    MessageSquarePlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Import Context & Services
import { useCart } from "@/contexts/CartContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { CartItemResponse, cartService, CheckoutCartBody } from "@/services/cartService";
import { addressService, AddressResponse } from "@/services/addressService";
import { orderService, CreateOrder } from "@/services/orderService"; // ✅ Import orderService
import { AppImage } from "@/components/ui/app-image";

// Import Types
import { Voucher, OrderType } from "@/interfaces/types"; // ✅ Import OrderType

// Import Features
import { AddressSelectionDialog } from "@/components/features/checkout/AddressSelectionDialog";
import { VoucherSelectionDialog } from "@/components/features/checkout/VoucherSelectionDialog";

// ==========================================
// 1. UTILITIES & HELPER FUNCTIONS
// ==========================================
const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const getProductDescription = (item: CartItemResponse): string => {
    const parts: string[] = [];
    if (item.sizeName) parts.push(`Size: ${item.sizeName}`);
    if (item.options && item.options.length > 0) {
        const optionStr = item.options.map(opt => `${opt.groupName}: ${opt.valueName}`).join(", ");
        parts.push(optionStr);
    }
    if (item.toppings && item.toppings.length > 0) {
        const toppingCounts: Record<string, number> = {};
        item.toppings.forEach(t => {
            const qty = (t as any).quantity || 1;
            toppingCounts[t.name] = (toppingCounts[t.name] || 0) + qty;
        });
        const toppingStr = Object.entries(toppingCounts).map(([name, count]) => `${name} x${count}`).join(", ");
        parts.push(`(Topping(s): ${toppingStr})`);
    }
    return parts.join(" | ");
};


// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

export default function CheckoutPage() {
    const router = useRouter();

    const { user } = useAuthContext();

    const {
        cart,
        isLoading,
        isUpdating,
        updateQuantity,
        removeItem,
        refreshCart,
        clearCart // ✅ Import thêm clearCart
    } = useCart();

    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false); // ✅ State loading khi thanh toán

    const [selectedAddress, setSelectedAddress] = useState<AddressResponse | null>(null);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
    const [shippingFee] = useState(0);

    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("vnpay"); // ✅ State phương thức thanh toán

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

    // REVALIDATE CART ON FOCUS
    useEffect(() => {
        const onFocus = () => refreshCart();
        window.addEventListener("focus", onFocus);
        refreshCart();
        return () => window.removeEventListener("focus", onFocus);
    }, [refreshCart]);

    // AUTO-SELECT DEFAULT ADDRESS
    useEffect(() => {
        const fetchDefaultAddress = async () => {
            try {
                const addrs = await addressService.getAll();
                if (addrs.length > 0) {
                    setSelectedAddress(addrs[0]);
                }
            } catch (error) {
                console.error("Failed to fetch initial address", error);
            }
        };
        if (user) {
            fetchDefaultAddress();
        }
    }, [user]);

    // AUTO-REMOVE VOUCHER IF CONDITION NOT MET
    useEffect(() => {
        if (selectedVoucher && cart) {
            if (cart.totalTemporaryPrice < selectedVoucher.minAmountOrder) {
                setSelectedVoucher(null);
                toast.warning(`Voucher removed. Order must be at least ${formatVND(selectedVoucher.minAmountOrder)}`);
            }
        }
    }, [cart, selectedVoucher]);

    // --- WRAPPERS ---
    const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
        setUpdatingItemId(itemId);
        await updateQuantity(itemId, newQuantity);
        setUpdatingItemId(null);
    };

    const handleRemoveItem = async (itemId: number) => {
        setUpdatingItemId(itemId);
        await removeItem(itemId);
        setUpdatingItemId(null);
    };

    // ✅ MAIN CHECKOUT HANDLER
    const handleCheckout = async () => {
        // 1. Validate
        if (!cart || cart.items.length === 0) {
            toast.error("Your cart is empty");
            return;
        }
        if (!selectedAddress) {
            toast.error("Please select a shipping address");
            setIsAddressModalOpen(true);
            return;
        }

        setIsProcessing(true);
        try {

            const shippingAddressStr = `Recipient: ${selectedAddress.recipientName}, Phone: ${selectedAddress.phoneNumber}, Address: ${selectedAddress.fullAddress}`;

            const payload: CheckoutCartBody = {
                customerPhone: user?.phone_number || undefined,
                note: note || undefined,
                shippingAddress: shippingAddressStr
            };



            // 3. Call API Create Order
            console.log("Creating Order:", payload);
            const orderRes = await cartService.checkout(payload);

            if (orderRes) {
                toast.success("Order created successfully!");

                // 4. Clear Cart (Sau khi tạo đơn thành công)
                await clearCart();

                // 5. Process Payment
                if (paymentMethod === "vnpay") {
                    const finalAmount = Math.max(0, cart.totalTemporaryPrice - (selectedVoucher ? Math.round((cart.totalTemporaryPrice * selectedVoucher.discount_percentage) / 100) : 0));

                    const paymentUrl = await orderService.payOnline({
                        orderId: orderRes.id,
                        amount: finalAmount,
                        voucherCode: selectedVoucher?.code || undefined
                    });

                    // Redirect to Payment Gateway
                    if (typeof paymentUrl === 'string' && paymentUrl.startsWith('http')) {
                        window.location.href = paymentUrl;
                    } else {
                        // Fallback nếu không trả về link (hoặc lỗi)
                        console.error("Invalid payment URL", paymentUrl);
                        router.push(`/orders/${orderRes.id}`);
                    }
                } else {
                    // COD hoặc phương thức khác
                    router.push(`/orders/${orderRes.id}`);
                }
            }

        } catch (error: any) {
            console.error("Checkout Failed:", error);
            toast.error(error?.response?.data?.message || "Failed to place order. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                <p className="text-gray-500 text-sm font-medium">Loading your cart...</p>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
                    <Button
                        onClick={() => router.push('/menu')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
                    >
                        Go to Menu
                    </Button>
                </div>
            </div>
        );
    }

    const subtotal = cart.totalTemporaryPrice;
    const discountAmount = selectedVoucher
        ? Math.round((subtotal * selectedVoucher.discount_percentage) / 100)
        : 0;
    const totalPayment = Math.max(0, subtotal + shippingFee - discountAmount);

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">
            <main className="container mx-auto px-4 py-8 max-w-6xl">

                {/* --- HEADER --- */}
                <div className="relative bg-gradient-to-r from-emerald-50 to-white rounded-3xl p-6 mb-8 overflow-hidden border border-emerald-100 shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-4">
                            <span className="cursor-pointer hover:underline flex items-center gap-1" onClick={() => router.push('/')}>
                                <Home size={14} /> Home
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                            <span className="cursor-pointer hover:underline" onClick={() => router.push('/menu')}>
                                Menu
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                            <span className="text-gray-500">Checkout</span>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                                    <ShieldCheck className="text-emerald-600" size={28} />
                                    Secure Checkout
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Complete your order and enjoy your meal.
                                </p>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm flex items-center gap-2 text-sm text-emerald-700">
                                <ShoppingBag size={16} />
                                Total Items: <span className="font-bold">{cart.totalQuantity}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* === LEFT COLUMN: ORDER ITEMS & NOTE === */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <ShoppingBag size={20} className="text-emerald-600" />
                                    Order Items <span className="text-gray-400 font-normal">({cart.totalQuantity} items)</span>
                                </h2>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {cart.items.map((item) => {
                                    const isItemUpdating = updatingItemId === item.id;
                                    const productUrl = `/products/${item.productId}`;

                                    return (
                                        <div key={item.id} className="p-5 flex gap-4 transition-colors hover:bg-gray-50/30">
                                            <Link href={productUrl} className="w-[75px] h-[75px] shrink-0 block">
                                                <AppImage
                                                    src={item.productImage || ""}
                                                    alt={item.productName}
                                                    className="w-full h-full rounded-xl border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                                                    aspectRatio="aspect-square"
                                                />
                                            </Link>

                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <Link href={productUrl} className="flex-1 mr-2">
                                                        <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-emerald-600 transition-colors">
                                                            {item.productName}
                                                        </h3>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        disabled={isUpdating || isProcessing}
                                                    >
                                                        {isItemUpdating ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Trash2 size={18} />}
                                                    </button>
                                                </div>

                                                <p className="text-xs text-gray-500 line-clamp-2 my-1">
                                                    {getProductDescription(item)}
                                                </p>

                                                <div className="flex justify-between items-end mt-1">
                                                    <div>
                                                        <span className="font-bold text-emerald-700">{formatVND(item.totalPrice)}</span>
                                                        <span className="text-xs text-gray-400 ml-1 font-normal">
                                                            ({formatVND(item.unitPrice)}/ea)
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center border border-gray-200 rounded-lg h-8 bg-white shadow-sm">
                                                        <button
                                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || isItemUpdating || isProcessing}
                                                        >
                                                            <Minus size={14} />
                                                        </button>

                                                        <div className="w-8 h-full flex items-center justify-center text-sm font-semibold text-gray-700 border-x border-gray-100">
                                                            {item.quantity}
                                                        </div>

                                                        <button
                                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                            disabled={isItemUpdating || isProcessing}
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ORDER NOTE SECTION */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <MessageSquarePlus size={20} className="text-emerald-600" />
                                Order Note
                            </h2>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                placeholder="Any special requests? (e.g. Less ice, allergy info...)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={200}
                                disabled={isProcessing}
                            />
                            <div className="text-right mt-1">
                                <span className="text-xs text-gray-400">{note.length}/200</span>
                            </div>
                        </div>
                    </div>

                    {/* === RIGHT COLUMN: PAYMENT & SUMMARY === */}
                    <div className="space-y-6">

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-emerald-100/50 border border-gray-100 p-6">
                            <h3 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatVND(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping Fee</span>
                                    <span className={`font-medium ${shippingFee === 0 ? "text-emerald-600" : ""}`}>
                                        {shippingFee === 0 ? "Free" : formatVND(shippingFee)}
                                    </span>
                                </div>

                                {/* Discount Row */}
                                {selectedVoucher && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Voucher ({selectedVoucher.code}) - {selectedVoucher.discount_percentage}%</span>
                                        <span className="font-medium">-{formatVND(discountAmount)}</span>
                                    </div>
                                )}

                                <Separator className="my-2" />
                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span className="text-emerald-700">{formatVND(totalPayment)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address Box */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <MapPin size={18} className="text-emerald-600" /> Shipping Address
                                </h3>
                                <Button variant="link" className="text-emerald-600 p-0 h-auto font-semibold" onClick={() => setIsAddressModalOpen(true)} disabled={isProcessing}>
                                    {selectedAddress ? "Change" : "Select Address"}
                                </Button>
                            </div>

                            {selectedAddress ? (
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">{selectedAddress.recipientName} <span className="font-normal text-gray-500">| {selectedAddress.phoneNumber}</span></p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{selectedAddress.fullAddress}</p>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">Please select a shipping address</div>
                            )}
                        </div>

                        {/* Voucher Box */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Ticket size={18} className="text-emerald-600" /> Voucher
                                </h3>
                                <Button variant="link" className="text-emerald-600 p-0 h-auto font-semibold" onClick={() => setIsVoucherModalOpen(true)} disabled={isProcessing}>
                                    Select Voucher
                                </Button>
                            </div>
                            {selectedVoucher ? (
                                <div className="bg-emerald-50 border border-emerald-200 border-dashed rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-emerald-700 text-sm">{selectedVoucher.code}</p>
                                        <p className="text-xs text-emerald-600">
                                            -{selectedVoucher.discount_percentage}% (-{formatVND(discountAmount)})
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                                        onClick={() => setSelectedVoucher(null)}
                                        disabled={isProcessing}
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">No voucher selected</div>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-emerald-600" /> Payment Method
                            </h3>
                            <RadioGroup defaultValue="vnpay" className="gap-3" value={paymentMethod} onValueChange={setPaymentMethod}>
                                <div className={`flex items-center justify-between space-x-2 border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === "vnpay" ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500" : "border-gray-200 bg-white hover:border-emerald-200"}`}>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="vnpay" id="vnpay" className="text-emerald-600 border-emerald-600" />
                                        <Label htmlFor="vnpay" className="font-semibold text-gray-900 cursor-pointer">VNPAY E-Wallet</Label>
                                    </div>
                                    <div className="h-6 w-16 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-bold tracking-tighter">
                                        VNPAY
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Pay Button */}
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-base shadow-lg shadow-emerald-200"
                            onClick={handleCheckout}
                            disabled={isUpdating || !cart || cart.items.length === 0 || isProcessing}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Pay with VNPAY
                        </Button>

                    </div>
                </div>
            </main>

            {/* === DIALOGS === */}
            <AddressSelectionDialog
                open={isAddressModalOpen}
                onOpenChange={setIsAddressModalOpen}
                selectedAddressId={selectedAddress?.id}
                onSelect={(addr) => {
                    setSelectedAddress(addr);
                    setIsAddressModalOpen(false);
                }}
            />

            <VoucherSelectionDialog
                open={isVoucherModalOpen}
                onOpenChange={setIsVoucherModalOpen}
                selectedVoucher={selectedVoucher}
                subtotal={subtotal}
                onSelect={(voucher) => setSelectedVoucher(voucher)}
                customerPhone={user?.phone_number}
            />

        </div>
    );
}