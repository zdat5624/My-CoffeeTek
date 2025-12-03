"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import {
    cartService,
    CartResponse,
    AddToCartBody,
    UpdateCartItemBody
} from "@/services/cartService";
import { useAuthContext } from "@/contexts/AuthContext"; // ✅ 1. Import AuthContext

// ==========================================
// DEFINITIONS
// ==========================================

interface CartContextType {
    cart: CartResponse | null;
    isLoading: boolean;
    isUpdating: boolean;

    refreshCart: () => Promise<void>;
    addItem: (data: AddToCartBody) => Promise<void>;
    updateItem: (itemId: number, data: UpdateCartItemBody) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ==========================================
// PROVIDER
// ==========================================

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuthContext(); // ✅ 2. Lấy trạng thái Auth
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // 1. Fetch Cart Data
    const refreshCart = useCallback(async () => {
        // ✅ 3. Kiểm tra đăng nhập trước khi gọi API
        if (!isAuthenticated) {
            setCart(null);
            return;
        }

        try {
            const data = await cartService.getCart();
            setCart(data);
        } catch (error) {
            console.error("Failed to fetch cart:", error);
            setCart(null);
        }
    }, [isAuthenticated]);

    // 2. Initial Load & Real-time Sync (BroadcastChannel)
    useEffect(() => {
        // ✅ 4. Đợi Auth check xong mới load Cart
        if (authLoading) return;

        const initCart = async () => {
            setIsLoading(true);
            await refreshCart();
            setIsLoading(false);
        };
        initCart();

        // Lắng nghe sự kiện từ các tab khác
        const channel = new BroadcastChannel('cart_sync_channel');
        channel.onmessage = (event) => {
            if (event.data === 'cart_updated') {
                console.log("🔄 Cart updated from another tab, refreshing...");
                refreshCart();
            }
        };

        return () => {
            channel.close();
        };
    }, [refreshCart, authLoading]); // ✅ Thêm authLoading vào dependency

    // ✅ Helper để gửi tín hiệu cho các tab khác
    const broadcastUpdate = () => {
        const channel = new BroadcastChannel('cart_sync_channel');
        channel.postMessage('cart_updated');
        channel.close();
    };

    // 3. Actions

    const addItem = async (data: AddToCartBody) => {
        if (!isAuthenticated) {
            toast.error("Please login to add items to cart");
            return;
        }
        if (isUpdating) return;

        setIsUpdating(true);
        try {
            await cartService.addToCart(data);
            await refreshCart();
            broadcastUpdate();
            toast.success("Added to cart successfully!");
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || "Error adding product.";
            toast.error(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const updateItem = async (itemId: number, data: UpdateCartItemBody) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            await cartService.updateItem(itemId, data);
            await refreshCart();
            broadcastUpdate();
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update cart.");
        } finally {
            setIsUpdating(false);
        }
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        if (quantity <= 0) {
            return removeItem(itemId);
        }
        return updateItem(itemId, { quantity });
    };

    const removeItem = async (itemId: number) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            await cartService.removeItem(itemId);
            await refreshCart();
            broadcastUpdate();
            // toast.success("Product removed.");
        } catch (error: any) {
            console.error(error);
            toast.error("Error removing product.");
        } finally {
            setIsUpdating(false);
        }
    };

    const clearCart = async () => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            await cartService.clearCart();
            setCart(null);
            broadcastUpdate();
        } catch (error: any) {
            console.error(error);
            toast.error("Error clearing cart.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <CartContext.Provider value={{
            cart,
            isLoading,
            isUpdating,
            refreshCart,
            addItem,
            updateItem,
            updateQuantity,
            removeItem,
            clearCart,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};