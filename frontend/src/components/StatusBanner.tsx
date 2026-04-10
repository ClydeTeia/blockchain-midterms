import type { TxState } from "../types/post";

interface StatusBannerProps {
  txState: TxState;
  onDismiss: () => void;
}

export function StatusBanner({ txState, onDismiss }: StatusBannerProps) {
  if (txState.status === "idle") {
    return null;
  }

  return (
    <section className={`status status-${txState.status}`}>
      <p>{txState.message}</p>
      <button className="button-secondary" onClick={onDismiss}>
        Clear
      </button>
    </section>
  );
}
