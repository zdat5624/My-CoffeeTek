"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingCartButton({ count = 9 }: { count?: number }) {
    const displayCount = count > 99 ? "99+" : count;

    // Logic badge: Nếu > 99 thì dẹt, còn ít thì tròn
    const badgeSizeClasses = count > 99
        ? "min-w-[1.5rem] h-6 px-1"
        : "w-6 h-6";

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                size="icon"
                className={`
                    relative h-14 w-14 rounded-full p-0 isolate
                    bg-[var(--primary)] text-[var(--primary-foreground)]
                    hover:brightness-110
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
                    flex items-center justify-center
                    overflow-visible

                    after:content-[''] after:absolute after:inset-0 after:rounded-full
                    after:bg-[var(--primary)] 
                    after:-z-10 
                    after:animate-[pulseGlow_2s_cubic-bezier(0.4,0,0.6,1)_infinite]
                    
                    dark:bg-[var(--sidebar-primary)] dark:text-[var(--sidebar-primary-foreground)]
                    dark:after:bg-[var(--sidebar-primary)]
                `}
            >
                {/* CẬP NHẬT: Dùng prop size thay vì class 
                    - size={32} tương đương h-8 w-8
                    - size={36} tương đương h-9 w-9
                    - Bạn có thể điền số bất kỳ, ví dụ size={34}
                */}
                <ShoppingCart
                    className="!h-6 !w-6 relative z-20"
                />

                {/* Badge */}
                {count > 0 && (
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
                )}
            </Button>
        </div>
    );
}