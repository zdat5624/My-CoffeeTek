'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FilterSection } from './FilterSection';
import { formatVND } from '@/lib/formatPrice';
import { Category } from '@/interfaces';

interface FilterSidebarProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    selectedCategory: number | null;
    setSelectedCategory: (value: number | null) => void;
    priceRange: { min: number; max: number };
    setPriceRange: (value: { min: number; max: number }) => void;
    categories: Category[];
}

export const FilterSidebar = ({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    categories,
}: FilterSidebarProps) => {
    // 1. Tạo state nội bộ để giữ giá trị khi đang kéo slider
    const [localPrice, setLocalPrice] = useState([priceRange.min, priceRange.max]);

    // 2. Đồng bộ state nội bộ khi props từ cha thay đổi (VD: Reset filter)
    useEffect(() => {
        setLocalPrice([priceRange.min, priceRange.max]);
    }, [priceRange.min, priceRange.max]);

    // 3. Chỉ cập nhật giao diện số liệu khi đang kéo
    const handleSliderChange = (value: number[]) => {
        setLocalPrice(value);
    };

    // 4. CHỈ filter thật sự khi người dùng THẢ chuột (quan trọng nhất)
    const handleSliderCommit = (value: number[]) => {
        setPriceRange({ min: value[0], max: value[1] });
    };

    // Xử lý input change (cần cập nhật cả local lẫn parent)
    const handleInputChange = (type: 'min' | 'max', value: string) => {
        const numValue = Number(value);
        const newRange = type === 'min'
            ? { ...priceRange, min: numValue }
            : { ...priceRange, max: numValue };

        // Cập nhật cả 2 để UI đồng bộ ngay lập tức
        setLocalPrice([newRange.min, newRange.max]);
        setPriceRange(newRange);
    };

    return (
        <div className="space-y-1">
            {/* Search */}
            <div className="relative mb-6">
                <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Categories */}
            <FilterSection title="Categories">
                <ul className="space-y-1">
                    <li
                        className={`cursor-pointer text-sm py-1.5 px-2 rounded-md transition-colors font-medium ${!selectedCategory ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        All Products
                    </li>

                    {categories.map((parent) => {
                        const isParentActive = selectedCategory === parent.id;

                        return (
                            <li key={parent.id} className="mt-2">
                                <div
                                    className={`cursor-pointer text-sm py-1.5 px-2 rounded-md transition-colors flex justify-between items-center font-semibold ${isParentActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-800 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setSelectedCategory(parent.id)}
                                >
                                    {parent.name}
                                </div>

                                {parent.subcategories && parent.subcategories.length > 0 && (
                                    <ul className="ml-2 border-l border-gray-200 pl-2 mt-1 space-y-1">
                                        {parent.subcategories.map((child) => (
                                            <li
                                                key={child.id}
                                                className={`cursor-pointer text-sm py-1 px-2 rounded-md transition-colors ${selectedCategory === child.id
                                                    ? 'text-emerald-700 font-medium bg-emerald-50/50'
                                                    : 'text-gray-500 hover:text-emerald-600'
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCategory(child.id);
                                                }}
                                            >
                                                {child.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </FilterSection>

            {/* Price Range */}
            <FilterSection title="Price Range">
                <div className="px-2 space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        {/* Hiển thị giá trị từ local state để mượt mà */}
                        <span>{formatVND(localPrice[0])}</span>
                        <span>{formatVND(localPrice[1])}</span>
                    </div>

                    <Slider
                        // Bind value vào localPrice (state nội bộ)
                        value={localPrice}
                        // Khi kéo: chỉ update UI số liệu
                        onValueChange={handleSliderChange}
                        // Khi thả chuột: mới update danh sách sản phẩm
                        onValueCommit={handleSliderCommit}
                        min={0}
                        max={200000}
                        step={5000}
                        minStepsBetweenThumbs={2}
                        className="w-full"
                    />

                    <div className="flex gap-2">
                        <Input
                            type="number"
                            // Input dùng value từ localPrice
                            value={localPrice[0]}
                            onChange={(e) => handleInputChange('min', e.target.value)}
                            className="h-9 text-xs"
                            placeholder="Min"
                        />
                        <Input
                            type="number"
                            value={localPrice[1]}
                            onChange={(e) => handleInputChange('max', e.target.value)}
                            className="h-9 text-xs"
                            placeholder="Max"
                        />
                    </div>
                </div>
            </FilterSection>
        </div>
    );
};