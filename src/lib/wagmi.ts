import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

const isDev = process.env.NEXT_PUBLIC_CHAIN_ID === "84532";
export const targetChain = isDev ? baseSepolia : base;

export const wagmiConfig = getDefaultConfig({
  appName: "Sentix",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: [base, baseSepolia],
  ssr: true,
});
