import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { StarRating } from "@/components/common/StarRating";
import * as reviewService from "@/services/reviewService";
import type { ReviewItem } from "@/types/review.types";

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  existingReview?: ReviewItem;
  onSuccess: () => void;
}

export function AddReviewModal({
  isOpen,
  onClose,
  courseId,
  existingReview,
  onSuccess,
}: AddReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
    setError("");
  }, [existingReview, isOpen]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) {
        setError("Please select a rating");
        throw new Error("Missing rating");
      }
      const payload = { rating, comment: comment.trim() || undefined };
      if (existingReview) {
        return reviewService.updateReview(courseId, existingReview.id, payload);
      }
      return reviewService.createReview(courseId, payload);
    },
    onSuccess: () => {
      toast.success(existingReview ? "Review updated!" : "Review submitted!");
      queryClient.invalidateQueries({ queryKey: ["course-reviews", courseId] });
      onSuccess();
    },
    onError: (err: any) => {
      if (err.message !== "Missing rating") {
        toast.error(err.response?.data?.detail || "Failed to save review");
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{existingReview ? "Edit Your Review" : "Rate this Course"}</DialogTitle>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <StarRating
              rating={rating}
              interactive
              size="lg"
              onRatingChange={(r) => {
                setRating(r);
                setError("");
              }}
            />
            {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
          </div>

          <div className="w-full space-y-2">
            <label htmlFor="comment" className="text-[14px] font-semibold text-[#0F172A]">
              Share your experience (optional)
            </label>
            <textarea
              id="comment"
              rows={4}
              placeholder="What did you think of this course?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              className="w-full p-3 rounded-lg border border-[#C5CAD3] text-[14px] outline-none focus:border-[#1D4ED8] transition-colors resize-none"
            />
            <div className="flex justify-end">
              <span className="text-[11px] text-[#464749]/60">
                {comment.length} / 2000 characters
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="h-[44px] px-6 text-[#464749] font-bold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="h-[44px] px-8 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#C5CAD3] text-white font-bold rounded-lg transition-all shadow-md shadow-[#1D4ED8]/20"
          >
            {mutation.isPending ? "Saving..." : (existingReview ? "Update Review" : "Submit Review")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
