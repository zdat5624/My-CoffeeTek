import api from "@/lib/api";

// ==========================================
// 1. INPUT INTERFACES (Request Body)
// ==========================================

export interface AddToCartBody {
    productId: number;
    quantity: number;
    sizeId?: number;
    toppingIds?: number[];
    optionIds?: number[];
}

export interface UpdateCartItemBody {
    quantity: number;
}

export interface CheckoutCartBody {
    note?: string;
    shippingAddress: string;
    customerPhone?: string;
}

// ==========================================
// 2. OUTPUT INTERFACES (Response Data)
// ==========================================

export interface CartItemTopping {
    name: string;
    price: number;
}

export interface CartItemOption {
    groupName: string;
    valueName: string;
}

export interface CartItemResponse {
    id: number;
    productId: number;
    productName: string;
    productImage: string | null;
    sizeName: string | null;
    quantity: number;
    unitPrice: number;
    originalPrice: number | null;
    totalPrice: number;
    toppings: CartItemTopping[];
    options: CartItemOption[];
}

export interface CartResponse {
    id: number;
    totalQuantity: number;
    totalTemporaryPrice: number;
    items: CartItemResponse[];
}

export interface CheckoutResponse {
    id: number;
}

// ==========================================
// 3. API SERVICE METHODS
// ==========================================

export const cartService = {
    async getCart() {
        const res = await api.get<CartResponse>("/cart");
        return res.data;
    },

    async addToCart(data: AddToCartBody) {
        const res = await api.post("/cart/add", data);
        return res.data;
    },

    async updateItem(itemId: number, data: UpdateCartItemBody) {
        const res = await api.patch(`/cart/item/${itemId}`, data);
        return res.data;
    },

    async removeItem(itemId: number) {
        const res = await api.delete(`/cart/item/${itemId}`);
        return res.data;
    },

    async clearCart() {
        const res = await api.delete("/cart");
        return res.data;
    },

    async checkout(data: CheckoutCartBody) {
        const res = await api.post<CheckoutResponse>("/cart/checkout", data);
        return res.data;
    }
};
