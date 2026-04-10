import { type JsonRpcSigner, BrowserProvider } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { REQUIRED_CHAIN_HEX, REQUIRED_CHAIN_ID } from "../lib/config";
import type { EthereumProvider } from "../types/ethereum";

const SEPOLIA_PARAMS = {
  chainId: REQUIRED_CHAIN_HEX,
  chainName: "Sepolia",
  nativeCurrency: {
    name: "SepoliaETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

function getEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.ethereum;
}

export function useWallet() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [walletError, setWalletError] = useState("");

  const hasMetaMask = useMemo(() => Boolean(getEthereum()), []);

  const syncWalletState = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      return;
    }

    const nextProvider = new BrowserProvider(ethereum);
    setProvider(nextProvider);

    const [chainHex, walletAccounts] = await Promise.all([
      ethereum.request({ method: "eth_chainId" }) as Promise<string>,
      ethereum.request({ method: "eth_accounts" }) as Promise<string[]>,
    ]);

    setChainId(Number.parseInt(chainHex, 16));

    const nextAccount = walletAccounts[0] ?? "";
    setAccount(nextAccount);

    if (nextAccount) {
      setSigner(await nextProvider.getSigner(nextAccount));
    } else {
      setSigner(null);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setWalletError("MetaMask not detected. Install MetaMask to continue.");
      return;
    }

    try {
      setWalletError("");
      await ethereum.request({ method: "eth_requestAccounts" });
      await syncWalletState();
    } catch (error) {
      const asError = error as { code?: number; message?: string };
      if (asError.code === 4001) {
        setWalletError("Wallet connection was rejected.");
      } else {
        setWalletError(asError.message ?? "Could not connect wallet.");
      }
    }
  }, [syncWalletState]);

  const switchToSepolia = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setWalletError("MetaMask not detected.");
      return;
    }

    try {
      setWalletError("");
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: REQUIRED_CHAIN_HEX }],
      });
      await syncWalletState();
    } catch (error) {
      const asError = error as { code?: number; message?: string };
      if (asError.code === 4902) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [SEPOLIA_PARAMS],
        });
        await syncWalletState();
        return;
      }

      if (asError.code === 4001) {
        setWalletError("Network switch was cancelled.");
      } else {
        setWalletError(asError.message ?? "Could not switch to Sepolia.");
      }
    }
  }, [syncWalletState]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void syncWalletState();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [syncWalletState]);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) {
      return;
    }

    const handleAccountsChanged = () => {
      void syncWalletState();
    };

    const handleChainChanged = () => {
      void syncWalletState();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [syncWalletState]);

  return {
    account,
    chainId,
    connectWallet,
    hasMetaMask,
    isWrongNetwork: chainId !== null && chainId !== REQUIRED_CHAIN_ID,
    provider,
    signer,
    switchToSepolia,
    walletError,
  };
}
