import { useQuery } from "@tanstack/react-query";
import { StarRating } from "@/components/common/StarRating";
import * as reviewService from "@/services/reviewService";
import { useState } from "react";
import { AddReviewModal } from "./AddReviewModal";
import { useAuthStore } from "@/stores/authStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface ReviewsListProps {
  courseId: string;
  isEnrolled: boolean;
  /** Matches dark course detail page styling. */
  variant?: "light" | "dark";
}

export function ReviewsList({ courseId, isEnrolled, variant = "light" }: ReviewsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const { data: reviewsData, isLoading, refetch } = useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: () => reviewService.getReviews(courseId),
    enabled: !!courseId,
  });

  const myReview = reviewsData?.data.find((r) => r.user.id === currentUser?.id);
  const isDark = variant === "dark";

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border p-6 shadow-sm",
              isDark ? "border-zinc-700 bg-[#1a1a1a]" : "border-[#C5CAD3] bg-white",
            )}
          >
            <div className="mb-3 flex items-center gap-3">
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
      <div
        className={cn(
          "flex flex-col gap-6 rounded-xl border p-8 shadow-sm md:flex-row md:items-center md:justify-between",
          isDark ? "border-zinc-700 bg-[#1a1a1a]" : "border-[#C5CAD3] bg-white",
        )}
      >
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span
              className={cn(
                "text-[48px] font-bold leading-tight",
                isDark ? "text-white" : "text-[#0F172A]",
              )}
            >
              {avg ? avg.toFixed(1) : "0.0"}
            </span>
            <p
              className={cn(
                "text-[12px] font-medium",
                isDark ? "text-zinc-400" : "text-[#464749]",
              )}
            >
              Out of 5
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <StarRating rating={avg} size="md" />
            <p className={cn("text-[12px]", isDark ? "text-zinc-400" : "text-[#464749]")}>
              Based on {total} reviews
            </p>
          </div>
        </div>

        {isEnrolled && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "h-[44px] rounded-lg border-2 px-6 font-bold transition-colors",
              isDark
                ? "border-[#9333EA] text-[#D8B4FE] hover:bg-[#9333EA]/10"
                : "border-[#1D4ED8] text-[#1D4ED8] hover:bg-[#1D4ED8]/5",
            )}
          >
            {myReview ? "Edit Your Review" : "Write a Review"}
          </button>
        )}
      </div>

      {/* REVIEWS LIST */}
      <div
        className={cn(
          "overflow-hidden rounded-xl border shadow-sm",
          isDark ? "border-zinc-700 bg-[#1a1a1a]" : "border-[#C5CAD3] bg-white",
        )}
      >
        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <p
              className={cn(
                "mb-2 text-[15px] font-medium",
                isDark ? "text-zinc-200" : "text-[#464749]",
              )}
            >
              No reviews yet.
            </p>
            <p className={cn("text-[13px]", isDark ? "text-zinc-500" : "text-[#464749]/60")}>
              Be the first to share your experience with this course!
            </p>
          </div>
        ) : (
          <div className={cn("divide-y", isDark ? "divide-zinc-700" : "divide-[#C5CAD3]")}>
            {reviews.map((review) => (
              <div
                key={review.id}
                className={cn(
                  "p-6 transition-colors",
                  isDark ? "hover:bg-zinc-800/50" : "hover:bg-slate-50/50",
                )}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D4ED8] text-[14px] font-bold text-white shadow-sm">
                      {review.user.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-[14px] font-bold",
                          isDark ? "text-zinc-100" : "text-[#0F172A]",
                        )}
                      >
                        {review.user.full_name}
                        {review.user.id === currentUser?.id && (
                          <span
                            className={cn(
                              "ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                              isDark ? "bg-zinc-700 text-zinc-400" : "bg-slate-100 text-slate-500",
                            )}
                          >
                            You
                          </span>
                        )}
                      </p>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[12px] font-medium",
                      isDark ? "text-zinc-500" : "text-[#464749]/60",
                    )}
                  >
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p
                    className={cn(
                      "pl-[52px] text-[14px] leading-relaxed",
                      isDark ? "text-zinc-300" : "text-[#464749]",
                    )}
                  >
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
