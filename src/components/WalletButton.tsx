"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { targetChain } from "@/lib/wagmi";
import { useEffect } from "react";

type Props = {
  onProfileOpen?: () => void;
};

export function WalletButton({ onProfileOpen }: Props) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== targetChain.id) {
      switchChain({ chainId: targetChain.id });
    }
  }, [isConnected, chainId, switchChain]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        const wrongChain = connected && chain.id !== targetChain.id;

        if (!ready) return null;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className="text-xs font-mono uppercase tracking-widest border border-[var(--accent)] text-[var(--accent)] px-3 py-1 hover:bg-[var(--accent)] hover:text-black transition-colors"
            >
              [ CONNECT WALLET ]
            </button>
          );
        }

        if (wrongChain) {
          return (
            <button
              onClick={openChainModal}
              className="text-xs font-mono uppercase tracking-widest border border-[var(--danger)] text-[var(--danger)] px-3 py-1 hover:bg-[var(--danger)] hover:text-black transition-colors"
            >
              [ WRONG NETWORK ]
            </button>
          );
        }

        return (
          <button
            onClick={onProfileOpen}
            className="text-xs font-mono text-[var(--fg-dim)] hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
          >
            {account.address.slice(0, 6)}...{account.address.slice(-4)} [ PROFILE ]
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}