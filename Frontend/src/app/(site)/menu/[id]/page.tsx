"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Home, ShoppingBag, Star, Loader2, AlertCircle } from "lucide-react";

// Components
import { ProductDetailView } from "@/components/features/menu/ProductDetailView";
import { Button } from "@/components/ui/button";
import { ProductReviews } from "@/components/features/reviews/ProductReviews";

// Services & Interfaces
import { productService, MenuProduct } from "@/services";
import { Product } from "@/interfaces";
import { RelatedProducts } from "@/components/features/menu/RelatedProducts";

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();

    // State management
    const [product, setProduct] = useState<MenuProduct | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Data Effect (Giữ nguyên logic cũ)
    useEffect(() => {
        const fetchProductDetail = async () => {
            const idString = params?.id;
            if (!idString || Array.isArray(idString)) {
                setError("Invalid Product ID");
                setIsLoading(false);
                return;
            }

            const productId = Number(idString);
            if (isNaN(productId)) {
                setError("Invalid Product ID format");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const data: Product = await productService.getById(productId);

                if (!data) {
                    setError("Product not found");
                } else {
                    const mappedProduct: MenuProduct = {
                        ...data,
                        ui_price: (data as any).ui_price || data.price || 0,
                        old_price: (data as any).old_price || null,
                        toppings: data.toppings || [],
                        optionGroups: data.optionGroups || [],
                        sizes: data.sizes as any
                    };
                    setProduct(mappedProduct);
                }
            } catch (err) {
                console.error("Error fetching product:", err);
                setError("Failed to load product details. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductDetail();
    }, [params?.id]);

    // --- RENDER: LOADING STATE ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
                <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading delicious details...</p>
            </div>
        );
    }

    // --- RENDER: ERROR STATE ---
    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-red-100">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
                    <p className="text-gray-500 mb-6">{error || "We couldn't find the product you're looking for."}</p>
                    <Button onClick={() => router.push('/menu')} className="w-full bg-emerald-700 hover:bg-emerald-800">
                        Back to Menu
                    </Button>
                </div>
            </div>
        );
    }

    // --- RENDER: SUCCESS STATE ---
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">

            {/* --- TOP CONTAINER (Header & Product Detail) --- */}
            <div className="container mx-auto px-4 py-6">

                {/* 1. Header Breadcrumbs */}
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
                            <span className="text-gray-500 truncate max-w-[150px] sm:max-w-none">
                                {product.name}
                            </span>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={() => router.back()}
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm h-10 w-10 shrink-0"
                                >
                                    <ArrowLeft size={20} />
                                </Button>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                        Customize Your Drink
                                    </h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Adjust size, sweetness, and toppings to your liking.
                                    </p>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-3">
                                <div className="bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm flex items-center gap-2 text-sm text-gray-700">
                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                    <span>Highly Rated</span>
                                </div>
                                <div className="bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm flex items-center gap-2 text-sm text-gray-700">
                                    <ShoppingBag size={16} className="text-emerald-600" />
                                    <span>Prepared Fresh</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Product Detail View */}
                {/* Thêm shadow lớn hơn và bo góc mềm mại */}
                <div className="bg-white  shadow-gray-100/50   md:px-10 overflow-hidden mb-6">
                    <ProductDetailView
                        product={product}
                        onClose={() => router.back()}
                        onAddToCart={(item) => {
                            console.log("Added to cart:", item);
                            router.back();
                        }}
                    />
                </div>
            </div>


            {/* --- REVIEW SECTION --- */}
            {/* Đặt trên nền trắng riêng biệt để làm nổi bật nội dung */}
            <div className="bg-white py-6 border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <ProductReviews productId={product.id} />
                </div>
            </div>

            {/* --- DIVIDER SECTION --- */}
            {/* Tạo một vùng chuyển tiếp mềm mại */}
            {/* <div className="w-full bg-gray-50 flex justify-center items-center py-6">


                <div className="flex items-center">
                    <div className="h-px w-32 bg-gray-300 rounded-full opacity-50"></div>
                    <div className="mx-4 text-gray-400 text-xs font-bold tracking-[0.2em] uppercase leading-none">
                        Reviews & Feedback
                    </div>
                    <div className="h-px w-32 bg-gray-300 rounded-full opacity-50"></div>
                </div>
            </div> */}

            <div className="bg-white py-6 border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <RelatedProducts currentProductId={product.id} />

                </div>
            </div>
        </div>
    );
}