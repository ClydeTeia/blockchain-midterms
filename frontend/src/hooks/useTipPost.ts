import { type BrowserProvider, Contract, type InterfaceAbi, type JsonRpcSigner } from "ethers";
import { formatEther } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import tipPostAbi from "../abi/TipPost.json";
import { CONTRACT_ADDRESS } from "../lib/config";
import type { PostViewModel, TxState } from "../types/post";

type RawPost = {
  id: bigint;
  creator: string;
  imageUrl: string;
  caption: string;
  metadataURI: string;
  likes: bigint;
  totalEarned: bigint;
  timestamp: bigint;
};

const PAGE_SIZE = 10;
const initialTxState: TxState = { status: "idle", message: "" };

function normalizeRawPost(post: unknown): RawPost {
  const row = post as {
    id?: bigint;
    creator?: string;
    imageUrl?: string;
    caption?: string;
    metadataURI?: string;
    likes?: bigint;
    totalEarned?: bigint;
    timestamp?: bigint;
    [key: number]: unknown;
  };

  // Old contract shape (no metadataURI):
  // [id, creator, imageUrl, caption, likes, totalEarned, timestamp]
  // New contract shape:
  // [id, creator, imageUrl, caption, metadataURI, likes, totalEarned, timestamp]
  const isOldShape = typeof row[4] === "bigint";

  return {
    id: (row.id ?? row[0]) as bigint,
    creator: (row.creator ?? row[1]) as string,
    imageUrl: (row.imageUrl ?? row[2]) as string,
    caption: (row.caption ?? row[3]) as string,
    metadataURI: (row.metadataURI ?? (isOldShape ? "" : row[4]) ?? "") as string,
    likes: (row.likes ?? (isOldShape ? row[4] : row[5])) as bigint,
    totalEarned: (row.totalEarned ?? (isOldShape ? row[5] : row[6])) as bigint,
    timestamp: (row.timestamp ?? (isOldShape ? row[6] : row[7])) as bigint,
  };
}

function isValidPostShape(post: RawPost): boolean {
  return (
    typeof post.id === "bigint" &&
    typeof post.creator === "string" &&
    typeof post.imageUrl === "string" &&
    typeof post.caption === "string" &&
    typeof post.metadataURI === "string" &&
    typeof post.likes === "bigint" &&
    typeof post.totalEarned === "bigint" &&
    typeof post.timestamp === "bigint"
  );
}

function parseContractError(error: unknown): string {
  const asError = error as {
    code?: number;
    shortMessage?: string;
    message?: string;
  };

  if (asError.code === 4001) {
    return "Transaction cancelled in MetaMask.";
  }

  const raw = `${asError.shortMessage ?? ""} ${asError.message ?? ""}`;

  if (raw.includes("AlreadyLiked")) return "You already liked this post.";
  if (raw.includes("CannotLikeOwnPost")) return "You cannot like your own post.";
  if (raw.includes("IncorrectTipAmount")) return "Tip must be exactly 0.0001 ETH.";
  if (raw.includes("PostNotFound")) return "That post does not exist.";
  if (raw.includes("NoPendingWithdrawal")) return "You have no escrowed tips to withdraw.";
  if (raw.includes("WithdrawalTransferFailed")) return "Withdrawal transfer failed. Try again.";
  if (raw.includes("EmptyImageUrl")) return "Image URL cannot be empty.";
  if (raw.includes("EmptyCaption")) return "Caption cannot be empty.";
  return asError.shortMessage ?? asError.message ?? "Transaction failed.";
}

function hasEvent(contract: Contract, eventName: string): boolean {
  try {
    contract.interface.getEvent(eventName);
    return true;
  } catch {
    return false;
  }
}

