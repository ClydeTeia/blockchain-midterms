import { formatEth, shortenAddress } from "../../lib/format";
import { Button } from "../ui/button";

interface TopNavProps {
  account: string;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  hasMetaMask: boolean;
  isWrongNetwork: boolean;
  switchToSepolia: () => Promise<void>;
  earningsEth: string;
  pendingWithdrawalsEth: string;
  canWithdraw: boolean;
  isWithdrawing: boolean;
  onWithdraw: () => Promise<boolean>;
}

export function TopNav({
  account,
  canWithdraw,
  chainId,
  connectWallet,
  earningsEth,
  hasMetaMask,
  isWithdrawing,
  isWrongNetwork,
  onWithdraw,
  pendingWithdrawalsEth,
  switchToSepolia,
}: TopNavProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 flex h-20 items-start justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 sm:px-6">
      <div className="drop-shadow-md">
        <p className="text-lg font-extrabold tracking-tight text-white">TipPost</p>
        <p className="text-[11px] font-medium text-white/80">Sepolia Feed</p>
      </div>

      <div className="flex items-center gap-2">
        {account ? (
          <div className="hidden rounded-md bg-black/40 px-2.5 py-1 text-right text-[11px] text-white/90 backdrop-blur-sm sm:block">
            <p className="font-mono text-xs">{shortenAddress(account)}</p>
            <p className="text-white/70">
              Earned {formatEth(earningsEth)} ETH | Escrow {formatEth(pendingWithdrawalsEth)} ETH
            </p>
          </div>
        ) : null}

        {isWrongNetwork ? (
          <Button size="sm" variant="secondary" onClick={() => void switchToSepolia()}>
            Switch ({chainId ?? "?"})
          </Button>
        ) : null}

        {account ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void onWithdraw()}
            disabled={!canWithdraw || isWithdrawing}
          >
            {isWithdrawing ? "Withdrawing..." : "Withdraw"}
          </Button>
        ) : (
          <Button size="sm" onClick={() => void connectWallet()} disabled={!hasMetaMask}>
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  );
}
