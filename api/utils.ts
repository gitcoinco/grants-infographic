import { useSearchParams } from "react-router-dom";
import {
  IPFSObject,
  MatchingStatsData,
  PayoutToken,
  Program,
  ProjectApplication,
  RedstoneTokenIds,
  Round,
  RoundInfo,
} from "./types";
import { BigNumber, ethers } from "ethers";
import { getAddress } from "viem";
const pinataSDK = require("@pinata/sdk");
const pinata = new pinataSDK({
  pinataJWTKey: process.env.NEXT_PUBLIC_PINATA_JWT,
});

export const defaultTweetURL =
  "https://twitter.com/umarkhaneth/status/1718319104178753678";
  
export const twitterRegex: RegExp =
  /^https?:\/\/(www.|m.|mobile.)?twitter|x\.com\/(?:#!\/)?\w+\/status?\/\d+/;

export const sortByMatchAmount = (
  arr: (ProjectApplication & { matchingData?: MatchingStatsData })[] | undefined
) => {
  if (!arr?.length || !arr[0]?.matchingData?.matchAmount) return arr;
  return arr.sort(function (a, b) {
    return (
      (b.matchingData?.matchAmount || 0) - (a.matchingData?.matchAmount || 0)
    );
  });
};

export const sortByx = <T extends { amountUSD: number }[]>(arr: T) => {
  if (!arr.length || !arr[0]?.amountUSD) return arr;
  return arr.sort(function (a, b) {
    return b.amountUSD - a.amountUSD;
  });
};

export const formatAmount = (amount: string | number, noDigits?: boolean) => {
  return Number(amount).toLocaleString("en-US", {
    maximumFractionDigits: noDigits ? 0 : 2,
    minimumFractionDigits: noDigits ? 0 : 2,
  });
};

// export const calculateMatch = (projects: ProjectApplication[], match: number) => {

//   let sum = 0;
//   const newProjects = [...projects];
//   if (!projects?.length) return;
//   for (let i = 0; i < newProjects.length; i++) {
//     let sumAmount = 0;

//     for (let j = 0; j < newProjects[i].votesArray.length; j++) {
//       sumAmount += Math.sqrt(newProjects[i].votesArray[j].amountUSD);
//     }

//     sumAmount *= sumAmount;
//     newProjects[i].match = sumAmount;
//     sum += sumAmount;

//   }

//   let divisor = match / sum;
//   for (let i = 0; i < newProjects.length; i++) {
//     newProjects[i].match *= divisor;
//   }

//   return {newProjects, sum}
// };

export function useDebugMode(): boolean {
  const [searchParams] = useSearchParams();

  return (
    (process.env.NEXT_PUBLIC_ALLOW_URL_DEBUG_MODE === "true" &&
      searchParams.get("debug") === "true") ||
    process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
  );
}

export const isTestnet = (chainId: number) => {
  const testnetIds = [
    ChainId.FANTOM_TESTNET_CHAIN_ID,
    ChainId.PGN_TESTNET,
    ChainId.ARBITRUM_GOERLI,
    ChainId.GOERLI_CHAIN_ID,
    ChainId.FUJI,
    ChainId.POLYGON_MUMBAI,
  ];

  return testnetIds.includes(chainId);
};

export enum ChainId {
  //
  MAINNET = 1,
  //
  GOERLI_CHAIN_ID = 5,
  //
  OPTIMISM_MAINNET_CHAIN_ID = 10,
  //
  FANTOM_MAINNET_CHAIN_ID = 250,
  FANTOM_TESTNET_CHAIN_ID = 4002,
  //
  PGN = 424,
  //
  PGN_TESTNET = 58008,
  //
  ARBITRUM = 42161,
  //
  ARBITRUM_GOERLI = 421613,
  AVALANCHE = 43114,
  FUJI = 43113,
  //
  POLYGON = 137,
  //
  POLYGON_MUMBAI = 80001,
}

export const CHAINS: Record<ChainId, Program["chain"]> = {
  [ChainId.MAINNET]: {
    id: ChainId.MAINNET,
    name: "Mainnet", // TODO get canonical network names
    logo: "/logos/ethereum-eth-logo.svg",
  },
  [ChainId.GOERLI_CHAIN_ID]: {
    id: ChainId.GOERLI_CHAIN_ID,
    name: "Goerli", // TODO get canonical network names
    logo: "/logos/ethereum-eth-logo.svg",
  },
  [ChainId.OPTIMISM_MAINNET_CHAIN_ID]: {
    id: ChainId.OPTIMISM_MAINNET_CHAIN_ID,
    name: "Optimism",
    logo: "/logos/optimism-logo.svg",
  },
  [ChainId.FANTOM_MAINNET_CHAIN_ID]: {
    id: ChainId.FANTOM_MAINNET_CHAIN_ID,
    name: "Fantom",
    logo: "/logos/fantom-logo.svg",
  },
  [ChainId.FANTOM_TESTNET_CHAIN_ID]: {
    id: ChainId.FANTOM_TESTNET_CHAIN_ID,
    name: "Fantom Testnet",
    logo: "/logos/fantom-logo.svg",
  },
  [ChainId.PGN_TESTNET]: {
    id: ChainId.PGN_TESTNET,
    name: "PGN Testnet",
    logo: "/logos/pgn-logo.svg",
  },
  [ChainId.PGN]: {
    id: ChainId.PGN,
    name: "PGN",
    logo: "/logos/pgn-logo.svg",
  },
  [ChainId.ARBITRUM]: {
    id: ChainId.ARBITRUM,
    name: "Arbitrum",
    logo: "/logos/arb-logo.svg",
  },
  [ChainId.ARBITRUM_GOERLI]: {
    id: ChainId.ARBITRUM_GOERLI,
    name: "Arbitrum Goerli",
    logo: "/logos/arb-logo.svg",
  },
  [ChainId.AVALANCHE]: {
    id: ChainId.AVALANCHE,
    name: "Avalanche",
    logo: "/logos/avax-logo.svg",
  },
  [ChainId.FUJI]: {
    id: ChainId.FUJI,
    name: "Fuji (Avalanche Testnet)",
    logo: "/logos/avax-logo.svg",
  },
  [ChainId.POLYGON]: {
    id: ChainId.POLYGON,
    name: "Polygon PoS",
    logo: "./logos/pol-logo.svg",
  },
  [ChainId.POLYGON_MUMBAI]: {
    id: ChainId.POLYGON_MUMBAI,
    name: "Polygon Mumbai",
    logo: "./logos/pol-logo.svg",
  },
};

export const TokenNamesAndLogos: Record<string, string> = {
  FTM: "./logos/fantom-logo.svg",
  BUSD: "./logos/busd-logo.svg",
  DAI: "./logos/dai-logo.svg",
  ETH: "./logos/ethereum-eth-logo.svg",
  OP: "./logos/optimism-logo.svg",
  PGN: "./logos/pgn-logo.svg",
};

const MAINNET_TOKENS: PayoutToken[] = [
  {
    name: "DAI",
    chainId: ChainId.MAINNET,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimal: 18,
    logo: TokenNamesAndLogos["DAI"],
    redstoneTokenId: RedstoneTokenIds["DAI"],
  },
  {
    name: "ETH",
    chainId: ChainId.MAINNET,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["ETH"],
    redstoneTokenId: RedstoneTokenIds["ETH"],
  },
  {
    name: "CVP",
    chainId: ChainId.MAINNET,
    address: "0x38e4adB44ef08F22F5B5b76A8f0c2d0dCbE7DcA1",
    decimal: 18,
    logo: TokenNamesAndLogos["CVP"],
    redstoneTokenId: RedstoneTokenIds["CVP"],
  },
];

const OPTIMISM_MAINNET_TOKENS: PayoutToken[] = [
  {
    name: "DAI",
    chainId: ChainId.OPTIMISM_MAINNET_CHAIN_ID,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    decimal: 18,
    logo: TokenNamesAndLogos["DAI"],
    redstoneTokenId: RedstoneTokenIds["DAI"],
  },
  {
    name: "ETH",
    chainId: ChainId.OPTIMISM_MAINNET_CHAIN_ID,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["ETH"],
    redstoneTokenId: RedstoneTokenIds["ETH"],
  },
];

const FANTOM_MAINNET_TOKENS: PayoutToken[] = [
  {
    name: "WFTM",
    chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
    address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
    decimal: 18,
    logo: TokenNamesAndLogos["FTM"],
    redstoneTokenId: RedstoneTokenIds["FTM"],
  },
  {
    name: "FTM",
    chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["FTM"],
    redstoneTokenId: RedstoneTokenIds["FTM"],
  },
  {
    name: "BUSD",
    chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
    address: "0xC931f61B1534EB21D8c11B24f3f5Ab2471d4aB50",
    decimal: 18,
    logo: TokenNamesAndLogos["BUSD"],
    redstoneTokenId: RedstoneTokenIds["BUSD"],
  },
  {
    name: "DAI",
    chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
    address: "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e",
    decimal: 18,
    logo: TokenNamesAndLogos["DAI"],
    redstoneTokenId: RedstoneTokenIds["DAI"],
  },
  {
    name: "GcV",
    chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
    address: "0x83791638da5EB2fAa432aff1c65fbA47c5D29510",
    decimal: 18,
    logo: TokenNamesAndLogos["GCV"],
    redstoneTokenId: RedstoneTokenIds["DAI"], // We use DAI for the price
  },
];

const GOERLI_TESTNET_TOKENS: PayoutToken[] = [
  {
    name: "BUSD",
    chainId: ChainId.GOERLI_CHAIN_ID,
    address: "0xa7c3bf25ffea8605b516cf878b7435fe1768c89b",
    decimal: 18,
    logo: TokenNamesAndLogos["BUSD"],
    redstoneTokenId: RedstoneTokenIds["BUSD"],
  },
  {
    name: "DAI",
    chainId: ChainId.GOERLI_CHAIN_ID,
    address: "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844",
    decimal: 18,
    logo: TokenNamesAndLogos["DAI"],
    redstoneTokenId: RedstoneTokenIds["DAI"],
  },
  {
    name: "ETH",
    chainId: ChainId.GOERLI_CHAIN_ID,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["ETH"],
    redstoneTokenId: RedstoneTokenIds["ETH"],
  },
];

const FANTOM_TESTNET_TOKENS: PayoutToken[] = [
  {
    name: "DAI",
    chainId: ChainId.FANTOM_TESTNET_CHAIN_ID,
    address: "0xEdE59D58d9B8061Ff7D22E629AB2afa01af496f4",
    decimal: 18,
    logo: TokenNamesAndLogos["DAI"],
    redstoneTokenId: RedstoneTokenIds["DAI"],
  },
  {
    name: "FTM",
    chainId: ChainId.FANTOM_TESTNET_CHAIN_ID,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["FTM"],
    redstoneTokenId: RedstoneTokenIds["FTM"],
  },
];

const PGN_TESTNET_TOKENS: PayoutToken[] = [
  {
    name: "TEST",
    chainId: ChainId.PGN_TESTNET,
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    logo: TokenNamesAndLogos["DAI"],
    decimal: 18,
  },
  {
    name: "ETH",
    chainId: ChainId.PGN_TESTNET,
    address: ethers.constants.AddressZero,
    logo: TokenNamesAndLogos["ETH"],
    decimal: 18,
  },
];

const PGN_MAINNET_TOKENS: PayoutToken[] = [
  {
    name: "ETH",
    chainId: ChainId.PGN,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["ETH"],
    redstoneTokenId: RedstoneTokenIds["ETH"],
  },
  {
    name: "GTC",
    chainId: ChainId.PGN,
    address: "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2",
    decimal: 18,
    logo: TokenNamesAndLogos["GTC"],
    redstoneTokenId: RedstoneTokenIds["GTC"],
  },
];

const ARBITRUM_GOERLI_TOKENS: PayoutToken[] = [
  {
    name: "ETH",
    chainId: ChainId.ARBITRUM_GOERLI,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["ETH"],
    redstoneTokenId: RedstoneTokenIds["ETH"],
  },
];

const ARBITRUM_TOKENS: PayoutToken[] = [
  {
    name: "ETH",
    chainId: ChainId.ARBITRUM,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["ETH"],
    redstoneTokenId: RedstoneTokenIds["ETH"],
  },
  {
    name: "USDC",
    chainId: ChainId.ARBITRUM,
    address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    decimal: 6,
    logo: TokenNamesAndLogos["USDC"],
    redstoneTokenId: RedstoneTokenIds["USDC"],
  },
  {
    name: "ARB",
    chainId: ChainId.ARBITRUM,
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    decimal: 18,
    logo: TokenNamesAndLogos["ARB"],
    redstoneTokenId: RedstoneTokenIds["ARB"],
  },
];

const AVALANCHE_TOKENS: PayoutToken[] = [
  {
    name: "AVAX",
    chainId: ChainId.AVALANCHE,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["AVAX"],
    redstoneTokenId: RedstoneTokenIds["AVAX"],
  },
  {
    name: "USDC",
    chainId: ChainId.AVALANCHE,
    address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimal: 6,
    logo: TokenNamesAndLogos["USDC"],
    redstoneTokenId: RedstoneTokenIds["USDC"],
  },
];

const FUJI_TOKENS: PayoutToken[] = [
  {
    name: "AVAX",
    chainId: ChainId.FUJI,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["AVAX"],
    redstoneTokenId: RedstoneTokenIds["AVAX"],
  },
  {
    name: "USDC",
    chainId: ChainId.FUJI,
    address: "0x5425890298aed601595a70ab815c96711a31bc65",
    decimal: 6,
    logo: TokenNamesAndLogos["USDC"],
    redstoneTokenId: RedstoneTokenIds["USDC"],
  },
];

const POLYGON_TOKENS: PayoutToken[] = [
  {
    name: "MATIC",
    chainId: ChainId.POLYGON,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["MATIC"],
    redstoneTokenId: RedstoneTokenIds["MATIC"],
  },
];

const POLYGON_MUMBAI_TOKENS: PayoutToken[] = [
  {
    name: "MATIC",
    chainId: ChainId.POLYGON_MUMBAI,
    address: ethers.constants.AddressZero,
    decimal: 18,
    logo: TokenNamesAndLogos["MATIC"],
    redstoneTokenId: RedstoneTokenIds["MATIC"],
  },
];

export const payoutTokens = [
  ...MAINNET_TOKENS,
  ...OPTIMISM_MAINNET_TOKENS,
  ...FANTOM_MAINNET_TOKENS,
  ...GOERLI_TESTNET_TOKENS,
  ...FANTOM_TESTNET_TOKENS,
  ...PGN_TESTNET_TOKENS,
  ...PGN_MAINNET_TOKENS,
  ...ARBITRUM_TOKENS,
  ...ARBITRUM_GOERLI_TOKENS,
  ...AVALANCHE_TOKENS,
  ...FUJI_TOKENS,
  ...POLYGON_TOKENS,
  ...POLYGON_MUMBAI_TOKENS,
];

/*TODO: merge this and the above into one list / function*/
export const getPayoutTokenOptions = (chainId: ChainId): PayoutToken[] => {
  switch (chainId) {
    case ChainId.MAINNET: {
      return [
        {
          name: "DAI",
          chainId: ChainId.MAINNET,
          address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          logo: TokenNamesAndLogos["DAI"],
          decimal: 18,
        },
        {
          name: "ETH",
          chainId: ChainId.MAINNET,
          address: ethers.constants.AddressZero,
          logo: TokenNamesAndLogos["ETH"],
          decimal: 18,
        },
        {
          name: "CVP",
          chainId: ChainId.MAINNET,
          address: "0x38e4adB44ef08F22F5B5b76A8f0c2d0dCbE7DcA1",
          decimal: 18,
          logo: TokenNamesAndLogos["CVP"],
          redstoneTokenId: RedstoneTokenIds["CVP"],
        },
      ];
    }
    case ChainId.OPTIMISM_MAINNET_CHAIN_ID: {
      return [
        {
          name: "DAI",
          chainId: ChainId.OPTIMISM_MAINNET_CHAIN_ID,
          address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
          logo: TokenNamesAndLogos["DAI"],
          decimal: 18,
        },
        {
          name: "ETH",
          chainId: ChainId.OPTIMISM_MAINNET_CHAIN_ID,
          address: ethers.constants.AddressZero,
          logo: TokenNamesAndLogos["ETH"],
          decimal: 18,
        },
      ];
    }
    case ChainId.FANTOM_MAINNET_CHAIN_ID: {
      return [
        {
          name: "WFTM",
          chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
          address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
          logo: TokenNamesAndLogos["FTM"],
          decimal: 18,
        },
        {
          name: "FTM",
          chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
          address: ethers.constants.AddressZero,
          logo: TokenNamesAndLogos["FTM"],
          decimal: 18,
        },
        {
          name: "BUSD",
          chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
          address: "0xC931f61B1534EB21D8c11B24f3f5Ab2471d4aB50",
          logo: TokenNamesAndLogos["BUSD"],
          decimal: 18,
        },
        {
          name: "DAI",
          chainId: ChainId.FANTOM_MAINNET_CHAIN_ID,
          address: "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E",
          logo: TokenNamesAndLogos["DAI"],
          decimal: 18,
        },
      ];
    }
    case ChainId.FANTOM_TESTNET_CHAIN_ID: {
      return [
        {
          name: "DAI",
          chainId: ChainId.FANTOM_TESTNET_CHAIN_ID,
          address: "0xEdE59D58d9B8061Ff7D22E629AB2afa01af496f4",
          logo: TokenNamesAndLogos["DAI"],
          decimal: 18,
        },
      ];
    }
    case ChainId.PGN_TESTNET:
      return [
        {
          name: "TEST",
          chainId: ChainId.PGN_TESTNET,
          address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
          logo: TokenNamesAndLogos["DAI"],
          decimal: 18,
        },
        {
          name: "ETH",
          chainId: ChainId.PGN_TESTNET,
          address: ethers.constants.AddressZero,
          logo: TokenNamesAndLogos["ETH"],
          decimal: 18,
        },
      ];
    case ChainId.PGN:
      return PGN_MAINNET_TOKENS;

    case ChainId.ARBITRUM_GOERLI:
      return payoutTokens.filter(
        (token) => token.chainId === ChainId.ARBITRUM_GOERLI
      );

    case ChainId.ARBITRUM:
      return payoutTokens.filter((token) => token.chainId === ChainId.ARBITRUM);

    case ChainId.POLYGON:
      return payoutTokens.filter((token) => token.chainId === ChainId.POLYGON);

    case ChainId.POLYGON_MUMBAI:
      return payoutTokens.filter(
        (token) => token.chainId === ChainId.POLYGON_MUMBAI
      );

    case ChainId.AVALANCHE:
      return payoutTokens.filter(
        (token) => token.chainId === ChainId.AVALANCHE
      );

    case ChainId.FUJI:
      return payoutTokens.filter((token) => token.chainId === ChainId.FUJI);

    case ChainId.GOERLI_CHAIN_ID:
    default: {
      return [
        {
          name: "BUSD",
          chainId: ChainId.GOERLI_CHAIN_ID,
          address: "0xa7c3bf25ffea8605b516cf878b7435fe1768c89b",
          logo: TokenNamesAndLogos["BUSD"],
          decimal: 18,
        },
        {
          name: "DAI",
          chainId: ChainId.GOERLI_CHAIN_ID,
          address: "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844",
          logo: TokenNamesAndLogos["DAI"],
          decimal: 18,
        },
        {
          name: "ETH",
          chainId: ChainId.GOERLI_CHAIN_ID,
          address: ethers.constants.AddressZero,
          logo: TokenNamesAndLogos["ETH"],
          decimal: 18,
        },
      ];
    }
  }
};

export const graphql_fetch = async (
  query: string,
  chainId: ChainId,

  variables: object = {},
  fromProjectRegistry = false
) => {
  let endpoint = `https://gateway.thegraph.com/api/db01d72285a54fa4864050a870e9b16d/subgraphs/id/Ba4YGqqyYVFd55zcQnXS3XYTjJARKe93LY6qNgFbrHQz`;
  if (fromProjectRegistry) {
    endpoint = endpoint.replace("grants-round", "grants-hub");
  }

  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  }).then((resp) => {
    if (resp.ok) {
      return resp.json();
    }

    return Promise.reject(resp);
  });
};

