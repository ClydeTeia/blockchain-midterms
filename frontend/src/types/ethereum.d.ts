export type WalletRequestArgs = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

export interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: WalletRequestArgs) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
