import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, metaMask, injected } from "wagmi/connectors";

const isDev = process.env.NEXT_PUBLIC_CHAIN_ID === "84532";

export const targetChain = isDev ? baseSepolia : base;

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: "Sentix",
      preference: "smartWalletOnly",
    }),
    metaMask(),
    injected(),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});