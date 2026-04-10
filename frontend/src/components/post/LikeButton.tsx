import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

interface LikeButtonProps {
  isDisabled: boolean;
  isLiked: boolean;
  isLoading: boolean;
  likeCostEth: string;
  onClick: () => Promise<void>;
}

export function LikeButton({ isDisabled, isLiked, isLoading, likeCostEth, onClick }: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    if (isDisabled || isLoading) {
      return;
    }

    setIsAnimating(true);
    window.setTimeout(() => setIsAnimating(false), 220);
    await onClick();
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isDisabled || isLoading}
      className={cn(
        "flex h-14 w-14 items-center justify-center bg-transparent transition",
        isAnimating && "animate-pop",
        (isDisabled || isLoading) && "opacity-60",
      )}
      title={isLiked ? "Liked" : `Like with ${likeCostEth} ETH`}
    >
      <Heart
        className={cn(
          "h-8 w-8 transition-colors drop-shadow-[0_0_2px_rgba(0,0,0,0.95)]",
          isLiked
            ? "fill-current text-[#ff2d55]"
            : "text-white mix-blend-difference",
        )}
      />
      <span className="sr-only">Like post</span>
    </button>
  );
}
