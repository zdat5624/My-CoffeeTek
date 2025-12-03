"use client";

import React from "react";
import { X } from "lucide-react";
import { MenuProduct } from "@/services";
import { ProductDetailView } from "./ProductDetailView";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ProductDetailModalProps {
    product: MenuProduct | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailModal = ({
    product,
    isOpen,
    onClose,
}: ProductDetailModalProps) => {
    if (!product) return null;

    const handleOpenChange = (open: boolean) => {
        if (!open) onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="
                    !p-0 !gap-0 
                    !max-w-5xl w-full 
                    h-[90vh] 
                    bg-white rounded-3xl 
                    overflow-hidden
                    outline-none border-none shadow-2xl
                    [&>button]:hidden
                "
                aria-describedby={undefined}
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>{product.name}</DialogTitle>
                </DialogHeader>

                {/* CUSTOM CLOSE BUTTON */}
                {/* FIX: Bọc button trong div để tránh bị class [&>button]:hidden của DialogContent ẩn mất */}
                <div className="absolute top-2 right-2 z-50">
                    <button
                        onClick={onClose}
                        className="border border-gray-100 p-2 bg-white/60 hover:bg-white rounded-full text-gray-500 hover:text-red-500 shadow-sm transition-colors"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <ProductDetailView
                    product={product}
                    onClose={onClose}
                    onAddToCart={(item) => {
                        console.log("Added:", item);
                        onClose();
                    }}
                />
            </DialogContent>
        </Dialog>
    );
};