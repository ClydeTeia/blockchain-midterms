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

  if (parsed === 0) {
    return "0";
  }

  const abs = Math.abs(parsed);
  const requiredDecimals =
    abs < 1 ? Math.min(8, Math.max(decimals, Math.ceil(-Math.log10(abs)) + 1)) : decimals;

  const fixed = parsed.toFixed(requiredDecimals);
  return fixed.replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1");
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
