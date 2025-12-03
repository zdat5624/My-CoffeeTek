import {
    Clock,
    Utensils,
    Truck,
    CheckCircle2,
    XCircle,
} from "lucide-react";

// --- 1. ENUMS & INTERFACES ---
export enum OrderType {
    POS = 'POS',
    ONLINE = 'ONLINE'
}

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    SHIPPING = 'shipping',
    COMPLETED = 'completed',
    CANCELED = 'canceled',
}

export interface Topping {
    name: string;
    price: number;
}

export interface OrderDetailItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
    size?: string;
    toppings?: Topping[];
    image: string;
    note?: string;
}

export interface Order {
    id: string;
    date: string;
    status: OrderStatus;
    orderType: OrderType;
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    customerName: string;
    customerPhone: string;
    shippingAddress: string | null;
    paymentMethod: 'COD' | 'BANK_TRANSFER' | 'E_WALLET' | 'CASH';
    note?: string;
    items: OrderDetailItem[];
}

export interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    avatar: string;
    gender: 'Male' | 'Female' | 'Other';
    dob: string;
}

// --- 2. HELPER FUNCTIONS ---
export const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.PENDING:
            return { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "Pending" };
        case OrderStatus.PAID:
            return { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Utensils, label: "Paid / Preparing" };
        case OrderStatus.SHIPPING:
            return { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Truck, label: "Shipping" };
        case OrderStatus.COMPLETED:
            return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Completed" };
        case OrderStatus.CANCELED:
            return { color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: "Canceled" };
        default:
            return { color: "bg-gray-100 text-gray-700", icon: Clock, label: status };
    }
};

// --- 3. MOCK DATA ---
export const MOCK_USER: UserProfile = {
    firstName: "Tuan",
    lastName: "Le",
    email: "tuan.le@example.com",
    phone: "0909123456",
    address: "123 Nguyen Hue, District 1, HCMC",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80",
    gender: "Male",
    dob: "1995-05-15",
};

// Hàm tạo data giả (đã rút gọn code để clean hơn)
export const generateMockOrders = (): Order[] => {
    return Array.from({ length: 12 }).map((_, i) => {
        const isPos = i % 4 === 0;
        const orderType = isPos ? OrderType.POS : OrderType.ONLINE;

        let status: OrderStatus;
        if (i === 0) status = OrderStatus.PENDING;
        else if (i === 1) status = OrderStatus.PAID;
        else if (i === 2) status = OrderStatus.SHIPPING;
        else if (i === 3) status = OrderStatus.CANCELED;
        else status = OrderStatus.COMPLETED;

        if (isPos && status === OrderStatus.SHIPPING) status = OrderStatus.COMPLETED;

        const date = new Date();
        date.setDate(date.getDate() - i);

        const items: OrderDetailItem[] = [
            {
                id: 1,
                name: i % 2 === 0 ? "Cappuccino Delight" : "Matcha Latte",
                quantity: 1,
                price: 55000,
                size: "M",
                image: i % 2 === 0
                    ? "https://images.unsplash.com/photo-1572442388796-11668a67e569?auto=format&fit=crop&w=200&q=80"
                    : "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?auto=format&fit=crop&w=200&q=80",
                toppings: []
            },
            ...(i % 2 !== 0 ? [{
                id: 2,
                name: "Royal Milk Tea",
                quantity: 2,
                price: 45000,
                size: "L",
                image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200&q=80",
                toppings: [{ name: "Black Pearl", price: 5000 }]
            }] : [])
        ];

        const subtotal = items.reduce((acc, item) => {
            const toppingPrice = item.toppings?.reduce((tAcc, t) => tAcc + t.price, 0) || 0;
            return acc + (item.price + toppingPrice) * item.quantity;
        }, 0);

        const shippingFee = isPos ? 0 : 15000;
        const discount = i % 5 === 0 ? 10000 : 0;

        return {
            id: `ORD-${orderType}-${(2024000 + i).toString()}`,
            date: date.toISOString(),
            status: status,
            orderType: orderType,
            subtotal,
            shippingFee,
            discount,
            total: subtotal + shippingFee - discount,
            customerName: "Tuan Le",
            customerPhone: "0909123456",
            shippingAddress: isPos ? null : "123 Nguyen Hue, District 1, Ho Chi Minh City",
            paymentMethod: isPos ? 'CASH' : (i % 2 === 0 ? 'COD' : 'E_WALLET'),
            note: i % 4 === 0 ? "Less ice please." : undefined,
            items
        };
    });
};

export const MOCK_ORDERS = generateMockOrders();