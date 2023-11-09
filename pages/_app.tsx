import "tailwindcss/tailwind.css";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import type { AppProps } from "next/app";
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
import { createContext, useState } from "react";
import filtersContext, { Filters } from "../contexts/filtersContext";
import { Round } from "../api/types";
import roundsContext from "../contexts/roundsContext";
import Script from "next/script";

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
  projectId: "50c583e7b5be16cf960eb228758a796b",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

function MyApp({ Component, pageProps }: AppProps) {
  const [filters, setFilters] = useState<Filters>({
    chainId: undefined,
    roundId: undefined,
  });
  const [rounds, setRounds] = useState<Round[] | undefined>();
  const [roundsLoading, setRoundsLoading] = useState(true);

  const handleSetFilters = (filters: Filters) => {
    setFilters(filters);
  };
  return (
    <>
      {process.env.NODE_ENV === "production" && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=G-JSM7V1YTCB`}
          />

          <Script id="gtag" strategy="afterInteractive">
            {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-JSM7V1YTCB', {
                    page_path: window.location.pathname,
                    });
                `}
          </Script>
        </>
      )}
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <roundsContext.Provider
            value={{ rounds, setRounds, roundsLoading, setRoundsLoading }}
          >
            <filtersContext.Provider value={{ filters, setFilters }}>
                <Component {...pageProps} />
            </filtersContext.Provider>
          </roundsContext.Provider>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}

export default MyApp;
