import {
  MatchingStatsData,
  Program,
  ProjectApplication,
  RedstoneTokenIds,
  Round,
} from "./types";
import { BigNumber, ethers } from "ethers";
import { getAddress } from "viem";

export function stringToBlobUrl(data: string): string {
  const blob = new Blob([data], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  return url;
}

export const getBlockExplorerTxLink = (chainId: ChainId, hash: string) => {
  if (chainId == ChainId.PGN)
    return `https://explorer.publicgoods.network/tx/${hash}`;
  if (chainId == ChainId.POLYGON) return `https://polygonscan.com/tx/${hash}`;
  if (chainId == ChainId.OPTIMISM_MAINNET_CHAIN_ID)
    return `https://optimistic.etherscan.io/tx/${hash}`;
  if (chainId == ChainId.ARBITRUM) return `https://arbiscan.io/tx/${hash}`;
  if (chainId == ChainId.AVALANCHE)
    return `https://avascan.info/blockchain/dexalot/tx/${hash}`;
  if (chainId == ChainId.MAINNET) return `https://etherscan.io/tx/${hash}`;
  if (chainId == ChainId.FANTOM_MAINNET_CHAIN_ID)
    return `https://ftmscan.com/tx/${hash}`;
  if (chainId == ChainId.ZKSYNC_ERA_MAINNET_CHAIN_ID)
    return `https://explorer.zksync.io/tx/${hash}`;
  if (chainId == ChainId.BASE) return `https://basescan.org/tx/${hash}`;
};

export const getDaysLeft = (fromNowToTimestampStr: string) => {
  const targetTimestamp = Number(fromNowToTimestampStr);

  // Some timestamps are returned as overflowed (1.15e+77)
  // We parse these into undefined to show as "No end date" rather than make the date diff calculation
  if (targetTimestamp > Number.MAX_SAFE_INTEGER) {
    return undefined;
  }

  // TODO replace with differenceInCalendarDays from 'date-fns'
  const currentTimestampInSeconds = Math.floor(Date.now() / 1000); // current timestamp in seconds
  const secondsPerDay = 60 * 60 * 24; // number of seconds per day

  const differenceInSeconds = targetTimestamp - currentTimestampInSeconds;
  const differenceInDays = Math.floor(differenceInSeconds / secondsPerDay);

  return differenceInDays;
};

export const getGranteeLink = (
  chainId: number,
  roundId: string,
  applicationId: string
) => {
  return `https://explorer.gitcoin.co/#/round/${chainId}/${roundId.toLowerCase()}/${roundId.toLowerCase()}-${applicationId}`;
};

export const defaultTweetURL =
  "https://twitter.com/umarkhaneth/status/1718319104178753678";

export const twitterRegex: RegExp =
  /^https?:\/\/(www.|m.|mobile.)?twitter|x\.com\/(?:#!\/)?\w+\/status?\/\d+/;

export const warpcastRegex: RegExp =
  /^https?:\/\/(www.)?warpcast\.com\/(?:#!\/)?\w+\/(?:#!\/)?\w+/;

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

// export function useDebugMode(): boolean {
//   const [searchParams] = useSearchParams();

//   return (
//     (process.env.NEXT_PUBLIC_ALLOW_URL_DEBUG_MODE === "true" &&
//       searchParams.get("debug") === "true") ||
//     process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
//   );
// }

export const isTestnet = (chainId: number) => {
  const testnetIds = [
    ChainId.FANTOM_TESTNET_CHAIN_ID,
    ChainId.PGN_TESTNET,
    ChainId.ARBITRUM_GOERLI,
    // ChainId.GOERLI_CHAIN_ID,
    ChainId.FUJI,
    ChainId.POLYGON_MUMBAI,
    ChainId.ZKSYNC_ERA_TESTNET_CHAIN_ID,
  ];

  return testnetIds.includes(chainId);
};

export enum ChainId {
  //
  MAINNET = 1,
  //
  // GOERLI_CHAIN_ID = 5,
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
  BASE = 8453,
  ZKSYNC_ERA_TESTNET_CHAIN_ID = 280,
  ZKSYNC_ERA_MAINNET_CHAIN_ID = 324,
}

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

const GATEWAY_URL = process.env.NEXT_PUBLIC_IPFS_BASE_URL ?? "";

export const fetchFromIPFS = (cid: string, roundInfo?: boolean) => {
  const IFPSUrl = roundInfo ? GATEWAY_URL : "ipfs.io";
  return fetch(`${IFPSUrl}/ipfs/${cid}`, {
    next: { tags: [roundInfo ? "roundInfo" : ""] },
  }).then((resp) => {
    if (resp.ok) {
      return resp.json();
    }

    return Promise.reject(resp);
  });
};

export function parseChainId(input: string | number): ChainId {
  if (typeof input === "string") {
    // If the input is a string, try to parse it as a number
    const parsedInput = parseInt(input, 10);
    if (!isNaN(parsedInput)) {
      // If parsing is successful, check if it's a valid enum value
      if (Object.values(ChainId).includes(parsedInput)) {
        return parsedInput as ChainId;
      }
    }
  } else if (typeof input === "number") {
    // If the input is a number, check if it's a valid enum value
    if (Object.values(ChainId).includes(input)) {
      return input as ChainId;
    }
  }

  // If the input is not a valid enum value, return undefined
  throw "Invalid chainId " + input;
}

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

export const pinFileToIPFS = async (body: FormData) => {
  return fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      accept: "application/json",
    },
    body,
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

export function formatDateWithOrdinal(date: Date) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  } as const;

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const formattedDate = formatter.format(date);

  const dayOfMonth = date.getDate();
  const pluralRules = new Intl.PluralRules("en-US", { type: "ordinal" });
  const suffix = {
    one: "st",
    two: "nd",
    few: "rd",
    other: "th",
    many: "",
    zero: "",
  }[pluralRules.select(dayOfMonth)];

  return `${formattedDate.replace(
    dayOfMonth.toString(),
    `${dayOfMonth}${suffix}`
  )}`;
}

export const ROUND_PAYOUT_DIRECT = "allov1.Direct";
export const ROUND_PAYOUT_DIRECT_OLD = "DIRECT";

export const isDirectRound = (round: Round) =>
  // @ts-expect-error support old rounds
  round.payoutStrategy.strategyName === ROUND_PAYOUT_DIRECT_OLD ||
  round.payoutStrategy.strategyName === ROUND_PAYOUT_DIRECT;

export const isInfiniteDate = (roundTime: Date) =>
  roundTime.toString() === "Invalid Date";

export const formatUTCDateAsISOString = (date: Date): string => {
  // @ts-expect-error remove when DG support is merged
  if (isNaN(date)) {
    return "";
  }
  const isoString = date.toISOString();
  return isoString.slice(0, 10).replace(/-/g, "/");
};
export const padSingleDigitNumberWithZero = (i: number): string =>
  i < 10 ? "0" + i : i.toString();

export const getUTCTime = (date: Date): string => {
  const utcTime = [
    padSingleDigitNumberWithZero(date.getUTCHours()),
    padSingleDigitNumberWithZero(date.getUTCMinutes()),
  ];

  return utcTime.join(":") + " UTC";
};

export function createIpfsImageUrl(args: {
  baseUrl: string;
  cid: string;
  height?: number;
}): string {
  return new URL(
    `/ipfs/${args.cid}${args.height ? `?img-height=${args.height}` : ""}`,
    args.baseUrl
  ).toString();
}

export const findRoundById = (rounds: Round[], roundId: string) => {
  return roundId
    ? rounds.find((round) => round.id == getAddress(roundId))
    : undefined;
};

export const defaultIntro = `Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.`;