export function useTipPost(
  provider: BrowserProvider | null,
  signer: JsonRpcSigner | null,
  account: string,
) {
  const [posts, setPosts] = useState<PostViewModel[]>([]);
  const [likeCost, setLikeCost] = useState<bigint>(0n);
  const [earnings, setEarnings] = useState<bigint>(0n);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<bigint>(0n);
  const [allPosts, setAllPosts] = useState<PostViewModel[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [txState, setTxState] = useState<TxState>(initialTxState);

  const readContract = useMemo(() => {
    if (!provider || !CONTRACT_ADDRESS) {
      return null;
    }

    return new Contract(CONTRACT_ADDRESS, tipPostAbi as InterfaceAbi, provider);
  }, [provider]);

  const writeContract = useMemo(() => {
    if (!signer || !CONTRACT_ADDRESS) {
      return null;
    }

    return new Contract(CONTRACT_ADDRESS, tipPostAbi as InterfaceAbi, signer);
  }, [signer]);

  const refreshFeed = useCallback(async () => {
    if (!readContract) {
      setPosts([]);
      setAllPosts([]);
      setVisibleCount(PAGE_SIZE);
      setHasMorePosts(false);
      return;
    }

    setIsLoadingFeed(true);
    try {
      const chainPosts = (await readContract.getAllPosts()) as unknown[];

      const normalizedPosts = await Promise.all(
        chainPosts.map(async (entry) => {
          const post = normalizeRawPost(entry);
          if (!isValidPostShape(post)) {
            return null;
          }

          const hasLiked = account
            ? ((await readContract.checkLiked(post.id, account)) as boolean)
            : false;

          return {
            ...post,
            hasLiked,
            isOwnPost: account
              ? post.creator.toLowerCase() === account.toLowerCase()
              : false,
          } satisfies PostViewModel;
        }),
      );

      const safePosts = normalizedPosts
        .filter((post): post is PostViewModel => post !== null)
        .sort((a, b) => Number(b.id - a.id));

      const initialVisible = Math.min(PAGE_SIZE, safePosts.length);
      setAllPosts(safePosts);
      setVisibleCount(initialVisible);
      setPosts(safePosts.slice(0, initialVisible));
      setHasMorePosts(initialVisible < safePosts.length);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [account, readContract]);

  const loadMorePosts = useCallback(async () => {
    if (!hasMorePosts) {
      return;
    }

    setIsLoadingMorePosts(true);
    try {
      const nextVisibleCount = Math.min(visibleCount + PAGE_SIZE, allPosts.length);
      setVisibleCount(nextVisibleCount);
      setPosts(allPosts.slice(0, nextVisibleCount));
      setHasMorePosts(nextVisibleCount < allPosts.length);
    } finally {
      setIsLoadingMorePosts(false);
    }
  }, [allPosts, hasMorePosts, visibleCount]);

  const refreshEarnings = useCallback(async () => {
    if (!readContract || !account) {
      setEarnings(0n);
      return;
    }

    const totalEarned = (await readContract.totalEarnedByUser(account)) as bigint;
    setEarnings(totalEarned);
  }, [account, readContract]);

  const refreshLikeCost = useCallback(async () => {
    if (!readContract) {
      setLikeCost(0n);
      return;
    }

    const chainLikeCost = (await readContract.likeCost()) as bigint;
    setLikeCost(chainLikeCost);
  }, [readContract]);

  const refreshPendingWithdrawals = useCallback(async () => {
    if (!readContract || !account) {
      setPendingWithdrawals(0n);
      return;
    }

    const pending = (await readContract.pendingWithdrawals(account)) as bigint;
    setPendingWithdrawals(pending);
  }, [account, readContract]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshLikeCost(),
      refreshFeed(),
      refreshEarnings(),
      refreshPendingWithdrawals(),
    ]);
  }, [refreshEarnings, refreshFeed, refreshLikeCost, refreshPendingWithdrawals]);

  const createPost = useCallback(
    async (imageUrl: string, caption: string) => {
      if (!writeContract) {
        setTxState({ status: "error", message: "Connect wallet before creating a post." });
        return false;
      }

      try {
        setTxState({ status: "loading", message: "Creating post transaction..." });
        const tx = await writeContract.createPost(imageUrl, caption);
        await tx.wait();
        setTxState({ status: "success", message: "Post created successfully." });
        await refreshAll();
        return true;
      } catch (error) {
        setTxState({ status: "error", message: parseContractError(error) });
        return false;
      }
    },
    [refreshAll, writeContract],
  );

  const likePost = useCallback(
    async (postId: bigint) => {
      if (!writeContract) {
        setTxState({ status: "error", message: "Connect wallet before liking a post." });
        return false;
      }

      try {
        const chainLikeCost = likeCost > 0n ? likeCost : ((await writeContract.likeCost()) as bigint);
        if (chainLikeCost <= 0n) {
          setTxState({ status: "error", message: "Could not load like cost from contract." });
          return false;
        }

        setTxState({ status: "loading", message: "Sending tip transaction..." });
        const tx = await writeContract.likePost(postId, {
          value: chainLikeCost,
        });
        await tx.wait();
        setTxState({
          status: "success",
          message: "Like recorded. Tip was sent directly or escrowed if direct payout failed.",
        });
        await refreshAll();
        return true;
      } catch (error) {
        setTxState({ status: "error", message: parseContractError(error) });
        return false;
      }
    },
    [likeCost, refreshAll, writeContract],
  );

  const withdraw = useCallback(async () => {
    if (!writeContract) {
      setTxState({ status: "error", message: "Connect wallet before withdrawing." });
      return false;
    }

    try {
      setTxState({ status: "loading", message: "Withdrawing escrowed tips..." });
      const tx = await writeContract.withdraw();
      await tx.wait();
      setTxState({ status: "success", message: "Escrowed tips withdrawn successfully." });
      await refreshAll();
      return true;
    } catch (error) {
      setTxState({ status: "error", message: parseContractError(error) });
      return false;
    }
  }, [refreshAll, writeContract]);

  const clearStatus = useCallback(() => {
    setTxState(initialTxState);
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setTxState(initialTxState);
  }, [account, readContract]);

  useEffect(() => {
    if (!readContract) {
      return;
    }

    const handleUpdate = () => {
      void refreshAll();
    };

    const candidateEvents = ["PostCreated", "PostLiked", "TipEscrowed", "Withdrawal"];
    const trackedEvents: string[] = [];

    void (async () => {
      for (const eventName of candidateEvents) {
        if (!hasEvent(readContract, eventName)) {
          continue;
        }
        try {
          await readContract.on(eventName, handleUpdate);
          trackedEvents.push(eventName);
        } catch {
          // Ignore event subscriptions that are not supported by the active ABI.
        }
      }
    })();

    return () => {
      for (const eventName of trackedEvents) {
        void Promise.resolve(readContract.off(eventName, handleUpdate)).catch(() => {
          // Ignore cleanup errors for unsupported events.
        });
      }
    };
  }, [readContract, refreshAll]);

  return {
    clearStatus,
    createPost,
    earnings,
    earningsEth: formatEther(earnings),
    hasMorePosts,
    isLoadingFeed,
    isLoadingMorePosts,
    likeCost,
    likeCostEth: formatEther(likeCost),
    likePost,
    loadMorePosts,
    pendingWithdrawals,
    pendingWithdrawalsEth: formatEther(pendingWithdrawals),
    posts,
    txState,
    withdraw,
  };
}
