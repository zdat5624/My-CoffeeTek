'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { MenuProduct } from '@/services';
import { formatVND } from '@/lib/formatPrice';
// 1. Import AppImage
import { AppImage } from "@/components/ui/app-image";

interface ProductCardProps {
    product: MenuProduct;
    onClick: (product: MenuProduct) => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
    const imageUrl = product.images?.[0]?.image_name || '';

    return (
        <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Wrapper giữ relative và aspect-square để định hình khung ảnh 
                và chứa nút tim (Heart) absolute
            */}
            <div
                className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => onClick(product)}
            >
                {/* 2. Thay thế thẻ img bằng AppImage */}
                <AppImage
                    src={imageUrl}
                    alt={product.name}
                    // - w-full h-full: để lấp đầy wrapper cha
                    // - rounded-none: vì wrapper cha đã bo góc (nếu cần) hoặc do overflow-hidden xử lý
                    // - group-hover:scale-110...: giữ lại hiệu ứng zoom khi hover vào card
                    className="w-full h-full rounded-none group-hover:scale-110 transition-transform duration-500"
                    // - aspect-auto: để nó theo tỉ lệ của wrapper cha (aspect-square ở trên)
                    aspectRatio="aspect-auto"
                />

                <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-red-500 z-10">
                    <Heart size={18} />
                </button>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500">4.5 (50+)</span>
                </div>
                <h3
                    className="font-semibold text-gray-800 text-base mb-1 line-clamp-1 group-hover:text-emerald-700 transition-colors cursor-pointer"
                    onClick={() => onClick(product)}
                >
                    {product.name}
                </h3>
                <div className="mt-auto flex items-end justify-between pt-3">
                    <div className="flex flex-col">
                        {product.old_price && <span className="text-xs text-gray-400 line-through">{formatVND(product.old_price)}</span>}
                        <span className="text-lg font-bold text-emerald-700">{formatVND(product.ui_price)}</span>
                    </div>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full shadow-sm hover:bg-emerald-700 hover:text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick(product);
                        }}
                    >
                        <ShoppingCart size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
};