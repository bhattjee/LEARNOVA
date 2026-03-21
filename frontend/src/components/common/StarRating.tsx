import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  max = 5,
  interactive = false,
  size = "md",
  onRatingChange,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-8 h-8",
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  const renderStar = (index: number) => {
    const starValue = index + 1;
    let fillAmount = 0;

    if (currentDisplayRating >= starValue) {
      fillAmount = 1;
    } else if (currentDisplayRating > index && currentDisplayRating < starValue) {
      fillAmount = 0.5;
    }

    const isInteractive = interactive && onRatingChange;

    return (
      <button
        key={index}
        type="button"
        disabled={!isInteractive}
        className={cn(
          "relative transition-transform",
          isInteractive && "hover:scale-110 cursor-pointer focus:outline-none"
        )}
        onMouseEnter={() => isInteractive && setHoverRating(starValue)}
        onMouseLeave={() => isInteractive && setHoverRating(null)}
        onClick={() => isInteractive && onRatingChange(starValue)}
      >
        <Star
          className={cn(starSizes[size], "text-[#C5CAD3] fill-transparent")}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${fillAmount * 100}%` }}
        >
          <Star className={cn(starSizes[size], "text-[#F5AA29] fill-[#F5AA29]")} />
        </div>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => renderStar(i))}
    </div>
  );
}
