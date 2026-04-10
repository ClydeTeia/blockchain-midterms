import { useState } from "react";
import { formatEther } from "ethers";
import type { PostViewModel } from "../types/post";

interface PostFeedProps {
  canLike: boolean;
  isLiking: boolean;
  likeCostEth: string;
  onLikePost: (postId: bigint) => Promise<boolean>;
  posts: PostViewModel[];
  hasMorePosts: boolean;
  isLoadingMorePosts: boolean;
  onLoadMorePosts: () => Promise<void>;
}

function formatDate(ts: bigint): string {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleString();
}

function PostCard({
  canLike,
  isLiking,
  likeCostEth,
  onLikePost,
  post,
}: {
  canLike: boolean;
  isLiking: boolean;
  likeCostEth: string;
  onLikePost: (postId: bigint) => Promise<boolean>;
  post: PostViewModel;
}) {
  const [imageBroken, setImageBroken] = useState(false);

  const likeDisabled = !canLike || isLiking || post.hasLiked || post.isOwnPost;

  return (
    <article className="post-card">
      <div className="post-image-wrap">
        {!imageBroken ? (
          <img
            className="post-image"
            src={post.imageUrl}
            alt={post.caption}
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="broken-image">Image could not be loaded</div>
        )}
      </div>

      <div className="post-meta">
        <p className="caption">{post.caption}</p>
        <p className="meta-line mono">Creator: {post.creator}</p>
        <p className="meta-line">Posted: {formatDate(post.timestamp)}</p>
        <div className="stats-row">
          <span>Likes: {post.likes.toString()}</span>
          <span>Total Earned: {formatEther(post.totalEarned)} ETH</span>
        </div>
      </div>

      <button
        disabled={likeDisabled}
        className="like-button"
        onClick={() => void onLikePost(post.id)}
        title={post.isOwnPost ? "You cannot like your own post" : "Tip to like this post"}
      >
        {post.hasLiked ? "<3 Liked" : `<3 Tip ${likeCostEth} ETH`}
      </button>
    </article>
  );
}

export function PostFeed({
  canLike,
  isLiking,
  likeCostEth,
  onLikePost,
  posts,
  hasMorePosts,
  isLoadingMorePosts,
  onLoadMorePosts,
}: PostFeedProps) {
  if (posts.length === 0) {
    return (
      <section className="panel">
        <h2>Feed</h2>
        <p className="notice">No posts yet. Create the first one.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Feed</h2>
      <div className="feed-grid">
        {posts.map((post) => (
          <PostCard
            key={post.id.toString()}
            canLike={canLike}
            isLiking={isLiking}
            likeCostEth={likeCostEth}
            onLikePost={onLikePost}
            post={post}
          />
        ))}
      </div>
      {hasMorePosts && (
        <button
          className="button-secondary"
          disabled={isLoadingMorePosts}
          onClick={() => void onLoadMorePosts()}
        >
          {isLoadingMorePosts ? "Loading..." : "Load More Posts"}
        </button>
      )}
    </section>
  );
}
