import { useEffect, useMemo, useRef } from "react";
import type { PostViewModel } from "../../types/post";
import { PostCard } from "../post/PostCard";

interface FeedViewportProps {
  canLike: boolean;
  isLiking: boolean;
  isLoadingFeed: boolean;
  likeCostEth: string;
  onLikePost: (postId: bigint) => Promise<boolean>;
  posts: PostViewModel[];
  hasMorePosts: boolean;
  isLoadingMorePosts: boolean;
  onLoadMorePosts: () => Promise<void>;
}

export function FeedViewport({
  canLike,
  hasMorePosts,
  isLiking,
  isLoadingFeed,
  isLoadingMorePosts,
  likeCostEth,
  onLikePost,
  onLoadMorePosts,
  posts,
}: FeedViewportProps) {
  const viewportRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const wheelLockRef = useRef(false);

  const shouldObserve = useMemo(
    () => posts.length > 0 && hasMorePosts && !isLoadingMorePosts,
    [posts.length, hasMorePosts, isLoadingMorePosts],
  );

  useEffect(() => {
    if (!shouldObserve || !sentinelRef.current) {
      return;
    }

    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void onLoadMorePosts();
          }
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMorePosts, shouldObserve]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      // Keep natural behavior on touch devices; tune wheel/trackpad on desktop.
      if (Math.abs(event.deltaY) < 8 || wheelLockRef.current) {
        return;
      }

      event.preventDefault();

      const pageHeight = viewport.clientHeight || 1;
      const currentIndex = Math.round(viewport.scrollTop / pageHeight);
      const direction = event.deltaY > 0 ? 1 : -1;
      const maxIndex = Math.max(0, posts.length - 1);
      const targetIndex = Math.min(maxIndex, Math.max(0, currentIndex + direction));

      if (targetIndex === currentIndex) {
        return;
      }

      wheelLockRef.current = true;
      viewport.scrollTo({
        top: targetIndex * pageHeight,
        behavior: "smooth",
      });

      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 380);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", onWheel);
    };
  }, [posts.length]);

  if (isLoadingFeed) {
    return (
      <section className="grid h-[100dvh] w-full place-items-center bg-black text-sm text-muted-foreground">
        Loading posts...
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="grid h-[100dvh] w-full place-items-center bg-black px-6 text-center">
        <div>
          <p className="text-lg font-semibold">No posts yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Create the first TipPost from the + button.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={viewportRef}
      className="relative h-[100dvh] w-full snap-y snap-mandatory overflow-x-hidden overflow-y-auto bg-black no-scrollbar overscroll-y-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {posts.map((post) => (
        <div key={post.id.toString()} className="h-[100dvh] w-full snap-start snap-always">
          <div className="mx-auto h-full w-full max-w-[560px]">
            <PostCard
              canLike={canLike}
              isLiking={isLiking}
              likeCostEth={likeCostEth}
              onLikePost={onLikePost}
              post={post}
            />
          </div>
        </div>
      ))}
      <div ref={sentinelRef} className="h-1 snap-end" />
      {isLoadingMorePosts && (
        <div className="pointer-events-none sticky bottom-24 left-1/2 z-30 w-fit -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs text-white backdrop-blur-md">
          Loading more...
        </div>
      )}
    </section>
  );
}
