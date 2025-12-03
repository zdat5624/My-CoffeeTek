import api from "@/lib/api";

// ==========================================
// 1. DEFINITIONS: TYPES & INTERFACES
// ==========================================

/**
 * Dữ liệu trả về từ API (Khớp với Model UserAddress)
 */
export interface AddressResponse {
    id: number;
    userId: number;
    recipientName: string;
    phoneNumber: string;
    fullAddress: string;
    isDefault: boolean;
}

/**
 * Body gửi lên khi tạo mới địa chỉ
 */
export interface CreateAddressBody {
    recipientName: string;
    phoneNumber: string;
    fullAddress: string;
    isDefault?: boolean;
}

/**
 * Body gửi lên khi cập nhật địa chỉ
 */
export interface UpdateAddressBody {
    recipientName?: string;
    phoneNumber?: string;
    fullAddress?: string;
    isDefault?: boolean;
}

// ==========================================
// 2. ADDRESS SERVICE
// ==========================================

export const addressService = {
    /**
     * Lấy danh sách địa chỉ của user hiện tại
     * Method: GET /address
     */
    async getAll() {
        const res = await api.get<AddressResponse[]>("/address");
        return res.data;
    },

    /**
     * Lấy chi tiết một địa chỉ
     * Method: GET /address/:id
     */
    async getOne(id: number) {
        const res = await api.get<AddressResponse>(`/address/${id}`);
        return res.data;
    },

    /**
     * Tạo mới địa chỉ
     * Method: POST /address
     */
    async create(data: CreateAddressBody) {
        const res = await api.post<AddressResponse>("/address", data);
        return res.data;
    },

    /**
     * Cập nhật thông tin địa chỉ
     * Method: PATCH /address/:id
     */
    async update(id: number, data: UpdateAddressBody) {
        const res = await api.patch<AddressResponse>(`/address/${id}`, data);
        return res.data;
    },

    /**
     * Đặt làm địa chỉ mặc định
     * Method: PATCH /address/:id/set-default
     */
    async setDefault(id: number) {
        const res = await api.patch(`/address/${id}/set-default`);
        return res.data;
    },

    /**
     * Xóa địa chỉ
     * Method: DELETE /address/:id
     */
    async delete(id: number) {
        const res = await api.delete(`/address/${id}`);
        return res.data;
    },
};