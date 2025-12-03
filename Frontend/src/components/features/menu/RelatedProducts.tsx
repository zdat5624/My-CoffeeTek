"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ShoppingBag } from "lucide-react";

// Components
import { ProductCard } from "@/components/features/menu/ProductCard"; // Đường dẫn file ProductCard của bạn
import { Button } from "@/components/ui/button";

// Services & Types
import { productService, MenuProduct } from "@/services";
import { Product } from "@/interfaces";
import Link from "next/link";

interface RelatedProductsProps {
    currentProductId: number;
}

export const RelatedProducts = ({ currentProductId }: RelatedProductsProps) => {
    const router = useRouter();
    const [products, setProducts] = useState<MenuProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        const fetchRelated = async () => {
            if (!currentProductId) return;
            setIsLoading(true);
            try {
                const data = await productService.getRelated(currentProductId);
                setProducts(data);
            } catch (error) {
                console.error("Failed to load related products", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRelated();
    }, [currentProductId]);



    // --- RENDER LOADING SKELETON ---
    if (isLoading) {
        return (
            <div className="py-12 border-t border-gray-100 bg-white">
                <div className="container mx-auto px-4">
                    <div className="h-8 w-48 bg-gray-100 rounded mb-8 animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-50 rounded-xl h-[320px] animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Nếu không có sản phẩm nào thì ẩn luôn section
    if (products.length === 0) return null;

    // --- RENDER MAIN CONTENT ---
    return (
        <div className="mt-12 max-w-4xl mx-auto  border-gray-100 bg-gradient-to-b from-white to-gray-50/50 ">

            {/* Section Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                    <Sparkles size={20} fill="currentColor" className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                    You Might Also Like
                </h3>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="h-full">
                        <ProductCard
                            product={product}
                        />
                    </div>
                ))}
            </div>

            {/* View Full Menu Button (Optional) */}
            <div className="mt-10 text-center">
                <Link href="/menu" >
                    <Button
                        variant="outline"
                        className="rounded-full px-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all"
                        onClick={() => router.push('/menu')}
                    >
                        <ShoppingBag size={16} className="mr-2" />
                        View Full Menu
                    </Button>
                </Link>

            </div>
        </div>
    );
};