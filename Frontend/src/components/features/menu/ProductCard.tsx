'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Star, Zap } from 'lucide-react';
import { MenuProduct } from '@/services';
import { reviewService } from '@/services/reviewService'; // Ensure this path is correct
import { formatVND } from '@/lib/formatPrice';
import { AppImage } from "@/components/ui/app-image";
import { ProductDetailModal } from './ProductDetailModal';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
    product: MenuProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const imageUrl = product.images?.[0]?.image_name || '';
    const productUrl = `/menu/${product.id}`;
    const { isAuthenticated } = useAuthContext(); // Lấy trạng thái đăng nhập
    const router = useRouter();
    // --- RATING STATE ---
    const [ratingData, setRatingData] = useState({ avg: 0, count: 0 });
    const [loadingRating, setLoadingRating] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);
    // --- FETCH RATING DATA ---
    useEffect(() => {
        let isMounted = true;

        const fetchRating = async () => {
            try {
                // Call the API we defined earlier
                const data = await reviewService.getRatingSummary(product.id);
                if (isMounted) {
                    setRatingData({
                        avg: data.averageRating,
                        count: data.totalRatings
                    });
                }
            } catch (error) {
                console.error(`Failed to load rating for product ${product.id}`, error);
            } finally {
                if (isMounted) setLoadingRating(false);
            }
        };

        fetchRating();

        return () => { isMounted = false; };
    }, [product.id]);

    // Calculate Discount Percentage
    const discountPercent = product.old_price && product.old_price > product.ui_price
        ? Math.round(((product.old_price - product.ui_price) / product.old_price) * 100)
        : 0;


    // --- HANDLE CLICK ADD TO CART / OPEN MODAL ---
    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

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

        setSelectedProduct(product);
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">

            {/* --- IMAGE SECTION --- */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Link href={productUrl} className="block w-full h-full cursor-pointer">
                    <AppImage
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full rounded-none group-hover:scale-110 transition-transform duration-500"
                        aspectRatio="aspect-auto"
                    />
                </Link>

                {/* Discount Badge */}
                {discountPercent > 0 && (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <div className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/20">
                            <Zap size={12} fill="currentColor" className="text-yellow-200" />
                            <span>{discountPercent}% OFF</span>
                        </div>
                    </div>
                )}

                {/* Wishlist Button */}
                <button
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-red-500 z-10"
                    onClick={(e) => {
                        e.preventDefault();
                        // Add Wishlist Logic here
                    }}
                >
                    <Heart size={18} />
                </button>
            </div>

            {/* --- INFO SECTION --- */}
            <div className="p-3 flex flex-col flex-1">

                {/* Real Rating Display */}
                <div className="flex items-center gap-1 mb-1 h-5">
                    {loadingRating ? (
                        // Skeleton Loader for Rating
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : ratingData.count > 0 ? (
                        <>
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-gray-600 font-medium">
                                {ratingData.avg} <span className="text-gray-400">({ratingData.count})</span>
                            </span>
                        </>
                    ) : (
                        <span className="text-xs text-gray-400 italic">No ratings yet</span>
                    )}
                </div>

                {/* Product Name */}
                <h3 className="font-semibold text-base line-clamp-2 min-h-[1em]" title={product.name}>
                    <Link
                        href={productUrl}
                        className="text-gray-800 hover:text-emerald-700 transition-colors cursor-pointer hover:underline decoration-emerald-700/50"
                    >
                        {product.name}
                    </Link>
                </h3>

                {/* Price & Add Button */}
                <div className="mt-auto flex items-end justify-between">
                    <div className="flex flex-col">
                        {product.old_price && product.old_price > product.ui_price && (
                            <span className="text-xs text-gray-400 line-through mb-0.5">
                                {formatVND(product.old_price)}
                            </span>
                        )}
                        <span className="text-lg font-bold text-emerald-700 leading-none">
                            {formatVND(product.ui_price)}
                        </span>
                    </div>

                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-700 hover:text-white transition-colors h-9 w-9"
                        onClick={handleActionClick}
                    >
                        <ShoppingCart size={16} />
                    </Button>
                </div>
            </div>
            <ProductDetailModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </div>
    );
};