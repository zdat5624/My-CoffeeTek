"use client";

import React, { useState, useEffect } from "react";
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
    CheckCircle2,
    Home,
    ShoppingBag
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ==========================================
// 1. INTERFACES (DATA MODELS)
// ==========================================

// --- Cart Interfaces (From Input) ---
export interface AddToCartBody {
    productId: number;
    quantity: number;
    sizeId?: number;
    toppingIds?: number[];
    optionIds?: number[];
}

export interface UpdateCartItemBody {
    quantity?: number;
    sizeId?: number;
    toppingIds?: number[];
    optionIds?: number[];
}

export interface CartItemToppingResponse {
    name: string;
    price: number;
    quantity: number; // Added quantity field
}

export interface CartItemOptionResponse {
    groupName: string;
    valueName: string;
}

export interface CartItemResponse {
    id: number;
    productId: number;
    productName: string;
    productImage: string | null;
    sizeName: string | null;
    quantity: number;
    unitPrice: number;      // Price per item (including size/toppings)
    originalPrice: number | null;
    totalPrice: number;     // unitPrice * quantity
    toppings: CartItemToppingResponse[];
    options: CartItemOptionResponse[];
}

export interface CartResponse {
    id: number;
    totalQuantity: number;
    totalTemporaryPrice: number; // Subtotal
    items: CartItemResponse[];
}

// --- Mock Interfaces for Address & Voucher ---
interface UserAddress {
    id: number;
    name: string;
    phone: string;
    address: string;
    isDefault: boolean;
}

interface Voucher {
    id: number;
    code: string;
    description: string;
    discountAmount: number;
    minOrderValue: number;
}

// ==========================================
// 2. MOCK DATA & SERVICE (SIMULATION)
// ==========================================

const MOCK_ADDRESSES: UserAddress[] = [
    { id: 1, name: "Tuan Le", phone: "0909123456", address: "123 Nguyen Hue, Ben Nghe Ward, District 1, HCMC", isDefault: true },
    { id: 2, name: "Tuan Le (Office)", phone: "0909123456", address: "Landmark 81, Binh Thanh District, HCMC", isDefault: false },
];

const MOCK_VOUCHERS: Voucher[] = [
    { id: 1, code: "WELCOME50", description: "Discount 50k for new members", discountAmount: 50000, minOrderValue: 100000 },
    { id: 2, code: "FREESHIP", description: "Free shipping (Max 15k)", discountAmount: 15000, minOrderValue: 50000 },
];

// Mock API Service
const cartService = {
    async getCart(): Promise<CartResponse> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            id: 101,
            totalQuantity: 2,
            totalTemporaryPrice: 110000,
            items: [
                {
                    id: 1, productId: 101, productName: "Cappuccino Delight", productImage: "https://images.unsplash.com/photo-1572442388796-11668a67e569?auto=format&fit=crop&w=200&q=80",
                    sizeName: "M", quantity: 1, unitPrice: 55000, originalPrice: 65000, totalPrice: 55000,
                    toppings: [],
                    options: [{ groupName: "Sugar", valueName: "50%" }, { groupName: "Ice", valueName: "Normal" }]
                },
                {
                    id: 2, productId: 102, productName: "Royal Milk Tea", productImage: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200&q=80",
                    sizeName: "L", quantity: 1, unitPrice: 55000, originalPrice: null, totalPrice: 55000,
                    toppings: [{ name: "Black Pearl", price: 5000, quantity: 1 }, { name: "Pudding", price: 5000, quantity: 2 }],
                    options: [{ groupName: "Sugar", valueName: "100%" }]
                }
            ]
        };
    },
    async updateItem(itemId: number, data: UpdateCartItemBody) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    },
    async removeItem(itemId: number) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }
};

