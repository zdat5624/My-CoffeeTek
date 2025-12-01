import api from "@/lib/api";

// ==========================================
// 1. DEFINITIONS: REQUEST BODY (INPUT)
// ==========================================

/**
 * Body gửi lên khi thêm sản phẩm vào giỏ
 */
export interface AddToCartBody {
    productId: number;
    quantity: number;
    sizeId?: number;
    toppingIds?: number[];
    optionIds?: number[]; // Ví dụ: ID của '50% Đường', 'Ít đá'
}

/**
 * Body gửi lên khi cập nhật item trong giỏ
 * Cho phép cập nhật số lượng hoặc cấu hình sản phẩm (Size, Topping, Option)
 */
export interface UpdateCartItemBody {
    quantity?: number;
    sizeId?: number;
    toppingIds?: number[];
    optionIds?: number[];
}

// ==========================================
// 2. DEFINITIONS: RESPONSE DATA (OUTPUT)
// ==========================================

export interface CartItemToppingResponse {
    name: string;
    price: number;
}

export interface CartItemOptionResponse {
    groupName: string;
    valueName: string;
}

/**
 * Chi tiết một sản phẩm trong giỏ hàng
 */
export interface CartItemResponse {
    id: number;
    productId: number;
    productName: string;
    productImage: string | null;
    sizeName: string | null;

    quantity: number;

    /** Giá đơn vị tại thời điểm gọi API (đã tính KM) */
    unitPrice: number;

    /** Giá gốc (dùng để hiển thị gạch ngang nếu có KM) */
    originalPrice: number | null;

    /** Tổng tiền = (unitPrice + toppingPrice) * quantity */
    totalPrice: number;

    toppings: CartItemToppingResponse[];
    options: CartItemOptionResponse[];
}

/**
 * Dữ liệu giỏ hàng trả về từ GET /cart
 */
export interface CartResponse {
    id: number;
    totalQuantity: number;
    totalTemporaryPrice: number; // Tổng tiền tạm tính
    items: CartItemResponse[];
}

// ==========================================
// 3. CART SERVICE
// ==========================================

export const cartService = {
    /**
     * Lấy thông tin giỏ hàng hiện tại (kèm giá realtime)
     * Method: GET /cart
     */
    async getCart() {
        const res = await api.get<CartResponse>("/cart");
        return res.data;
    },

    /**
     * Thêm sản phẩm vào giỏ
     * Method: POST /cart/add
     */
    async addToCart(data: AddToCartBody) {
        const res = await api.post("/cart/add", data);
        return res.data;
    },

    /**
     * Cập nhật item (Số lượng, Size, Topping...)
     * Method: PATCH /cart/item/:id
     */
    async updateItem(itemId: number, data: UpdateCartItemBody) {
        const res = await api.patch(`/cart/item/${itemId}`, data);
        return res.data;
    },

    /**
     * Xóa một sản phẩm khỏi giỏ
     * Method: DELETE /cart/item/:id
     */
    async removeItem(itemId: number) {
        const res = await api.delete(`/cart/item/${itemId}`);
        return res.data;
    },

    /**
     * Xóa toàn bộ giỏ hàng
     * Method: DELETE /cart
     */
    async clearCart() {
        const res = await api.delete("/cart");
        return res.data;
    },
};