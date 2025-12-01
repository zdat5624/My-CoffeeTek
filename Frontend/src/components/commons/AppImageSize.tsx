"use client";

import React, { useEffect, useState } from "react";
import { Skeleton, theme } from "antd";
// import { Image } from "antd";
import Image from "next/image";


interface AppImageSizeProps {
    srcObj?: string | null;
    src?: string | null;
    alt?: string;
    preview?: boolean;
    style?: React.CSSProperties;
    height?: number | string;
    width?: number | string;
    className?: string;
}

export const AppImageSize: React.FC<AppImageSizeProps> = ({
    src,
    alt,
    srcObj,
    preview = true,
    style,
    height = 200,
    width = "100%",
    className = "",
}) => {
    const { token } = theme.useToken();
    const [loaded, setLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
    const fullSrc = src ? `${baseUrl}/${src}` : srcObj;
    const fallbackImg = "/fallback.png";
    // useEffect(() => {
    //     if (!fullSrc) {
    //         setLoaded(true);
    //         return;
    //     }

    //     const img = new window.Image();
    //     img.src = fullSrc;
    //     img.onload = () => setLoaded(true);
    //     img.onerror = () => setLoaded(true);
    // }, [fullSrc]);

    return (
        <div
            className={className}
            style={{
                position: "relative",
                width,
                height,
                background: token.colorFillTertiary,
                borderRadius: token.borderRadiusLG,
                overflow: "hidden",
                ...style,
            }}
        >
            {/* Skeleton khi đang tải */}
            {/* {!loaded && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: token.colorFillAlter,
                    }}
                >
                    <Skeleton.Image
                        active
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: token.borderRadiusLG,
                        }}
                    />
                </div>
            )} */}

            {/* Ảnh thực */}
            {/* {fullSrc && (

                <Image
                    src={isError ? fallbackImg : (fullSrc || fallbackImg)}
                    alt={alt || ""}
                    fill
                    loading="lazy"
                    onLoadingComplete={() => setLoaded(true)}
                    onError={() => {
                        setIsError(true);
                        setLoaded(true);
                    }}
                    style={{
                        objectFit: "cover",
                        borderRadius: token.borderRadiusLG,
                        opacity: loaded ? 1 : 0,
                        transition: "opacity 0.4s ease",
                    }}
                />
            )} */}
            <Image
                src={isError ? fallbackImg : (fullSrc || fallbackImg)}
                alt={alt || ""}
                fill
                loading="lazy"
                onLoadingComplete={() => setLoaded(true)}
                onError={() => {
                    setIsError(true);
                    setLoaded(true);
                }}
                style={{
                    objectFit: "cover",
                    // borderRadius: token.borderRadiusLG,
                    // opacity: loaded ? 1 : 0,
                    // transition: "opacity 0.4s ease",
                }}
            />
        </div>
    );
};
