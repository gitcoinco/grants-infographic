import { ProjectApplication } from "./round";
import { useSearchParams } from "react-router-dom";

 export const sortByMatch = <T extends { match: number }[]>(arr: T) => {
  if (!arr.length || !arr[0]?.match) return arr;
  return arr.sort(function (a, b) {
    return b.match - a.match;
  })
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

export const calculateMatch = (projects: ProjectApplication[], match: number) => {
  
  let sum = 0; 
  const newProjects = [...projects];
  if (!projects?.length) return;
  for (let i = 0; i < newProjects.length; i++) {
    let sumAmount = 0;

    for (let j = 0; j < newProjects[i].votesArray.length; j++) {
      sumAmount += Math.sqrt(newProjects[i].votesArray[j].amountUSD);
    }

    sumAmount *= sumAmount;
    newProjects[i].match = sumAmount;
    sum += sumAmount;
    
  }

  let divisor = match / sum;
  for (let i = 0; i < newProjects.length; i++) {
    newProjects[i].match *= divisor;
  }

  return {newProjects, sum}
};

export function useDebugMode(): boolean {
  const [searchParams] = useSearchParams();

  return (
    (process.env.NEXT_PUBLIC_ALLOW_URL_DEBUG_MODE === "true" &&
      searchParams.get("debug") === "true") ||
    process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
  );
}

export enum ChainId {
  MAINNET = "1",
  GOERLI_CHAIN_ID = "5",
  OPTIMISM_MAINNET_CHAIN_ID = "10",
  FANTOM_MAINNET_CHAIN_ID = "250",
  FANTOM_TESTNET_CHAIN_ID = "4002",
  PGN_TESTNET_CHAIN_ID = "58008",
}

export const CHAINS: Record<number, any> = {
  [ChainId.MAINNET]: {
    id: ChainId.MAINNET,
    name: "Mainnet",
    logo: "./logos/ethereum-eth-logo.svg",
  },
  [ChainId.GOERLI_CHAIN_ID]: {
    id: ChainId.GOERLI_CHAIN_ID,
    name: "Goerli",
    logo: "./logos/ethereum-eth-logo.svg",
  },
  [ChainId.OPTIMISM_MAINNET_CHAIN_ID]: {
    id: ChainId.OPTIMISM_MAINNET_CHAIN_ID,
    name: "Optimism",
    logo: "./logos/optimism-logo.svg",
  },
  [ChainId.FANTOM_MAINNET_CHAIN_ID]: {
    id: ChainId.FANTOM_MAINNET_CHAIN_ID,
    name: "Fantom",
    logo: "./logos/fantom-logo.svg",
  },
  [ChainId.FANTOM_TESTNET_CHAIN_ID]: {
    id: ChainId.FANTOM_TESTNET_CHAIN_ID,
    name: "Fantom Testnet",
    logo: "./logos/fantom-logo.svg",
  },
  [ChainId.PGN_TESTNET_CHAIN_ID]: {
    id: ChainId.PGN_TESTNET_CHAIN_ID,
    name: "PGN Testnet",
    logo: "./logos/pgn-logo.svg",
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

const URL = "ipfs-grants-stack.gitcoin.co";
export const fetchFromIPFS = (cid: string) => {
  return fetch(`https://${URL}/ipfs/${cid}`).then((resp) => {
    if (resp.ok) {
      return resp.json();
    }

    return Promise.reject(resp);
  });
};
