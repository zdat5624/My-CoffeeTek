'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { MenuProduct } from '@/services';
import { AppImage } from "@/components/ui/app-image"; // ✅ Import AppImage

// --- Helper function: Định nghĩa trực tiếp để tránh lỗi import ---
const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

interface ProductDetailViewProps {
    product: MenuProduct;
    onClose: () => void;
    onAddToCart: (item: any) => void;
}

export const ProductDetailView = ({
    product,
    onClose,
    onAddToCart,
}: ProductDetailViewProps) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
    const [toppingQuantities, setToppingQuantities] = useState<Record<number, number>>({});

    // Data safeguards
    const sizes = product.sizes ?? [];
    const toppings = product.toppings ?? [];
    const optionGroups = product.optionGroups ?? [];

    useEffect(() => {
        setQuantity(1);
        if (sizes.length > 0) setSelectedSizeId(sizes[0].id);
        const defaultOpts: Record<number, number> = {};
        optionGroups.forEach((g) => {
            if (g.values.length > 0) defaultOpts[g.id] = g.values[0].id;
        });
        setSelectedOptions(defaultOpts);
        setToppingQuantities({});
    }, [product]);

    const currentSize = sizes.find((s) => s.id === selectedSizeId);
    const basePrice = currentSize ? currentSize.price : product.ui_price;
    const toppingTotal = toppings.reduce((sum, topping) => {
        const qty = toppingQuantities[topping.id] || 0;
        return sum + topping.price * qty;
    }, 0);
    const totalPrice = (basePrice + toppingTotal) * quantity;
    const imageUrl = product.images?.[0]?.image_name || "";

    const handleToppingChange = (toppingId: number, delta: number) => {
        setToppingQuantities((prev) => ({
            ...prev,
            [toppingId]: Math.max(0, (prev[toppingId] || 0) + delta),
        }));
    };

    const handleAdd = () => {
        onAddToCart({
            product,
            size: currentSize,
            options: selectedOptions,
            toppings: toppingQuantities,
            quantity,
            totalPrice,
        });
        onClose();
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-white overflow-hidden">

            {/* --- LEFT SIDE: IMAGE (DESKTOP ONLY) --- */}
            {/* Ẩn trên mobile để tối ưu diện tích cuộn */}
            <div className="hidden md:flex w-full md:w-1/2 bg-gray-50 flex-col items-center justify-center relative shrink-0 p-6">
                {/* ✅ Sử dụng AppImage cho Desktop */}
                <div className="relative w-full h-[80%] max-w-md">
                    <AppImage
                        src={imageUrl}
                        alt={product.name}
                        className="object-contain drop-shadow-xl rounded-md"
                        aspectRatio="aspect-square" // Hoặc aspect-[4/5] tùy design
                    />
                </div>
            </div>

            {/* --- RIGHT SIDE: DETAILS & SCROLL AREA --- */}
            <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 bg-white relative">

                {/* DESKTOP HEADER (Chỉ hiện trên Desktop) */}
                <div className="hidden md:block shrink-0 px-6 pt-6 pb-2 bg-white z-10">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.product_detail}</p>
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-emerald-700">{formatVND(basePrice)}</span>
                        {product.old_price && (
                            <span className="text-sm text-gray-400 line-through">{formatVND(product.old_price)}</span>
                        )}
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 w-full min-h-0 relative">
                    <ScrollArea className="h-full w-full">
                        <div className="px-6 pb-6 pt-2 space-y-6">

                            {/* --- MOBILE HEADER & IMAGE (Chỉ hiện trên Mobile) --- */}
                            {/* Đưa vào trong ScrollArea để cuộn cùng nội dung */}
                            <div className="md:hidden -mx-6">
                                {/* Mobile Image Background */}
                                <div className="bg-gray-50 pb-6 pt-16 px-6 flex justify-center">
                                    {/* ✅ Sử dụng AppImage cho Mobile */}
                                    <div className="relative w-full h-48 max-w-[280px]">
                                        <AppImage
                                            src={imageUrl}
                                            alt={product.name}
                                            className="object-contain drop-shadow-lg"
                                            aspectRatio="aspect-video" // Hoặc aspect-square
                                        />
                                    </div>
                                </div>
                                {/* Mobile Title/Price */}
                                <div className="px-6 pt-6">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                                    <p className="text-gray-500 text-sm mb-4">{product.product_detail}</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl font-bold text-emerald-700">{formatVND(basePrice)}</span>
                                        {product.old_price && (
                                            <span className="text-sm text-gray-400 line-through">{formatVND(product.old_price)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Size Selection */}
                            {sizes.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-gray-800 text-sm">Select Size</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {sizes.map((sizeObj) => (
                                            <div
                                                key={sizeObj.id}
                                                onClick={() => setSelectedSizeId(sizeObj.id)}
                                                className={`cursor-pointer px-4 py-2 rounded-lg border flex flex-col items-center min-w-[80px] transition-all ${selectedSizeId === sizeObj.id
                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600"
                                                    : "border-gray-200 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <span className="font-bold text-sm">{sizeObj.size.name}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {sizeObj.price - sizes[0].price > 0
                                                        ? `+${formatVND(sizeObj.price - sizes[0].price)}`
                                                        : "Standard"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Option Groups */}
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
                                                className={`rounded-full px-4 h-8 text-xs ${selectedOptions[group.id] === val.id
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

                            {/* Toppings */}
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
                                                            // ✅ Vẫn dùng thẻ img thường cho Topping vì icon nhỏ (hoặc thay bằng AppImage nếu muốn đồng bộ hoàn toàn)
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

                {/* FOOTER: Fixed at bottom */}
                <div className="shrink-0 p-4 border-t border-gray-100 bg-white z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-200 rounded-lg h-10 px-2 bg-white">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:text-emerald-700 transition-colors">
                                <Minus size={16} />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:text-emerald-700 transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                        <Button className="flex-1 h-10 bg-emerald-700 hover:bg-emerald-800 font-bold transition-all shadow-md" onClick={handleAdd}>
                            <ShoppingCart className="mr-2 w-4 h-4" />
                            Add • {formatVND(totalPrice)}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};