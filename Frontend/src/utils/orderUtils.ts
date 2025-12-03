// utils/orderUtils.ts
import { OrderStatus, OrderType } from "@/interfaces";

// convert order status to color for UI display của antd Tag component
export const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
        case OrderStatus.PENDING:
            return "gold";
        case OrderStatus.PAID:
            return "green";
        case OrderStatus.SHIPPING:
            return "purple";
        case OrderStatus.COMPLETED:
            return "geekblue";
        case OrderStatus.CANCELED:
            return "red";
        default:
            return "default";
    }
};

export const getOrderTypeColor = (type: OrderType): string => {
    switch (type) {
        case OrderType.ONLINE:
            return "cyan";       // Không trùng bất kỳ status nào
        case OrderType.POS:
            return "volcano";    // Không trùng và rất nổi bật
        default:
            return "default";
    }
};
