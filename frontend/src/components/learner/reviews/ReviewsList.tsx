import { useQuery } from "@tanstack/react-query";
import { StarRating } from "@/components/common/StarRating";
import * as reviewService from "@/services/reviewService";
import { useState } from "react";
import { AddReviewModal } from "./AddReviewModal";
import { useAuthStore } from "@/stores/authStore";
import { Skeleton } from "@/components/ui/Skeleton";

interface ReviewsListProps {
  courseId: string;
  isEnrolled: boolean;
}

export function ReviewsList({ courseId, isEnrolled }: ReviewsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const { data: reviewsData, isLoading, refetch } = useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: () => reviewService.getReviews(courseId),
    enabled: !!courseId,
  });

  const myReview = reviewsData?.data.find(r => r.user.id === currentUser?.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#C5CAD3] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full pl-[52px]" />
          </div>
        ))}
      </div>
    );
  }

  const reviews = reviewsData?.data || [];
  const total = reviewsData?.total || 0;
  const avg = reviewsData?.average_rating || 0;

  return (
    <div className="space-y-8">
      {/* TOP SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-xl border border-[#C5CAD3] p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-[48px] font-bold text-[#0F172A] leading-tight">
              {avg ? avg.toFixed(1) : "0.0"}
            </span>
            <p className="text-[12px] text-[#464749] font-medium">Out of 5</p>
          </div>
          <div className="flex flex-col gap-1">
            <StarRating rating={avg} size="md" />
            <p className="text-[12px] text-[#464749]">Based on {total} reviews</p>
          </div>
        </div>

        {isEnrolled && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-[44px] px-6 border-2 border-[#1D4ED8] text-[#1D4ED8] font-bold rounded-lg hover:bg-[#1D4ED8]/5 transition-colors"
          >
            {myReview ? "Edit Your Review" : "Write a Review"}
          </button>
        )}
      </div>

      {/* REVIEWS LIST */}
      <div className="bg-white rounded-xl border border-[#C5CAD3] overflow-hidden shadow-sm">
        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#464749] text-[15px] mb-2 font-medium">No reviews yet.</p>
            <p className="text-[#464749]/60 text-[13px]">Be the first to share your experience with this course!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#C5CAD3]">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 transition-colors hover:bg-slate-50/50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white font-bold text-[14px] shadow-sm">
                      {review.user.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#0F172A]">
                        {review.user.full_name}
                        {review.user.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wider">You</span>
                        )}
                      </p>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                  </div>
                  <span className="text-[12px] text-[#464749]/60 font-medium">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-[14px] text-[#464749] leading-relaxed pl-[52px]">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={courseId}
        existingReview={myReview}
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
