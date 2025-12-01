import { PaginatedResponse, Voucher } from "@/interfaces/types";
import { VoucherGroup } from "@/services/voucherService";

// 1. Mock Danh sách các nhóm Voucher đang chạy (Voucher Groups)
// Giả lập API: GET /voucher/groups
export const MOCK_VOUCHER_GROUPS: PaginatedResponse<VoucherGroup> = {
    data: [
        {
            group_name: "WELCOME_NEW_MEMBER",
            voucher_name: "Chào bạn mới - Giảm 50%",
            discount_percentage: 50,
            valid_from: "2024-01-01T00:00:00Z",
            valid_to: "2025-12-31T23:59:59Z",
            total: 1000,
            active: 800,
            inactive: 200,
        },
        {
            group_name: "SUMMER_VIBES_2024",
            voucher_name: "Mát lạnh mùa hè - Giảm 20%",
            discount_percentage: 20,
            valid_from: "2024-05-01T00:00:00Z",
            valid_to: "2024-08-31T23:59:59Z",
            total: 500,
            active: 450,
            inactive: 50,
        },
        {
            group_name: "COFFEE_LOVER",
            voucher_name: "Thứ 2 tỉnh táo - Giảm 15k",
            discount_percentage: 15, // Giả sử backend trả về số, UI tự format nếu là tiền
            valid_from: "2024-01-01T00:00:00Z",
            valid_to: "2024-12-31T23:59:59Z",
            total: 2000,
            active: 1900,
            inactive: 100,
        },
        {
            group_name: "VIP_EXCLUSIVE",
            voucher_name: "Đặc quyền VIP - Giảm 30%",
            discount_percentage: 30,
            valid_from: "2024-06-01T00:00:00Z",
            valid_to: "2024-06-30T23:59:59Z",
            total: 100,
            active: 20, // Sắp hết
            inactive: 80,
        },
        {
            group_name: "FREESHIP_06",
            voucher_name: "Freeship đơn từ 0đ",
            discount_percentage: 100,
            valid_from: "2024-06-06T00:00:00Z",
            valid_to: "2024-06-06T23:59:59Z",
            total: 5000,
            active: 0, // Đã hết lượt active (ví dụ)
            inactive: 5000,
        },
    ],
    meta: {
        total: 5,
        page: 1,
        size: 10,
        totalPages: 1,
    },
};

// 2. Mock Danh sách Voucher mà User đang sở hữu (Active)
// Giả lập API: GET /voucher/user/active
export const MOCK_USER_ACTIVE_VOUCHERS: Voucher[] = [
    {
        id: 101,
        code: "WELCOME-USER-001",
        group_name: "WELCOME_NEW_MEMBER", // User đã có voucher của nhóm này
        voucher_name: "Chào bạn mới - Giảm 50%",
        discount_percentage: 50,
        minAmountOrder: 0,
        requirePoint: 0,
        valid_from: "2024-01-01T00:00:00Z",
        valid_to: "2024-02-01T00:00:00Z",
        is_active: true,
    },
    {
        id: 102,
        code: "VIP-USER-999",
        group_name: "VIP_EXCLUSIVE", // User đã có voucher của nhóm này
        voucher_name: "Đặc quyền VIP - Giảm 30%",
        discount_percentage: 30,
        minAmountOrder: 200000,
        requirePoint: 500,
        valid_from: "2024-06-01T00:00:00Z",
        valid_to: "2024-06-30T23:59:59Z",
        is_active: true,
    },
];