"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
    Star, Edit2, Trash2, User, MessageSquare,
    ChevronLeft, ChevronRight, AlertTriangle,
    Eye, EyeOff, ShieldCheck, Filter, X
} from "lucide-react";

// --- DAYJS SETUP ---
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";

dayjs.extend(relativeTime);
dayjs.locale("en");

const formatReviewDate = (dateString: string) => {
    const date = dayjs(dateString);
    const today = dayjs();
    if (date.isSame(today, 'day')) return date.fromNow();
    return dayjs(date).format("DD/MM/YYYY HH:mm");
};

// Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Services & Interfaces
import { useAuthContext } from "@/contexts/AuthContext";
import { reviewService, ReviewItem, ReviewStatistics, FilterReviewParams } from "@/services/reviewService";

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// =========================================================================
// 1. STATS COMPONENT
// =========================================================================
const ReviewStats = ({ stats }: { stats: ReviewStatistics | null }) => {
    if (!stats) return null;

    return (
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="text-center md:text-left min-w-[140px]">
                    <div className="text-6xl font-extrabold text-emerald-700 tracking-tighter">{stats.averageRating}</div>
                    <div className="flex justify-center md:justify-start my-2 text-yellow-400 gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={20} fill={s <= Math.round(stats.averageRating) ? "currentColor" : "none"} />
                        ))}
                    </div>
                    <p className="text-sm font-medium text-gray-500">{stats.totalReviews} verified reviews</p>
                </div>
                <div className="flex-1 w-full space-y-2.5">
                    {stats.stars.map((item) => (
                        <div key={item.star} className="flex items-center gap-3 text-sm group cursor-default">
                            <span className="w-3 font-semibold text-gray-600 group-hover:text-emerald-700 transition-colors">{item.star}</span>
                            <Star size={14} className="text-gray-300 group-hover:text-yellow-400 transition-colors" fill={item.count > 0 ? "currentColor" : "none"} />
                            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out group-hover:bg-emerald-600"
                                    style={{ width: `${item.percent}%` }}
                                />
                            </div>
                            <span className="w-10 text-right text-gray-400 text-xs font-mono">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// =========================================================================
// 2. MODALS (Create/Edit & Delete)
// =========================================================================
interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    initialData?: { rating: number; comment: string };
    isSubmitting: boolean;
}

const ReviewModal = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }: ReviewModalProps) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (isOpen) {
            setRating(initialData?.rating || 5);
            setComment(initialData?.comment || "");
        }
    }, [isOpen, initialData]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Review" : "Write a Review"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-semibold text-gray-600">How would you rate it?</span>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`p-1 transition-all hover:scale-110 focus:outline-none ${star <= rating ? "text-yellow-400 drop-shadow-sm" : "text-gray-300"}`}
                                >
                                    <Star size={36} fill="currentColor" />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-emerald-600 h-5">
                            {rating === 5 ? "Absolutely Amazing!" : rating === 4 ? "Pretty Good" : rating === 3 ? "It's Okay" : rating === 2 ? "Disappointed" : "Terrible"}
                        </span>
                    </div>
                    <Textarea
                        placeholder="Share your experience with this product..."
                        className="min-h-[120px] resize-none focus-visible:ring-emerald-500 text-base"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={() => onSubmit(rating, comment)} className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting }: any) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle size={24} />
                        <DialogTitle>Delete Review?</DialogTitle>
                    </div>
                    <DialogDescription>
                        Are you sure you want to delete this review? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// =========================================================================
// 3. RATING FILTER COMPONENT (New)
// =========================================================================
interface RatingFilterProps {
    currentRating?: number;
    onChange: (rating?: number) => void;
}

const RatingFilter = ({ currentRating, onChange }: RatingFilterProps) => {
    const ratings = [5, 4, 3, 2, 1];

    return (
        <div className="flex flex-wrap gap-2 mb-6">
            <Button
                variant={currentRating === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => onChange(undefined)}
                className={`rounded-full px-4 ${currentRating === undefined ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-gray-600 hover:text-emerald-600 border-gray-200'}`}
            >
                All Reviews
            </Button>
            {ratings.map(star => (
                <Button
                    key={star}
                    variant={currentRating === star ? "default" : "outline"}
                    size="sm"
                    onClick={() => onChange(star)}
                    className={`rounded-full px-4 border-gray-200 ${currentRating === star
                        ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent'
                        : 'text-gray-600 hover:text-emerald-600 hover:border-emerald-200 bg-white'}`}
                >
                    {star} Stars
                </Button>
            ))}
        </div>
    );
};

