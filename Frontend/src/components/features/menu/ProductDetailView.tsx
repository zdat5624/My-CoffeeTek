'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Minus, Plus, ShoppingCart, Loader2, ChevronRight } from 'lucide-react';
import { MenuProduct } from '@/services';
import { AppImage } from "@/components/ui/app-image";
import { useCart } from "@/contexts/CartContext";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

// --- Helper function ---
const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

interface ProductDetailViewProps {
    product: MenuProduct;
    onClose: () => void;
    onAddToCart?: (item: any) => void;
}

export const ProductDetailView = ({
    product,
    onClose,
    onAddToCart,
}: ProductDetailViewProps) => {
    const { addItem, isUpdating } = useCart();
    const router = useRouter();
    const { isAuthenticated } = useAuthContext();
    const [quantity, setQuantity] = useState(1);
    // Lưu ý: State này sẽ lưu ID của Size (ví dụ: S=1, M=2) chứ không phải ID của ProductSize relation
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
    const [toppingQuantities, setToppingQuantities] = useState<Record<number, number>>({});

    // Data safeguards
    const sizes = product.sizes ?? [];
    const toppings = product.toppings ?? [];
    const optionGroups = product.optionGroups ?? [];

    const category = (product as any).category;
    const parentCategory = category?.parent_category;

    useEffect(() => {
        setQuantity(1);

        // 1. Mặc định chọn Size đầu tiên (Lấy size.id từ object đầu tiên)
        if (sizes.length > 0) {
            setSelectedSizeId(sizes[0].size.id);
        } else {
            setSelectedSizeId(null);
        }

        // 2. Mặc định Options: Rỗng
        setSelectedOptions({});

        setToppingQuantities({});
    }, [product]);

    // --- LOGIC TÍNH GIÁ ---
    // Tìm object ProductSize tương ứng với sizeId đang được chọn
    const currentSizeObj = sizes.find((s) => s.size.id === selectedSizeId);

    // Nếu tìm thấy size (multisize), dùng giá của size đó. Nếu không (single size), dùng giá product gốc.
    const unitPrice = currentSizeObj ? currentSizeObj.price : product.ui_price;
    const unitOldPrice = currentSizeObj ? currentSizeObj.old_price : product.old_price;

    const toppingTotal = toppings.reduce((sum, topping) => {
        const qty = toppingQuantities[topping.id] || 0;
        return sum + topping.price * qty;
    }, 0);

    const totalPrice = (unitPrice + toppingTotal) * quantity;

    const imageUrl = product.images?.[0]?.image_name || "";

    const handleToppingChange = (toppingId: number, delta: number) => {
        setToppingQuantities((prev) => ({
            ...prev,
            [toppingId]: Math.max(0, (prev[toppingId] || 0) + delta),
        }));
    };

    const handleAdd = async () => {
        if (!isAuthenticated) {
            // Using Sonner's syntax
            toast.warning("Login required", {
                description: "Please log in to add items to your cart.",
                action: {
                    label: "Login now",
                    onClick: () => router.push('/auth/login'),
                },
            });
            return;
        }
        const optionIds = Object.values(selectedOptions);
        const toppingIds: number[] = [];
        Object.entries(toppingQuantities).forEach(([idStr, qty]) => {
            const id = Number(idStr);
            if (qty > 0) {
                for (let i = 0; i < qty; i++) toppingIds.push(id);
            }
        });

        await addItem({
            productId: product.id,
            quantity: quantity,
            // Quan trọng: Truyền đúng sizeId (ID của Size master data)
            sizeId: selectedSizeId || undefined,
            optionIds: optionIds,
            toppingIds: toppingIds,
        });

        onClose();
    };



    const CategoryBadge = () => {
        if (!category) return null;
        return (
            <div className="flex items-center gap-1.5 ml-3 shrink-0 self-start mt-1">

                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide md:mr-3">
                    {category.name}
                </span>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full min-h-0 bg-white overflow-hidden">



            {/* --- LEFT SIDE: IMAGE (DESKTOP) --- */}
            <div className="hidden md:flex w-full md:w-1/2 bg-white flex-col items-center justify-center relative shrink-0 p-6">
                <div className="relative w-full h-[80%] max-w-md">
                    <AppImage
                        src={imageUrl}
                        alt={product.name}
                        className="object-contain drop-shadow-xl rounded-md"
                        aspectRatio="aspect-square"
                    />
                </div>
            </div>

            {/* --- RIGHT SIDE: DETAILS --- */}
            <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 bg-white relative">

                {/* DESKTOP HEADER */}
                <div className="hidden md:block shrink-0 px-6 pt-6 pb-2 bg-white z-10">

                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                        <CategoryBadge />
                    </div>

                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.product_detail}</p>

                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-emerald-700">{formatVND(unitPrice)}</span>
                        {unitOldPrice && unitOldPrice > unitPrice && (
                            <span className="text-sm text-gray-400 line-through">{formatVND(unitOldPrice)}</span>
                        )}
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 w-full min-h-0 relative">
                    <ScrollArea className="h-full w-full">
                        <div className="px-6 pb-6 pt-2 space-y-6">

                            {/* MOBILE HEADER & IMAGE */}
                            <div className="md:hidden -mx-6">
                                <div className="bg-gray-50 pb-6 pt-16 px-6 flex justify-center">
                                    <div className="relative w-full h-48 max-w-[280px]">
                                        <AppImage
                                            src={imageUrl}
                                            alt={product.name}
                                            className="object-contain drop-shadow-lg"
                                            aspectRatio="aspect-video"
                                        />
                                    </div>
                                </div>
                                <div className="px-6 pt-6">
                                    {/* 👇 CẬP NHẬT: Mobile Header Flex */}
                                    <div className="flex justify-between items-start mb-2">
                                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                                        <CategoryBadge />
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4">{product.product_detail}</p>

                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl font-bold text-emerald-700">{formatVND(unitPrice)}</span>
                                        {unitOldPrice && unitOldPrice > unitPrice && (
                                            <span className="text-sm text-gray-400 line-through">{formatVND(unitOldPrice)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SIZE SELECTION */}
                            {sizes.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-800 text-sm">Select Size</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {sizes.map((sizeObj) => {
                                            // So sánh selectedSizeId (là size.id) với sizeObj.size.id
                                            const isSelected = selectedSizeId === sizeObj.size.id;
                                            return (
                                                <div
                                                    key={sizeObj.id} // Key vẫn dùng ID unique của ProductSize
                                                    onClick={() => setSelectedSizeId(sizeObj.size.id)} // Set ID của Size (master)
                                                    className={`
                                                        cursor-pointer px-2 py-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all 
                                                        ${isSelected
                                                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600 shadow-sm"
                                                            : "border-gray-200 hover:bg-gray-50"
                                                        }
                                                    `}
                                                >
                                                    <span className="font-bold text-sm mb-1">{sizeObj.size.name}</span>

                                                    <span className="text-xs font-semibold">
                                                        {formatVND(sizeObj.price)}
                                                    </span>

                                                    {sizeObj.old_price && sizeObj.old_price > sizeObj.price && (
                                                        <span className="text-[10px] text-gray-400 line-through">
                                                            {formatVND(sizeObj.old_price)}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* OPTION GROUPS */}
                            {optionGroups.map((group) => (
                                <div key={group.id} className="space-y-2">
                                    <h3 className="font-semibold text-gray-800 text-sm">{group.name}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {group.values.map((val) => (
                                            <Button
                                                key={val.id}
                                                variant={selectedOptions[group.id] === val.id ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedOptions((prev) => ({ ...prev, [group.id]: val.id }))}
                                                className={`rounded-sm px-4 h-8 text-xs ${selectedOptions[group.id] === val.id
                                                    ? "bg-emerald-700 hover:bg-emerald-800"
                                                    : ""
                                                    }`}
                                            >
                                                {val.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* TOPPINGS */}
                            {toppings.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-gray-800 text-sm">Toppings</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {toppings.map((topping) => {
                                            const qty = toppingQuantities[topping.id] || 0;
                                            return (
                                                <div key={topping.id} className={`flex items-center justify-between p-2 rounded-lg border ${qty > 0 ? "border-emerald-200 bg-emerald-50/30" : "border-gray-100"}`}>
                                                    <div className="flex items-center gap-3">
                                                        {topping.image_name && (
                                                            <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                                                                <AppImage
                                                                    src={topping.image_name}
                                                                    alt={topping.name}
                                                                    className="w-10 h-10 object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium">{topping.name}</p>
                                                            <p className="text-xs text-emerald-600">+{formatVND(topping.price)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleToppingChange(topping.id, -1)} disabled={qty === 0} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors">
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="text-sm font-bold w-4 text-center">{qty}</span>
                                                        <button onClick={() => handleToppingChange(topping.id, 1)} className="w-6 h-6 flex items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* FOOTER */}
                <div className="shrink-0 p-4 border-t border-gray-100 bg-white z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-200 rounded-lg h-10 px-2 bg-white">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={isUpdating}
                                className="p-1 hover:text-emerald-700 transition-colors disabled:opacity-50"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                disabled={isUpdating}
                                className="p-1 hover:text-emerald-700 transition-colors disabled:opacity-50"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <Button
                            className="flex-1 h-10 bg-emerald-700 hover:bg-emerald-800 font-bold transition-all shadow-md"
                            onClick={handleAdd}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="mr-2 w-4 h-4" />
                                    Add • {formatVND(totalPrice)}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};