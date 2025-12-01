'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  Gift,
  Zap,
  Loader2,
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Category, PaginationMeta } from '@/interfaces';
import {
  MenuProduct,
  productService,
  categoryService,
  GetAllProductsParams,
  GetAllMenuProductsParams
} from '@/services';

import { FilterSidebar } from '@/components/features/menu/FilterSidebar';
import { ProductCard } from '@/components/features/menu/ProductCard';
import { ProductDetailModal } from '@/components/features/menu/ProductDetailModal';

export default function MenuPage() {
  // --- 1. State Management ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MenuProduct[]>([]);

  // State Filter & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // ✅ Update: State này giờ sẽ được dùng để call API
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });

  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // State Meta & Loading
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    size: itemsPerPage,
    total: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // UI State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);

  // --- 2. Data Fetching (Categories) ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const data = await categoryService.getAll({ isParentCategory: true });
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data && Array.isArray((data as any).data)) {
          setCategories((data as any).data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // --- 3. Data Fetching (Products) ---
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Mapping Sort Option
        let orderBy = 'id';
        let orderDirection: 'asc' | 'desc' = 'desc';

        switch (sortOption) {
          case 'price-asc':
            orderBy = 'ui_price';
            orderDirection = 'asc';
            break;
          case 'price-desc':
            orderBy = 'ui_price';
            orderDirection = 'desc';
            break;
          case 'name-asc':
            orderBy = 'name';
            orderDirection = 'asc';
            break;
          // ✅ Mới: Case sắp xếp theo % giảm giá
          case 'discount-desc':
            orderBy = 'discount_percent';
            orderDirection = 'desc';
            break;
          case 'newest':
          default:
            orderBy = 'id'; // Hoặc 'created_at'
            orderDirection = 'desc';
            break;
        }

        // Construct Params
        // Lưu ý: Type GetAllProductsParams cần được update trong file services như bạn đã cung cấp
        const params: GetAllMenuProductsParams = {
          page: currentPage,
          size: itemsPerPage,
          search: searchQuery,
          categoryId: selectedCategory || undefined,
          orderBy,
          orderDirection,

          // ✅ Mới: Map range giá vào params API
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
        };

        const response = await productService.getAllMenu(params);

        setProducts(response.data);
        setPaginationMeta(response.meta);

      } catch (error) {
        console.error("Failed to fetch menu products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce call API (chờ 300ms sau khi người dùng dừng thao tác)
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);

    // ✅ Update: Thêm priceRange vào dependency array
  }, [searchQuery, selectedCategory, sortOption, currentPage, itemsPerPage, priceRange]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
    // ✅ Update: Reset về trang 1 khi kéo giá
  }, [searchQuery, selectedCategory, sortOption, priceRange]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section - Giữ nguyên */}
        <div className="relative bg-gradient-to-r from-emerald-50 to-white rounded-3xl p-8 mb-8 overflow-hidden border border-emerald-100 shadow-sm">
          {/* ... Hero Content ... */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="max-w-2xl w-full md:w-1/2">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-3">
                <span className="cursor-pointer hover:underline">Home</span>
                <ChevronRight size={14} />
                <span className="text-gray-400">Menu</span>
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                Fresh Drinks & <span className="text-emerald-700">Sweet Treats</span>
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg mb-4">
                Explore our handcrafted coffee, refreshing teas, and freshly baked goods.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button className="rounded-full bg-emerald-700 hover:bg-emerald-800 h-12 px-8 text-base shadow-lg shadow-emerald-200/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  <TrendingUp size={18} /> Best Sellers
                </Button>
                <Button variant="outline" className="rounded-full h-12 px-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white/50 backdrop-blur-sm flex items-center gap-2">
                  <Gift size={18} /> Daily Specials
                </Button>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex justify-center md:justify-end relative">
              <div className="relative w-72 h-72 md:w-80 md:h-80">
                <div className="absolute inset-0 bg-emerald-100 rounded-full opacity-60 transform translate-x-4 translate-y-2"></div>
                <div className="absolute inset-0 bg-yellow-50 rounded-full opacity-60 transform -translate-x-4 -translate-y-2"></div>
                <img
                  src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80"
                  alt="Hero Drink"
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-xl z-10 hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-6">
          <Button
            variant="outline"
            className="w-full flex gap-2 justify-between group"
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <span className="flex items-center gap-2"><Filter size={16} /> Filters & Categories</span>
            <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0 bg-white p-5 rounded-lg border border-gray-200 shadow-sm h-fit sticky top-24">
            {isCategoriesLoading ? (
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            ) : (
              <FilterSidebar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                categories={categories}
              />
            )}
          </aside>

          {/* Mobile Filter Overlay */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-[60] bg-black/50 md:hidden flex justify-end">
              <div className="w-[80%] max-w-sm bg-white h-full p-5 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="p-2">
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                </div>
                <FilterSidebar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  categories={categories}
                />
                <div className="mt-8 pt-4 border-t">
                  <Button className="w-full" onClick={() => setIsMobileFilterOpen(false)}>
                    Show Results
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-sm text-gray-500 font-medium">
                Showing <span className="text-gray-900 font-bold">{products.length}</span> of {paginationMeta.total} products
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
                <select
                  className="text-sm border-none bg-gray-50 rounded-md py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium text-gray-700"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  {/* ✅ Mới: Option Best Discount */}
                  <option value="discount-desc">Best Discount %</option>
                </select>
              </div>
            </div>

            {/* Product Grid with Loading State */}
            <div className="min-h-[600px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                    <p className="text-sm text-gray-500">Loading delicious items...</p>
                  </div>
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {products.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={setSelectedProduct}
                      />
                    ))}
                  </div>

                  {/* Pagination using API Meta */}
                  {paginationMeta.totalPages > 1 && (
                    <div className="mt-12 flex justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {Array.from({ length: paginationMeta.totalPages }, (_, i) => {
                        const pageNum = i + 1;
                        if (paginationMeta.totalPages > 7 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== paginationMeta.totalPages) {
                          if (Math.abs(currentPage - pageNum) === 3) return <span key={pageNum} className="px-2">...</span>;
                          return null;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${currentPage === pageNum
                              ? 'bg-emerald-700 text-white shadow-md'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === paginationMeta.totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationMeta.totalPages))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <p className="text-lg">No products found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}