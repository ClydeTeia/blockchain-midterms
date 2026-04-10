import { formatEther } from "ethers";
import { useMemo, useState } from "react";
import { formatDate, isVideoUrl, shortenAddress } from "../../lib/format";
import type { PostViewModel } from "../../types/post";
import { LikeButton } from "./LikeButton";

interface PostCardProps {
  canLike: boolean;
  isLiking: boolean;
  likeCostEth: string;
  onLikePost: (postId: bigint) => Promise<boolean>;
  post: PostViewModel;
}

export function PostCard({ canLike, isLiking, likeCostEth, onLikePost, post }: PostCardProps) {
  const [mediaBroken, setMediaBroken] = useState(false);
  const asVideo = useMemo(() => isVideoUrl(post.imageUrl), [post.imageUrl]);

  const likeDisabled = !canLike || isLiking || post.hasLiked || post.isOwnPost;

  return (
    <article className="relative h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {!mediaBroken ? (
          asVideo ? (
            <video
              src={post.imageUrl}
              className="h-auto w-auto max-h-full max-w-full object-contain object-center"
              autoPlay
              loop
              muted
              playsInline
              onError={() => setMediaBroken(true)}
            />
          ) : (
            <img
              src={post.imageUrl}
              alt={post.caption}
              className="h-auto w-auto max-h-full max-w-full object-contain object-center"
              onError={() => setMediaBroken(true)}
            />
          )
        ) : (
          <div className="grid h-full w-full place-items-center bg-[#111] text-sm text-muted-foreground">
            Media failed to load
          </div>
        )}
      </div>

      {!mediaBroken ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      )}

      <div className="absolute bottom-24 left-4 z-20 w-[70%] max-w-[400px] text-white">
        <p className="mb-1 text-[15px] font-bold drop-shadow-md">@{shortenAddress(post.creator)}</p>
        <p className="text-[14px] leading-snug text-white/95 drop-shadow-md">{post.caption}</p>
        <p className="mt-2 text-[11px] font-medium text-white/60 drop-shadow-md">{formatDate(post.timestamp)}</p>
      </div>

      <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center gap-1 text-white">
        <LikeButton
          isDisabled={likeDisabled}
          isLiked={post.hasLiked}
          isLoading={isLiking}
          likeCostEth={likeCostEth}
          onClick={async () => {
            await onLikePost(post.id);
          }}
        />
        <span className="text-[13px] font-bold drop-shadow-md">
          {Number(formatEther(post.totalEarned)).toFixed(3)} ETH
        </span>
      </div>
    </article>
  );
}
