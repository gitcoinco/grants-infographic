"use client";

import React, { createContext, useState } from "react";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import "react-quill/dist/quill.snow.css";
import {
  arbitrum,
  goerli,
  mainnet,
  optimism,
  polygon,
  zora,
} from "wagmi/chains";

import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

// filters
export type Filters = {
  chainId: string | undefined;
  roundId: string | undefined;
};

const filtersContext = createContext({
  filters: {
    chainId: undefined,
    roundId: undefined,
  } as Filters,
  setFilters: (filters: Filters) => {
    filters = filters;
  },
});

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    zora,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [goerli] : []),
  ],
  [
    // alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "RainbowKit App",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '',
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {

  const [filters, setFilters] = useState<Filters>({
    chainId: undefined,
    roundId: undefined,
  });

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {/* <roundsContext.Provider
        value={{ rounds, setRounds, roundsLoading, setRoundsLoading }}
      > */}
        <filtersContext.Provider value={{ filters, setFilters }}>
          {children}
        </filtersContext.Provider>
        {/* </roundsContext.Provider> */}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

