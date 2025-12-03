"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Coffee, Star, Zap, Utensils, ArrowRight, Percent } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { ProductCard } from "../features/menu/ProductCard";

// Services & Types
import { MenuProduct, productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/interfaces";

// Type mở rộng để chứa cả thông tin category và list sản phẩm của nó
interface CategorySectionData extends Category {
    products: MenuProduct[];
}

export default function HomeSections() {
    const router = useRouter();

    // State
    const [bestSellers, setBestSellers] = useState<MenuProduct[]>([]);
    const [topDeals, setTopDeals] = useState<MenuProduct[]>([]); // ✅ State mới cho hàng giảm giá
    const [newArrivals, setNewArrivals] = useState<MenuProduct[]>([]);

    // State chứa danh sách các section động theo Category
    const [categorySections, setCategorySections] = useState<CategorySectionData[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch dữ liệu cố định (Best Seller, Top Deals, New Arrivals)
                const bestSellerPromise = productService.getBestSellingProduct(4);

                // ✅ Promise mới lấy sản phẩm giảm giá nhiều nhất
                const dealsPromise = productService.getAllMenu({
                    page: 1,
                    size: 4,
                    orderBy: 'discount_percent',
                    orderDirection: 'desc'
                });

                const newestPromise = productService.getAllMenu({
                    page: 1, size: 4, orderBy: 'id', orderDirection: 'desc'
                });

                // 2. Fetch Categories cha
                const categoriesRes = await categoryService.getAll({ isParentCategory: true, size: 99 });
                const allCategories = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes.data;

                // 3. Lọc bỏ category "Topping" và sắp xếp
                const validCategories = allCategories
                    .filter((c: Category) => c.is_parent_category)
                    .sort((a: Category, b: Category) => a.sort_index - b.sort_index);

                // 4. Fetch Products cho TỪNG Category (Parallel fetching)
                const categorySectionPromises = validCategories.map(async (cat: Category) => {
                    const productsRes = await productService.getAllMenu({
                        page: 1,
                        size: 4,
                        categoryId: cat.id
                    });
                    return {
                        ...cat,
                        products: productsRes.data
                    } as CategorySectionData;
                });

                // 5. Chờ tất cả xong (Thêm dealsPromise vào mảng)
                const [bestRes, dealsRes, newRes, ...sectionsResult] = await Promise.all([
                    bestSellerPromise,
                    dealsPromise, // ✅ Thêm vào đây
                    newestPromise,
                    ...categorySectionPromises
                ]);

                // 6. Cập nhật State
                setBestSellers(bestRes);
                setTopDeals(dealsRes.data); // ✅ Cập nhật data
                setNewArrivals(newRes.data);

                // Lọc bỏ những category không có sản phẩm nào
                setCategorySections(sectionsResult.filter(section => section.products.length > 0));

            } catch (error) {
                console.error("Failed to fetch home section data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="py-24 space-y-8 container mx-auto px-4">
                <div className="h-10 bg-gray-100 rounded w-1/3 animate-pulse mx-auto mb-12"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-80 bg-gray-50 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Helper Component: Product Grid Reusable
    const ProductGrid = ({ title, subtitle, products, icon: Icon, viewLink }: {
        title: string,
        subtitle?: string,
        products: MenuProduct[],
        icon?: any,
        viewLink?: string
    }) => (
        <div className="mb-20 last:mb-0">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 px-2 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        {Icon && (
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <Icon size={24} />
                            </div>
                        )}
                        {title}
                    </h2>
                    {subtitle && <p className="text-gray-500 mt-2 ml-1">{subtitle}</p>}
                </div>

                <Link href={viewLink || "/menu"}>
                    <Button variant="ghost" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 group transition-all rounded-full px-6">
                        View All <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {products.map((product) => (
                        <div key={product.id} className="h-full">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 italic">No products available in this section yet.</p>
                </div>
            )}
        </div>
    );

    return (
        <section className="py-16 bg-white relative">
            <div className="container mx-auto px-4 md:px-6">

                {/* --- 1. CATEGORY NAVIGATION GRID --- */}
                <div className="mb-24">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Menu</h2>
                        <p className="text-gray-500 text-lg">From handcrafted coffees to delicious meals, discover your new favorites.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {categorySections.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/menu?categoryId=${cat.id}`}
                                className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center text-center h-full hover:-translate-y-1"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative z-10">
                                    <div className="w-14 h-14 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-emerald-600 transition-colors shadow-inner">
                                        <Utensils size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-700 transition-colors mb-1">
                                        {cat.name}
                                    </h3>
                                    <span className="text-xs text-gray-400 group-hover:text-emerald-600/70 font-medium flex items-center justify-center gap-1">
                                        {cat.products.length}+ Items <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* --- 2. HIGHLIGHT SECTIONS --- */}

                {/* Best Selling */}
                <ProductGrid
                    title="Best Selling"
                    subtitle="Our most loved drinks and treats, curated just for you."
                    products={bestSellers}
                    icon={Star}
                    viewLink="/menu"
                />

                {/* ✅ NEW SECTION: Top Deals */}
                <ProductGrid
                    title="Super Deals"
                    subtitle="Grab your favorites at unbeatable prices."
                    products={topDeals}
                    icon={Percent}
                    viewLink="/menu?sort=discount-desc"
                />

                {/* New Arrivals */}
                <ProductGrid
                    title="New Arrivals"
                    subtitle="Be the first to try our latest creations."
                    products={newArrivals}
                    icon={Zap}
                    viewLink="/menu?sort=newest"
                />

                {/* --- 3. DYNAMIC CATEGORY SECTIONS --- */}
                {categorySections.map((section) => (
                    <ProductGrid
                        key={section.id}
                        title={section.name}
                        subtitle={`Explore our delicious ${section.name.toLowerCase()} collection.`}
                        products={section.products}
                        icon={Coffee}
                        viewLink={`/menu?category=${section.id}`}
                    />
                ))}

            </div>
        </section>
    );
}