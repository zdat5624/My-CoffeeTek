// components/ui/app-image.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils"; // Hàm merge class của shadcn/ui (nếu có), hoặc dùng clsx

interface AppImageProps {
    src: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    className?: string;
    aspectRatio?: string; // Ví dụ: "aspect-square", "aspect-video"
}

export const AppImage: React.FC<AppImageProps> = ({
    src,
    alt = "Product Image",
    className,
    aspectRatio = "aspect-square" // Mặc định là hình vuông
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    // Xử lý URL ảnh
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
    // Nếu src đã là full url (http...) thì giữ nguyên, nếu không thì nối với base
    const fullSrc = src?.startsWith('http') ? src : `${baseUrl}/${src}`;
    const fallbackImg = "https://placehold.co/400?text=No+Image"; // Hoặc path tới ảnh local của bạn

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-gray-100 rounded-xl", // Tailwind styling thay cho Antd tokens
                aspectRatio,
                className
            )}
        >
            {/* Skeleton / Loading State sử dụng Tailwind animate-pulse */}
            {!isLoaded && !isError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    {/* Optional: Icon placeholder mờ mờ */}
                    <span className="sr-only"></span>
                </div>
            )}

            <Image
                src={isError ? fallbackImg : fullSrc}
                alt={alt}
                fill
                className={cn(
                    "object-cover duration-700 ease-in-out",
                    // Hiệu ứng Fade-in khi load xong
                    isLoaded ? "scale-100 blur-0 opacity-100" : "scale-110 blur-lg opacity-0"
                )}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    setIsError(true);
                    setIsLoaded(true); // Để tắt skeleton
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
    );
};