export function shortenAddress(address: string): string {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(value: string, decimals = 4): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return parsed.toFixed(decimals);
}

export function formatDate(ts: bigint): string {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleString();
}

export function isVideoUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".m3u8"].some((ext) =>
    normalized.includes(ext),
  );
}
