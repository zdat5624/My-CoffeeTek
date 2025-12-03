"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

export default function FloatingCartButton() {
    const { cart } = useCart();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { isAuthenticated } = useAuthContext();

    useEffect(() => {
        setMounted(true);
    }, []);

    const count = mounted && cart ? cart.totalQuantity : 0;

    // =========================================================
    // RENDER CONDITIONS
    // =========================================================
    // Only hide if:
    // 1. Not mounted yet (hydration)
    // 2. Already on checkout page
    if (!mounted || pathname === '/checkout' || !isAuthenticated || !cart) {
        return null;
    }

    const displayCount = count > 99 ? "99+" : count;

    const badgeSizeClasses = count > 99
        ? "min-w-[1.5rem] h-6 px-1"
        : "w-6 h-6";

    // Reusable Button UI
    const CartButtonUI = (
        <Button
            size="icon"
            // CẬP NHẬT: Đã xóa các điều kiện check count > 0 hoặc count === 0 trong className
            // để animation và màu sắc chính luôn được áp dụng.
            className={`
                relative h-14 w-14 rounded-full p-0 isolate
                bg-[var(--primary)] text-[var(--primary-foreground)]
                hover:brightness-110
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                flex items-center justify-center
                overflow-visible
                transition-all duration-300

                /* ALWAYS APPLY GLOW ANIMATION (Đã xóa điều kiện check count > 0) */
                after:content-[''] after:absolute after:inset-0 after:rounded-full
                after:bg-[var(--primary)] 
                after:-z-10 
                after:animate-[pulseGlow_2s_cubic-bezier(0.4,0,0.6,1)_infinite]
                
                dark:bg-[var(--sidebar-primary)] dark:text-[var(--sidebar-primary-foreground)]
                dark:after:bg-[var(--sidebar-primary)]
            `}
        >
            <ShoppingCart
                className="!h-6 !w-6 relative z-20"
            />

            {/* Badge vẫn chỉ hiện khi có item */}

            <span className={`
                    absolute -top-2 -right-2 
                    rounded-full 
                    ${badgeSizeClasses}
                    bg-white text-primary text-xs font-bold
                    border-2 border-gray-200 shadow-sm
                    flex items-center justify-center z-30
                `}>
                {displayCount}
            </span>
        </Button>
    );

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {count > 0 ? (
                // CASE 1: Has items -> Navigate to Checkout
                <Link href="/checkout">
                    {CartButtonUI}
                </Link>
            ) : (
                // CASE 2: Empty -> Show Toast, No Navigation (Vẫn giữ UI có animation)
                <div onClick={() => toast.info("Your cart is empty. Add some delicious drinks!")}>
                    {CartButtonUI}
                </div>
            )}
        </div>
    );
}