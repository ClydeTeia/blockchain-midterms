interface WalletPanelProps {
  account: string;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  hasMetaMask: boolean;
  isWrongNetwork: boolean;
  switchToSepolia: () => Promise<void>;
  walletError: string;
  earningsEth: string;
  pendingWithdrawalsEth: string;
  canWithdraw: boolean;
  isWithdrawing: boolean;
  onWithdraw: () => Promise<boolean>;
}

function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEth(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toFixed(6);
}

export function WalletPanel({
  account,
  chainId,
  connectWallet,
  hasMetaMask,
  isWrongNetwork,
  switchToSepolia,
  walletError,
  earningsEth,
  pendingWithdrawalsEth,
  canWithdraw,
  isWithdrawing,
  onWithdraw,
}: WalletPanelProps) {
  return (
    <section className="panel wallet-panel">
      <div className="panel-row">
        <span className="label">Wallet</span>
        {account ? (
          <span className="value mono">{shortenAddress(account)}</span>
        ) : (
          <button onClick={() => void connectWallet()} disabled={!hasMetaMask}>
            Connect Wallet
          </button>
        )}
      </div>

      <div className="panel-row">
        <span className="label">Network</span>
        <span className={`value ${isWrongNetwork ? "danger" : "ok"}`}>
          {chainId === null ? "Unknown" : isWrongNetwork ? `Wrong (${chainId})` : "Sepolia"}
        </span>
      </div>

      <div className="panel-row">
        <span className="label">Your Earnings</span>
        <span className="value mono">{formatEth(earningsEth)} ETH</span>
      </div>

      <div className="panel-row">
        <span className="label">Escrowed Tips</span>
        <span className="value mono">{formatEth(pendingWithdrawalsEth)} ETH</span>
      </div>

      {isWrongNetwork && (
        <button className="button-secondary" onClick={() => void switchToSepolia()}>
          Switch To Sepolia
        </button>
      )}

      {account && (
        <button
          className="button-secondary"
          onClick={() => void onWithdraw()}
          disabled={!canWithdraw || isWithdrawing}
        >
          {isWithdrawing ? "Processing..." : "Withdraw Escrowed Tips"}
        </button>
      )}

      {!hasMetaMask && <p className="notice danger">Install MetaMask to use this dApp.</p>}
      {walletError && <p className="notice danger">{walletError}</p>}
    </section>
  );
}
