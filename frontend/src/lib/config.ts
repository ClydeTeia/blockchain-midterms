export const REQUIRED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? "11155111");
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "").trim();

export const configError = (() => {
  if (!CONTRACT_ADDRESS) {
    return "Missing VITE_CONTRACT_ADDRESS in frontend .env";
  }

  if (!Number.isInteger(REQUIRED_CHAIN_ID) || REQUIRED_CHAIN_ID <= 0) {
    return "VITE_CHAIN_ID must be a valid positive integer";
  }

  return "";
})();

export const REQUIRED_CHAIN_HEX = `0x${REQUIRED_CHAIN_ID.toString(16)}`;