/**
 * Fetch data from IPFS
 *
 * @param cid - the unique content identifier that points to the data
 */

const URL = "d16c97c2np8a2o.cloudfront.net";
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL
  ? process.env.NEXT_PUBLIC_GATEWAY_URL
  : "https://gateway.pinata.cloud";

export const fetchFromIPFS = (cid: string, roundInfo?: boolean) => {
  const IFPSUrl = roundInfo ? GATEWAY_URL : URL;
  return fetch(`https://${IFPSUrl}/ipfs/${cid}`).then((resp) => {
    if (resp.ok) {
      return resp.json();
    }

    return Promise.reject(resp);
  });
};

export const pinToIPFS = async (
  body: string,
  roundId: string
): Promise<{ IpfsHash: string }> => {
  return fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      pinataMetadata: {
        name: roundId,
      },
      pinataOptions: {
        cidVersion: 1,
      },
      pinataContent: body,
    }),
  }).then((resp) => {
    if (resp.ok) {
      return resp.json();
    }

    return Promise.reject(resp);
  });
};

export const formatCurrency = (value: BigNumber, decimal: number) => {
  return parseFloat(ethers.utils.formatUnits(value.toString(), decimal));
};

export const getRoundById = (rounds: Round[], roundId: string) => {
  return rounds.find((round) => round.id == getAddress(roundId));
};