// ==========================================
// 3. UTILITIES
// ==========================================
const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const getProductDescription = (item: CartItemResponse): string => {
    const parts: string[] = [];
    if (item.sizeName) parts.push(`Size: ${item.sizeName}`);
    if (item.options?.length) {
        item.options.forEach(opt => parts.push(`${opt.groupName}: ${opt.valueName}`));
    }
    if (item.toppings?.length) {
        // Updated logic to show topping quantity
        const toppingNames = item.toppings.map(t => `${t.name} x${t.quantity}`).join(", ");
        parts.push(`Toppings: ${toppingNames}`);
    }
    return parts.join(" | ");
};

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<number | null>(null); // Stores ID of item being updated

    // Payment & Shipping State
    const [selectedAddress, setSelectedAddress] = useState<UserAddress>(MOCK_ADDRESSES[0]);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

    // Set shipping fee to 0 (Free Shipping)
    const [shippingFee] = useState(0);

    // Modals State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

    // --- DATA FETCHING ---
    const fetchCart = async () => {
        try {
            const data = await cartService.getCart();
            setCart(data);
        } catch (error) {
            toast.error("Failed to load cart");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // --- HANDLERS ---
    const handleQuantityChange = async (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        setIsUpdating(itemId);
        try {
            await cartService.updateItem(itemId, { quantity: newQuantity });

            // Optimistic update or refetch
            if (cart) {
                const updatedItems = cart.items.map(item => {
                    if (item.id === itemId) {
                        return {
                            ...item,
                            quantity: newQuantity,
                            totalPrice: item.unitPrice * newQuantity
                        };
                    }
                    return item;
                });
                // Recalculate total (Simple local calc for UX responsiveness)
                const newTotal = updatedItems.reduce((acc, item) => acc + item.totalPrice, 0);
                setCart({ ...cart, items: updatedItems, totalTemporaryPrice: newTotal });
            }
        } catch (error) {
            toast.error("Failed to update quantity");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        setIsUpdating(itemId);
        try {
            await cartService.removeItem(itemId);
            // Refetch to ensure sync
            await fetchCart();
            toast.success("Item removed from cart");
        } catch (error) {
            toast.error("Failed to remove item");
            setIsUpdating(null);
        }
    };

    const handleCheckout = () => {
        if (!cart || cart.items.length === 0) {
            toast.error("Your cart is empty");
            return;
        }
        toast.success("Order placed successfully via VNPAY!");
        // router.push('/order-success');
    };

    // --- LOADING STATE ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    // --- CALCULATIONS ---
    const subtotal = cart?.totalTemporaryPrice || 0;
    const discount = selectedVoucher ? selectedVoucher.discountAmount : 0;
    const totalPayment = Math.max(0, subtotal + shippingFee - discount);

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">
            <main className="container mx-auto px-4 py-8 max-w-6xl">

                {/* --- HERO / HEADER SECTION (Synchronized Style) --- */}
                <div className="relative bg-gradient-to-r from-emerald-50 to-white rounded-3xl p-6 mb-8 overflow-hidden border border-emerald-100 shadow-sm">
                    {/* Decorative Blurs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-4">
                            <span className="cursor-pointer hover:underline flex items-center gap-1" onClick={() => router.push('/')}>
                                <Home size={14} /> Home
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                            <span className="text-gray-500">Checkout</span>
                        </div>

                        {/* Title Row */}
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

                            {/* Stats Badge */}
                            <div className="bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm flex items-center gap-2 text-sm text-emerald-700">
                                <ShoppingBag size={16} />
                                Total Items: <span className="font-bold">{cart?.totalQuantity || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* === LEFT COLUMN: ORDER ITEMS === */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <ShoppingBag size={20} className="text-emerald-600" />
                                    Order Items <span className="text-gray-400 font-normal">({cart?.totalQuantity} items)</span>
                                </h2>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {cart?.items.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        Your cart is currently empty.
                                    </div>
                                ) : (
                                    cart?.items.map((item) => (
                                        <div key={item.id} className="p-5 flex gap-4 transition-colors hover:bg-gray-50/30">
                                            {/* Image */}
                                            <div className="w-[75px] h-[75px] shrink-0 rounded-xl border border-gray-100 overflow-hidden bg-white">
                                                <img
                                                    src={item.productImage || "/placeholder.png"}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                {/* Top Row: Name + Delete */}
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 line-clamp-1 mr-2">{item.productName}</h3>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        disabled={isUpdating === item.id}
                                                    >
                                                        {isUpdating === item.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                    </button>
                                                </div>

                                                {/* Middle Row: Description */}
                                                <p className="text-xs text-gray-500 line-clamp-2 my-1">
                                                    {getProductDescription(item)}
                                                </p>

                                                {/* Bottom Row: Price + Quantity */}
                                                <div className="flex justify-between items-end mt-1">
                                                    <div>
                                                        <span className="font-bold text-emerald-700">{formatVND(item.totalPrice)}</span>
                                                        <span className="text-xs text-gray-400 ml-1 font-normal">
                                                            ({formatVND(item.unitPrice)}/ea)
                                                        </span>
                                                    </div>

                                                    {/* Quantity Control */}
                                                    <div className="flex items-center border border-gray-200 rounded-lg h-8 bg-white shadow-sm">
                                                        <button
                                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-emerald-700 disabled:opacity-50"
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || isUpdating === item.id}
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <div className="w-8 h-full flex items-center justify-center text-sm font-semibold text-gray-700 border-x border-gray-100">
                                                            {item.quantity}
                                                        </div>
                                                        <button
                                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-emerald-700 disabled:opacity-50"
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                            disabled={isUpdating === item.id}
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* === RIGHT COLUMN: PAYMENT & SUMMARY === */}
                    <div className="space-y-6">

                        {/* 1. Order Summary (Top Priority) */}
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
                                {discount > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Discount</span>
                                        <span className="font-medium">-{formatVND(discount)}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span className="text-emerald-700">{formatVND(totalPayment)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Shipping Address */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <MapPin size={18} className="text-emerald-600" /> Shipping Address
                                </h3>
                                <Button variant="link" className="text-emerald-600 p-0 h-auto font-semibold" onClick={() => setIsAddressModalOpen(true)}>
                                    Change
                                </Button>
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">{selectedAddress.name} <span className="font-normal text-gray-500">| {selectedAddress.phone}</span></p>
                                <p className="text-sm text-gray-600 leading-relaxed">{selectedAddress.address}</p>
                            </div>
                        </div>

                        {/* 3. Voucher */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Ticket size={18} className="text-emerald-600" /> Voucher
                                </h3>
                                <Button variant="link" className="text-emerald-600 p-0 h-auto font-semibold" onClick={() => setIsVoucherModalOpen(true)}>
                                    Select Voucher
                                </Button>
                            </div>
                            {selectedVoucher ? (
                                <div className="bg-emerald-50 border border-emerald-200 border-dashed rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-emerald-700 text-sm">{selectedVoucher.code}</p>
                                        <p className="text-xs text-emerald-600">-{formatVND(selectedVoucher.discountAmount)}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                                        onClick={() => setSelectedVoucher(null)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">No voucher selected</div>
                            )}
                        </div>

                        {/* 4. Payment Method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-emerald-600" /> Payment Method
                            </h3>
                            <RadioGroup defaultValue="vnpay" className="gap-3">
                                <div className="flex items-center justify-between space-x-2 border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 cursor-pointer ring-1 ring-emerald-500">
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="vnpay" id="vnpay" className="text-emerald-600 border-emerald-600" />
                                        <Label htmlFor="vnpay" className="font-semibold text-gray-900 cursor-pointer">VNPAY E-Wallet</Label>
                                    </div>
                                    {/* Mock VNPAY Icon */}
                                    <div className="h-6 w-16 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-bold tracking-tighter">
                                        VNPAY
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* 5. Pay Button (Bottom) */}
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-base shadow-lg shadow-emerald-200"
                            onClick={handleCheckout}
                            disabled={isLoading || (cart?.items.length === 0)}
                        >
                            Pay with VNPAY
                        </Button>

                    </div>
                </div>
            </main>

            {/* === MODALS === */}

            {/* Address Modal */}
            <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Select Shipping Address</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        {MOCK_ADDRESSES.map((addr) => (
                            <div
                                key={addr.id}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedAddress.id === addr.id
                                    ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                onClick={() => setSelectedAddress(addr)}
                            >
                                <div className="flex justify-between">
                                    <p className="font-bold text-gray-900">{addr.name}</p>
                                    {addr.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{addr.phone}</p>
                                <p className="text-sm text-gray-500 mt-1">{addr.address}</p>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full border-dashed border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-600">
                            + Add New Address
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsAddressModalOpen(false)}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Voucher Modal */}
            <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Select Voucher</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
                        {MOCK_VOUCHERS.map((voucher) => {
                            const isApplicable = subtotal >= voucher.minOrderValue;
                            return (
                                <div
                                    key={voucher.id}
                                    className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isApplicable
                                        ? selectedVoucher?.id === voucher.id
                                            ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 cursor-pointer"
                                            : "border-gray-200 hover:border-emerald-200 cursor-pointer"
                                        : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                        }`}
                                    onClick={() => {
                                        if (isApplicable) setSelectedVoucher(voucher);
                                    }}
                                >
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                            <Ticket size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{voucher.code}</p>
                                            <p className="text-sm text-gray-600">{voucher.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">Min. order: {formatVND(voucher.minOrderValue)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">-{formatVND(voucher.discountAmount)}</p>
                                        {selectedVoucher?.id === voucher.id && <CheckCircle2 size={16} className="text-emerald-600 ml-auto mt-1" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsVoucherModalOpen(false)}>Apply</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}