// =========================================================================
// 4. MAIN COMPONENT
// =========================================================================
interface ProductReviewsProps {
    productId: number;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthContext();

    // Roles
    const isAdminOrOwner = useMemo(() => {
        if (!user || !user.roles) return false;
        return user.roles.some((r: any) => ['admin', 'owner', 'manager'].includes(r.role_name?.toLowerCase()));
    }, [user]);

    // State
    const [myReview, setMyReview] = useState<ReviewItem | null>(null);
    const [otherReviews, setOtherReviews] = useState<ReviewItem[]>([]);
    const [stats, setStats] = useState<ReviewStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterRating, setFilterRating] = useState<number | undefined>(undefined);
    const [adminFilter, setAdminFilter] = useState<"all" | "hidden" | "visible">("all");
    const ITEMS_PER_PAGE = 5;

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewIdToDelete, setReviewIdToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- FETCH DATA ---
    const fetchData = useCallback(async (currentPage: number, isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const params: FilterReviewParams = {
                productId,
                page: currentPage,
                items_per_page: ITEMS_PER_PAGE,
                rating: filterRating, // Pass filter rating to API
            };

            // Admin Logic
            if (isAdminOrOwner) {
                if (adminFilter === "hidden") params.isHidden = true;
                if (adminFilter === "visible") params.isHidden = false;
            } else {
                params.isHidden = false;
            }



            if (isAuthenticated && user?.id) {
                params.excludeUserId = user.id;
                const [myReviewRes, othersRes] = await Promise.all([
                    reviewService.getMyReview(productId),
                    reviewService.getReviews(params)
                ]);
                setMyReview(myReviewRes);
                setOtherReviews(othersRes.data);
                setStats(othersRes.meta.statistics);
                setTotalPages(othersRes.meta.totalPages);

            } else {
                const othersRes = await reviewService.getReviews(params);
                setOtherReviews(othersRes.data);
                setMyReview(null);
                setStats(othersRes.meta.statistics);
                setTotalPages(othersRes.meta.totalPages);
            }
            await new Promise(res => setTimeout(res, 1000)); // Simulate delay for better UX
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, [productId, isAuthenticated, user?.id, isAdminOrOwner, adminFilter, filterRating]); // Add filterRating to dep

    // Initial Load & Filter Changes
    useEffect(() => {
        fetchData(page, false);
    }, [fetchData, page]);

    // Handle Rating Filter Change (Reset page to 1)
    const handleRatingFilterChange = (rating?: number) => {
        setFilterRating(rating);
        setPage(1); // Reset to first page
    };

    // --- SOCKET ---
    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        const handleSocketUpdate = (payload: any) => {
            if (payload.productId === productId || (payload.id && payload.productId === productId)) {
                fetchData(page, true);
            }
        };
        newSocket.on('review_created', handleSocketUpdate);
        newSocket.on('review_updated', handleSocketUpdate);
        newSocket.on('review_deleted', handleSocketUpdate);
        return () => { newSocket.disconnect(); };
    }, [productId, page, fetchData]);

    // --- ACTIONS ---
    const handleSubmitReview = async (rating: number, comment: string) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            if (myReview) {
                await reviewService.update(myReview.id, { rating, comment });
            } else {
                await reviewService.create({ productId, rating, comment });
            }
            setIsModalOpen(false);
        } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
    };

    const confirmDelete = (id: number) => { setReviewIdToDelete(id); setDeleteModalOpen(true); };
    const executeDelete = async () => {
        if (!reviewIdToDelete) return;
        setIsDeleting(true);
        try {
            await reviewService.remove(reviewIdToDelete);
            if (myReview?.id === reviewIdToDelete) setMyReview(null);
            setDeleteModalOpen(false); setReviewIdToDelete(null);
        } catch (error) { console.error(error); } finally { setIsDeleting(false); }
    };

    const toggleHidden = async (id: number) => {
        try { await reviewService.toggleHidden(id); } catch (error) { console.error(error); }
    };

    // --- RENDER ---
    return (
        <div className="mt-12 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="text-emerald-600" /> Customer Reviews
                </h3>
                {isAdminOrOwner && (
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1 px-2 text-xs font-bold text-gray-500 uppercase">
                            <ShieldCheck size={14} className="text-emerald-600" /> Admin
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <Select value={adminFilter} onValueChange={(val: any) => setAdminFilter(val)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-none shadow-sm focus:ring-0">
                                <Filter size={12} className="mr-2" /> <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Show All</SelectItem>
                                <SelectItem value="visible">Visible</SelectItem>
                                <SelectItem value="hidden">Hidden</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Statistics */}
            <ReviewStats stats={stats} />

            {/* Rating Filter & Write Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <RatingFilter currentRating={filterRating} onChange={handleRatingFilterChange} />

                {isAuthenticated ? (
                    !myReview && (
                        <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all hover:shadow-lg rounded-full px-6">
                            <Edit2 size={16} className="mr-2" /> Write a Review
                        </Button>
                    )
                ) : (
                    <Button variant="outline" onClick={() => router.push('/auth/login')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        Login to Review
                    </Button>
                )}
            </div>

            {/* Reviews Container */}
            <div className="space-y-6">

                {/* My Review */}
                {isAuthenticated && myReview && myReview.isHidden !== true && (
                    <div className="bg-emerald-50/30 border border-emerald-200 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4 w-full">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={user?.detail?.avatar_url} />
                                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{user?.first_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                You <span className="text-xs font-normal text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Verified Buyer</span>
                                                {myReview.isHidden && <Badge variant="destructive" className="h-5 text-[10px]"><EyeOff size={10} className="mr-1" /> Hidden</Badge>}
                                            </div>
                                            <span className="text-xs text-gray-400 mt-1 block">{formatReviewDate(myReview.updatedAt)}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(true)} className="hover:bg-white hover:text-emerald-600 rounded-full h-8 w-8"><Edit2 size={16} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(myReview.id)} className="hover:bg-white hover:text-red-600 rounded-full h-8 w-8"><Trash2 size={16} /></Button>
                                        </div>
                                    </div>
                                    <div className="flex text-yellow-400 my-2">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= myReview.rating ? "currentColor" : "none"} />)}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{myReview.comment}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Other Reviews */}
                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
                    </div>
                ) : otherReviews.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4 text-gray-400">
                            <MessageSquare size={24} />
                        </div>
                        <p className="text-gray-500 font-medium">No reviews match your filter.</p>
                        {filterRating && <Button variant="link" onClick={() => handleRatingFilterChange(undefined)} className="text-emerald-600">Clear filter</Button>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {otherReviews.map((review) => (
                            <div key={review.id} className={`bg-white border rounded-2xl p-6 transition-all duration-300 hover:shadow-md ${review.isHidden ? 'border-red-100 bg-red-50/50' : 'border-gray-100'}`}>
                                <div className="flex gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={review.user?.detail?.avatar_url} />
                                        <AvatarFallback className="bg-gray-100 text-gray-500 font-medium"><User size={18} /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900">{review.user?.last_name} {review.user?.first_name}</span>
                                                    {review.isHidden && isAdminOrOwner && <Badge variant="outline" className="border-red-200 text-red-600 text-[10px]"><EyeOff size={10} className="mr-1" /> Hidden</Badge>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex text-yellow-400">
                                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={s <= review.rating ? "currentColor" : "none"} />)}
                                                    </div>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-400">{formatReviewDate(review.createdAt)}</span>
                                                </div>
                                            </div>

                                            {isAdminOrOwner && (
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleHidden(review.id)}>
                                                        {review.isHidden ? <EyeOff size={14} className="text-amber-500" /> : <Eye size={14} className="text-gray-400 hover:text-emerald-600" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => confirmDelete(review.id)}>
                                                        <Trash2 size={14} className="text-gray-400 hover:text-red-600" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm mt-3 leading-relaxed">{review.comment}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Shadcn-style Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-10">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium text-gray-600">
                            Page {page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal Components */}
            <ReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmitReview} isSubmitting={isSubmitting} initialData={myReview ? { rating: myReview.rating, comment: myReview.comment || "" } : undefined} />
            <DeleteConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={executeDelete} isDeleting={isDeleting} />
        </div>
    );
};