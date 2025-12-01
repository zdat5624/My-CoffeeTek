"use client";

import React from "react";
import {
    Stepper,
    StepperIndicator,
    StepperItem,
    StepperNav,
    StepperSeparator,
    StepperTitle,
    StepperDescription,
    StepperTrigger,
} from "@/components/ui/stepper";
import {
    Check,
    Clock,
    Truck,
    Package,
    Store,
    CreditCard,
    XCircle,
    LoaderCircle,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Import thêm cái này để merge class màu

// --- Types & Enums ---
export enum OrderType {
    POS = "POS",
    ONLINE = "ONLINE",
}

export enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    SHIPPING = "shipping",
    COMPLETED = "completed",
    CANCELED = "canceled",
}

// --- Configuration ---
const STEPS_CONFIG = {
    [OrderType.ONLINE]: [
        { id: OrderStatus.PENDING, label: "Pending", description: "Processing order", icon: Clock },
        // Đã sửa lại label từ "Confirmed" -> "Paid"
        { id: OrderStatus.PAID, label: "Paid", description: "Payment received", icon: CreditCard },
        { id: OrderStatus.SHIPPING, label: "Shipping", description: "On the way", icon: Truck },
        { id: OrderStatus.COMPLETED, label: "Completed", description: "Delivered", icon: Package },
    ],
    [OrderType.POS]: [
        { id: OrderStatus.PENDING, label: "Pending", description: "At counter", icon: Clock },
        { id: OrderStatus.PAID, label: "Paid", description: "Preparing", icon: CreditCard },
        { id: OrderStatus.COMPLETED, label: "Completed", description: "Served", icon: Store },
    ],
};

interface OrderTrackingStepperProps {
    status: OrderStatus;
    orderType: OrderType;
}

export function OrderTrackingStepper({ status, orderType }: OrderTrackingStepperProps) {
    // 1. Xử lý trường hợp hủy
    if (status === OrderStatus.CANCELED) {
        return (
            <div className="w-full p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600">
                <XCircle size={24} />
                <div>
                    <h4 className="font-bold text-sm">Order Canceled</h4>
                    <p className="text-xs text-red-500">This order has been stopped.</p>
                </div>
            </div>
        );
    }

    const steps = STEPS_CONFIG[orderType] || STEPS_CONFIG[OrderType.ONLINE];
    const currentStepIndex = steps.findIndex((s) => s.id === status);
    const activeStepValue = currentStepIndex !== -1 ? currentStepIndex + 1 : 1;

    return (
        <div className="w-full py-4">
            <Stepper
                value={activeStepValue}
                orientation="horizontal"
                className="w-full"
                indicators={{
                    completed: <Check className="h-4 w-4" />,
                    loading: <LoaderCircle className="animate-spin h-4 w-4" />,
                }}
            >
                <StepperNav className="w-full mx-auto">
                    {steps.map((stepItem, index) => {
                        const stepIndex = index + 1;
                        const isLastStep = index === steps.length - 1;
                        // Logic: Nếu bước hiện tại (activeStepValue) lớn hơn bước này (stepIndex)
                        // nghĩa là đã đi qua bước này -> đường nối phía sau nó phải sáng.
                        const isCompletedStep = activeStepValue > stepIndex;

                        const Icon = stepItem.icon;

                        return (
                            <StepperItem
                                key={stepItem.id}
                                step={stepIndex}
                                className="flex-1 relative"
                                loading={activeStepValue === stepIndex && status !== OrderStatus.COMPLETED}
                            >
                                <StepperTrigger className="flex flex-col items-center text-center gap-2 p-2 w-full">
                                    <StepperIndicator>
                                        <Icon className="h-4 w-4" />
                                    </StepperIndicator>

                                    <div className="space-y-0.5">
                                        <StepperTitle className="text-xs uppercase font-bold">
                                            {stepItem.label}
                                        </StepperTitle>
                                        <StepperDescription className="text-[10px] text-muted-foreground hidden sm:block">
                                            {stepItem.description}
                                        </StepperDescription>
                                    </div>
                                </StepperTrigger>

                                {!isLastStep && (
                                    <StepperSeparator
                                        // Dùng cn() để đổi màu bg dựa trên biến isCompletedStep
                                        className={cn(
                                            "absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] block h-0.5 p-0 m-0 shrink-0 z-0 transition-colors duration-300",
                                            isCompletedStep ? "bg-primary" : "bg-muted"
                                        )}
                                    />
                                )}
                            </StepperItem>
                        );
                    })}
                </StepperNav>
            </Stepper>
        </div>
    );
}