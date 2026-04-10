import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { FeedViewport } from "./components/feed/FeedViewport";
import { TopNav } from "./components/feed/TopNav";
import { CreatePostModal } from "./components/ui/CreatePostModal";
import { Toaster } from "./components/ui/sonner";
import { useTipPost } from "./hooks/useTipPost";
import { useWallet } from "./hooks/useWallet";
import { CONTRACT_ADDRESS, configError } from "./lib/config";

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const lastWalletErrorRef = useRef("");

  const {
    account,
    chainId,
    connectWallet,
    hasMetaMask,
    isWrongNetwork,
    provider,
    signer,
    switchToSepolia,
    walletError,
  } = useWallet();

  const {
    clearStatus,
    createPost,
    earningsEth,
    hasMorePosts,
    isLoadingFeed,
    isLoadingMorePosts,
    likeCostEth,
    likePost,
    loadMorePosts,
    pendingWithdrawals,
    pendingWithdrawalsEth,
    posts,
    txState,
    withdraw,
  } = useTipPost(provider, signer, account);

  useEffect(() => {
    if (txState.status === "idle") {
      return;
    }

    if (txState.status === "loading") {
      toast.loading(txState.message, { id: "tx-status" });
      return;
    }

    if (txState.status === "success") {
      toast.success(txState.message, { id: "tx-status" });
      clearStatus();
      return;
    }

    toast.error(txState.message, { id: "tx-status" });
    clearStatus();
  }, [clearStatus, txState.message, txState.status]);

  useEffect(() => {
    if (!walletError || walletError === lastWalletErrorRef.current) {
      return;
    }

    lastWalletErrorRef.current = walletError;
    toast.error(walletError, { id: "wallet-error" });
  }, [walletError]);

  if (configError) {
    return (
      <main className="grid min-h-svh place-items-center px-4">
        <section className="w-full max-w-xl border border-border bg-card p-5">
          <h1 className="text-xl font-bold">Configuration Error</h1>
          <p className="mt-3 text-sm text-[#ff6b78]">{configError}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Add `VITE_CONTRACT_ADDRESS` and `VITE_CHAIN_ID` in `frontend/.env`.
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground break-all">
            Contract: {CONTRACT_ADDRESS || "(not set)"}
          </p>
        </section>
        <Toaster />
      </main>
    );
  }

  const walletReady = Boolean(account) && !isWrongNetwork;
  const isBusy = txState.status === "loading";

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black text-foreground">
      <TopNav
        account={account}
        chainId={chainId}
        connectWallet={connectWallet}
        hasMetaMask={hasMetaMask}
        isWrongNetwork={isWrongNetwork}
        switchToSepolia={switchToSepolia}
        earningsEth={earningsEth}
        pendingWithdrawalsEth={pendingWithdrawalsEth}
        canWithdraw={walletReady && pendingWithdrawals > 0n}
        isWithdrawing={isBusy}
        onWithdraw={withdraw}
      />

      {!hasMetaMask ? (
        <div className="absolute left-1/2 top-24 z-40 w-[min(92vw,520px)] -translate-x-1/2 rounded-md border border-border bg-black/75 px-4 py-2 text-center text-xs text-[#ff6b78] backdrop-blur-sm">
          Install MetaMask to use TipPost.
        </div>
      ) : null}

      <FeedViewport
        canLike={walletReady}
        isLiking={isBusy}
        isLoadingFeed={isLoadingFeed}
        likeCostEth={likeCostEth}
        onLikePost={likePost}
        hasMorePosts={hasMorePosts}
        isLoadingMorePosts={isLoadingMorePosts}
        onLoadMorePosts={loadMorePosts}
        posts={posts}
      />

      <div className="pointer-events-none absolute bottom-0 z-40 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-6 pt-12">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="pointer-events-auto flex h-[52px] w-[64px] items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,212,170,0.3)] transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-7 w-7 stroke-[3]" />
            <span className="sr-only">Create post</span>
          </button>
        </div>
      </div>

      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        disabled={!walletReady}
        isSubmitting={isBusy}
        onCreatePost={createPost}
      />
      <Toaster />
    </main>
  );
}

export default App;
