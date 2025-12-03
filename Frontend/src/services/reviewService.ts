import api from "@/lib/api"; // Giả sử bạn dùng axios instance

// ==========================================
// 1. INPUT INTERFACES (Request Params & Body)
// ==========================================

export interface CreateReviewBody {
    productId: number;
    rating: number; // 1 - 5
    comment?: string;
}

export interface UpdateReviewBody {
    rating?: number;
    comment?: string;
}

export interface FilterReviewParams {
    page?: number;
    items_per_page?: number;
    productId: number; // Bắt buộc
    rating?: number;   // Lọc theo sao
    excludeUserId?: number; // ID của user hiện tại (để loại review của chính mình ra khỏi list)

    // Param dành cho Admin
    // - true: Chỉ lấy review bị ẩn
    // - false: Chỉ lấy review hiện (mặc định nếu không truyền)
    // - undefined: Logic backend sẽ tự xử lý (thường là như false)
    isHidden?: boolean;
}

// ==========================================
// 2. OUTPUT INTERFACES (Response Data)
// ==========================================

export interface ReviewUser {
    id: number;
    first_name: string;
    last_name: string;
    detail?: {
        avatar_url: string;
    };
}

export interface ReviewItem {
    id: number;
    rating: number;
    comment: string | null;
    isHidden: boolean; // Trạng thái ẩn/hiện
    createdAt: string;
    updatedAt: string;
    userId: number;
    productId: number;
    user: ReviewUser;
}

export interface ReviewStarStat {
    star: number;
    count: number;
    percent: number;
}

export interface ReviewStatistics {
    totalReviews: number;
    averageRating: number;
    stars: ReviewStarStat[];
}

export interface ReviewMeta {
    total: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    statistics: ReviewStatistics; // <--- Thêm trường này
}

export interface ReviewListResponse {
    data: ReviewItem[];
    meta: ReviewMeta;
}


// Interface cho API trả về
export interface ReviewSummary {
    averageRating: number;
    totalRatings: number;
}

// ==========================================
// 3. SERVICE METHODS
// ==========================================

export const reviewService = {
    /**
     * Lấy danh sách review (Public / Admin)
     * - Khách hàng: Không truyền `isHidden` (mặc định BE trả về false)
     * - Admin muốn xem review ẩn: Truyền `isHidden: true`
     */
    async getReviews(params: FilterReviewParams) {
        const res = await api.get<ReviewListResponse>("/reviews", { params });
        return res.data;
    },

    /**
     * Lấy review của chính User đang login về sản phẩm X
     * Để hiển thị block "Đánh giá của bạn"
     */
    async getMyReview(productId: number) {
        const res = await api.get<ReviewItem | null>(`/reviews/my-review/${productId}`);
        return res.data;
    },

    /**
     * Tạo đánh giá mới (User)
     */
    async create(data: CreateReviewBody) {
        const res = await api.post<ReviewItem>("/reviews", data);
        return res.data;
    },

    /**
     * Cập nhật đánh giá (User)
     */
    async update(reviewId: number, data: UpdateReviewBody) {
        const res = await api.patch<ReviewItem>(`/reviews/${reviewId}`, data);
        return res.data;
    },

    /**
     * Xóa đánh giá (User)
     */
    async remove(reviewId: number) {
        const res = await api.delete<{ message: string }>(`/reviews/${reviewId}`);
        return res.data;
    },

    /**
     * ADMIN ONLY: Ẩn hoặc Hiện review
     * Gọi lần 1 -> Ẩn, Gọi lần 2 -> Hiện
     */
    async toggleHidden(reviewId: number) {
        const res = await api.patch<ReviewItem>(`/reviews/${reviewId}/toggle-hidden`);
        return res.data;
    },

    /**
     * Lấy tóm tắt rating (Average + Count) cho 1 sản phẩm
     */
    async getRatingSummary(productId: number) {
        const res = await api.get<ReviewSummary>(`/reviews/summary/${productId}`);
        return res.data;
    }
};