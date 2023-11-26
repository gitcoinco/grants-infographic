import {
  ChainId,
  fetchFromIPFS,
  findRoundById,
  formatCurrency,
  graphql_fetch,
} from "./utils";
import { Address, getAddress } from "viem";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import redstone from "redstone-api";
import {
  ApplicationStatus,
  Eligibility,
  MatchingStatsData,
  MetadataPointer,
  PayoutToken,
  Project,
  ProjectApplication,
  ProjectIPFSMetadata,
  ProjectMetadata,
  Round,
} from "./types";
import { BigNumber, ethers } from "ethers";
import roundImplementationAbi from "./abi/roundImplementation";
import merklePayoutStrategyImplementationAbi from "./abi/merklePayoutStrategyImplementation";

const pinataSDK = require("@pinata/sdk");
const pinata = new pinataSDK({
  pinataJWTKey: process.env.NEXT_PUBLIC_PINATA_JWT,
});

dayjs.extend(LocalizedFormat);

const ALLO_API_URL = "https://indexer-production.fly.dev";
const GRANTS_STACK_DATA_CLIENT_BASE_URL = "https://gitcoin-search-dev.fly.dev";

const SUBGRAPH_ARBITRUM_API =
  "https://api.thegraph.com/subgraphs/name/gitcoinco/gitcoin-grants-arbitrum-one";
const SUBGRAPH_ARBITRUM_GOERLI_API =
  "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-arbitrum-goerli";
const SUBGRAPH_AVALANCHE_API =
  "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-avalanche-mainnet";
const SUBGRAPH_FANTOM_MAINNET_API =
  "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-fantom-mainnet";
const SUBGRAPH_FANTOM_TESTNET_API =
  "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-fantom-testnet";
const SUBGRAPH_FUJI_API =
  "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-fuji-testnet";
const SUBGRAPH_GOERLI_API =
  "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-goerli-testnet";
const SUBGRAPH_MAINNET_API =
  "https://gateway.thegraph.com/api/db01d72285a54fa4864050a870e9b16d/subgraphs/id/Ba4YGqqyYVFd55zcQnXS3XYTjJARKe93LY6qNgFbrHQz";
const SUBGRAPH_OPTIMISM_MAINNET_API =
  "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-optimism-mainnet";
const SUBGRAPH_PGN_API =
  "https://graph-gitcoin-mainnet.hirenodes.io/subgraphs/name/gitcoin/allo";
const SUBGRAPH_PGN_TESTNET_API =
  "https://graph-gitcoin-testnet.hirenodes.io/subgraphs/name/gitcoin/allo";
const SUBGRAPH_POLYGON_API =
  "https://api.thegraph.com/subgraphs/name/allo-protocol/grants-round-polygon";
const SUBGRAPH_POLYGON_MUMBAI_API =
  "https://api.thegraph.com/subgraphs/name/allo-protocol/grants-round-mumbai";

export const graphQlEndpoints: Record<ChainId, string> = {
  [ChainId.PGN]: SUBGRAPH_PGN_API!,
  [ChainId.GOERLI_CHAIN_ID]: SUBGRAPH_GOERLI_API!,
  [ChainId.PGN_TESTNET]: SUBGRAPH_PGN_TESTNET_API!,
  [ChainId.MAINNET]: SUBGRAPH_MAINNET_API!,
  [ChainId.OPTIMISM_MAINNET_CHAIN_ID]: SUBGRAPH_OPTIMISM_MAINNET_API!,
  [ChainId.FANTOM_MAINNET_CHAIN_ID]: SUBGRAPH_FANTOM_MAINNET_API!,
  [ChainId.FANTOM_TESTNET_CHAIN_ID]: SUBGRAPH_FANTOM_TESTNET_API!,
  [ChainId.ARBITRUM_GOERLI]: SUBGRAPH_ARBITRUM_GOERLI_API!,
  [ChainId.ARBITRUM]: SUBGRAPH_ARBITRUM_API!,
  [ChainId.FUJI]: SUBGRAPH_FUJI_API!,
  [ChainId.AVALANCHE]: SUBGRAPH_AVALANCHE_API!,
  [ChainId.POLYGON]: SUBGRAPH_POLYGON_API!,
  [ChainId.POLYGON_MUMBAI]: SUBGRAPH_POLYGON_MUMBAI_API!,
};

const getGraphQLEndpoint = (chainId: ChainId): string =>
  graphQlEndpoints[chainId];

// eslint-disable-next-line import/prefer-default-export
export const graphqlFetch = async (
  query: string,
  chainId: ChainId,
  variables: object = {}
) => {
  const endpoint = getGraphQLEndpoint(chainId);
  if (endpoint) {
    return fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }).then((resp) => {
      if (resp.ok) {
        return resp.json();
      }
      return Promise.reject(resp);
    });
  }

  throw new Error(`Subgraph endpoint for chain id ${chainId} not defined.`);
};

const ROUNDS_QUERY = `
query GetRounds(
  $first: Int, 
  $orderBy: String,
  $orderDirection: String,
  $where: Round_filter,
  $currentTimestamp: String
  ) {
    rounds(first: $first,
      orderBy: $orderBy,
      orderDirection: $orderDirection,
      where: $where
    ) {
      id
      roundMetaPtr {
        protocol
        pointer
      }
      applicationsStartTime
      applicationsEndTime
      roundStartTime
      roundEndTime
      matchAmount
      token
      payoutStrategy {
        id
        strategyName
      }
      
    }
}
`;

/**
 * Shape of subgraph response
 */
export interface GetRoundByIdResult {
  data: {
    rounds: RoundResult[];
  };
}

/**
 * Shape of subgraph response of Round
 */
export interface RoundResult {
  id: string;
  program: {
    id: string;
  };
  roundMetaPtr: MetadataPointer;
  applicationMetaPtr: MetadataPointer;
  applicationsStartTime: string;
  applicationsEndTime: string;
  roundStartTime: string;
  roundEndTime: string;
  token: string;
  votingStrategy: string;
  projectsMetaPtr?: MetadataPointer | null;
}

export interface ProjectVote {
  id: string;
  transaction: string;
  blockNumber: number;
  projectId: string;
  applicationId: string;
  roundId: string;
  voter: Address;
  grantAddress: Address;
  token: string;
  amount: string;
  amountUSD: number;
  amountRoundToken: string;
}
/**
 * Shape of IPFS content of Round RoundMetaPtr
 */
export type RoundMetadata = {
  name: string;
  roundType: string;
  eligibility: Eligibility;
  programContractAddress: string;
};

export type RoundProject = {
  id: string;
  status: ApplicationStatus;
  payoutAddress: string;
};

export const getRoundById = async (
  chainId: number,
  roundId: string
): Promise<{ data: Round | undefined; success: boolean; error: string }> => {
  const allRounds = await getRoundsByChainId(chainId);
  if (!allRounds.success)
    return {
      success: false,
      error: allRounds.error,
      data: undefined,
    };
  const round = findRoundById(allRounds.data || [], roundId);
  return {
    success: true,
    error: "",
    data: round,
  };
};

function fetchRoundsMetadata(rounds: any[]) {
  return Promise.all(
    rounds.map(async (round) => {
      const cid = round.roundMetaPtr.pointer;
      const metadata = await fetchFromIPFS(cid);
      return { ...round, metadata, votes: 0, amountUSD: 200000 };
    })
  );
}

export async function getRoundsByChainId(chainId: any) {
  try {
    const endpoint = getGraphQLEndpoint(chainId);
    const res = await graphql_fetch(ROUNDS_QUERY, endpoint);
    const rounds = res.data.rounds;

    const roundsWithMetadata = await fetchRoundsMetadata(rounds);
console.log(roundsWithMetadata);

    return {
      data: roundsWithMetadata,
      success: true,
      error: "",
    };
  } catch (error) {
    console.log("getRounds", error);
    throw Error("Unable to fetch rounds");
  }
}
// export const getRoundsByChainId = async (
//   chainId: number
// ): Promise<{ data: Round[] | undefined; success: boolean; error: string }> => {
//   try {
//     const resp = await fetch(
//       `https://indexer-production.fly.dev/data/${chainId}/rounds.json`,
//       { next: { revalidate: 3600 } }
//     );
//     const data = (await resp.json()) as Round[];

//     return {
//       data,
//       success: true,
//       error: "",
//     };
//   } catch (err) {
//     return { data: undefined, success: false, error: err as string };
//   }
// };

export const getRoundInfo = async (roundId: string) => {
  try {
    // get only the most recent one by roundName
    const response = await pinata.pinList({
      metadata: { name: roundId },
      pageLimit: 1,
    });
    const hash = response.rows && (response.rows[0]?.ipfs_pin_hash as string);
    if (!hash) return { data: undefined, success: true, error: "" };
    const roundInfo: string = await fetchFromIPFS(hash, true);
    return { data: JSON.parse(roundInfo), success: true, error: "" };
  } catch (err) {
    console.log(err);
    return { data: undefined, success: false, error: err as string };
  }
};

export function convertStatus(status: string | number) {
  switch (status) {
    case 0:
      return "PENDING";
    case 1:
      return "APPROVED";
    case 2:
      return "REJECTED";
    case 3:
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

async function loadApprovedProjectsMetadata(
  projects: ProjectApplication[]
): Promise<Project[]> {
  const fetchApprovedProjectMetadata: Promise<Project>[] = projects.map(
    (project) => fetchMetadataAndMapProject(project)
  );

  return Promise.all(fetchApprovedProjectMetadata);
}

async function fetchMetadataAndMapProject(
  project: ProjectApplication
): Promise<Project> {
  const applicationData: ProjectIPFSMetadata = await fetchFromIPFS(
    project.metadata.application.project.metaPtr.pointer
  );

  return {
    ...project,
    ipfsMetadata: applicationData,
  };
}

export const getProjectsApplications = async (
  roundId: Address,
  chainId: number
) => {
  try {
    const resp = await fetch(
      `https://indexer-production.fly.dev/data/${chainId}/rounds/${getAddress(
        roundId
      )}/applications.json`,
      { next: { revalidate: 3600 } }
    );
    const data = (await resp.json()) as ProjectApplication[];

    const approvedData = data.filter(
      (ap) => ap.status == ApplicationStatus.APPROVED
    );
    // const projects = await loadProjectsVotes(roundId, approvedData);
    // const projects = await loadApprovedProjectsMetadata(approvedData);
    // const matchedData = calculateMatch(projects, totalRoundMatch);
    return approvedData;
  } catch (err) {
    console.log(err);
  }
};

// async function loadProjectsVotes(
//   roundId: Address,
//   projects: ProjectApplication[]
// ): Promise<ProjectApplication[]> {
//   if (projects.length === 0) {
//     return [];
//   }

//   const roundVotes = (await getRoundVotes(roundId)) || [];
//   const projectsVotes: Promise<ProjectApplication>[] = projects.map(
//     (project: ProjectApplication) => mapProjectVotes(project, roundVotes)
//   );

//   return Promise.all(projectsVotes);
// }

// async function mapProjectVotes(
//   project: ProjectApplication,
//   roundVotes: ProjectVote[]
// ): Promise<ProjectApplication> {
//   const votesArray =
//     roundVotes.filter((vote) => vote.projectId == project.projectId) || [];
//   return {
//     ...project,
//     votesArray,
//   };
// }

export const getRoundVotes = async (roundId: Address) => {
  try {
    const resp = await fetch(
      `https://indexer-production.fly.dev/data/1/rounds/${getAddress(
        roundId
      )}/votes.json`,
      {
        method: "GET",
      }
    );
    const data = await resp.json();
    return data as ProjectVote[];
  } catch (err) {
    console.log(err);
  }
};

export const getRoundContributors = async (roundId: Address) => {
  try {
    const resp = await fetch(
      `https://indexer-production.fly.dev/data/1/rounds/${getAddress(
        roundId
      )}/contributors.json`,
      {
        method: "GET",
        // headers: {
        //   Accept: "application/json",
        //   "Content-Type": "application/json",
        // },
      }
    );
    const data = await resp.json();
    return data as any[];
  } catch (err) {
    console.log(err);
  }
};

export const getProjectContributors = async (
  roundId: Address,
  projectId: Address,
  chainId: number
) => {
  try {
    const resp = await fetch(
      `https://indexer-production.fly.dev/data/${chainId}/rounds/${getAddress(
        roundId
      )}/projects/${getAddress(projectId)}/contributors.json`,
      {
        method: "GET",
        // headers: {
        //   Accept: "application/json",
        //   "Content-Type": "application/json",
        // },
      }
    );
    const data = await resp.json();
    return data as any[];
  } catch (err) {
    console.log(err);
  }
};

export async function getProjectOwners(
  chainId: any,
  projectRegistryId: string
) {
  try {
    // get the subgraph for project owners by $projectRegistryId
    const res = await graphql_fetch(
      `
        query GetProjectOwners($projectRegistryId: String) {
          projects(where: {
            id: $projectRegistryId
          }) {
            id
            accounts {
              account {
                address
              }
            }
          }
        }
      `,
      chainId,
      { projectRegistryId },
      true
    );

    return (
      res.data?.projects[0]?.accounts.map(
        (account: { account: { address: string } }) =>
          getAddress(account.account.address)
      ) || []
    );
  } catch (error) {
    console.log("getProjectOwners", error);
    throw Error("Unable to fetch project owners");
  }
}

export async function fetchPayoutTokenPrice(
  roundId: string | undefined,
  signerOrProvider: any,
  token: PayoutToken
) {
  if (!roundId) {
    throw new Error("Round ID is required");
  }
  const roundImplementation = new ethers.Contract(
    roundId,
    roundImplementationAbi,
    signerOrProvider
  );
  const payoutStrategyAddress = await roundImplementation.payoutStrategy();
  const payoutStrategy = new ethers.Contract(
    payoutStrategyAddress,
    merklePayoutStrategyImplementationAbi,
    signerOrProvider
  );

  const fundsDistributed = await payoutStrategy.queryFilter("FundsDistributed");

  if (fundsDistributed?.length) {
    const payoutTimestamp = (await fundsDistributed[0].getBlock()).timestamp;

    const payoutDate = dayjs.unix(Number(payoutTimestamp)).toString();
    const price = await redstone.getHistoricalPrice(
      token.redstoneTokenId || token.name,
      {
        date: payoutDate,
      }
    );
    return price.value;
  }
  return;
}
//  Fetch finalized matching distribution
export async function fetchMatchingDistribution(
  roundId: string | undefined,
  signerOrProvider: any,
  token: PayoutToken,
  roundMatchingPoolUSD: number
) {
  try {
    if (!roundId) {
      throw new Error("Round ID is required");
    }
    let matchingDistribution: MatchingStatsData[] = [];
    const roundImplementation = new ethers.Contract(
      roundId,
      roundImplementationAbi,
      signerOrProvider
    );
    const payoutStrategyAddress = await roundImplementation.payoutStrategy();
    const payoutStrategy = new ethers.Contract(
      payoutStrategyAddress,
      merklePayoutStrategyImplementationAbi,
      signerOrProvider
    );
    const distributionMetaPtrRes = await payoutStrategy.distributionMetaPtr();
    const distributionMetaPtr = distributionMetaPtrRes.pointer;
    if (distributionMetaPtr !== "") {
      // fetch distribution from IPFS
      const matchingDistributionRes = await fetchFromIPFS(distributionMetaPtr);
      matchingDistribution = matchingDistributionRes.matchingDistribution;
      // parse matchAmountInToken to a valid BigNumber + add matchAmount
      matchingDistribution = matchingDistribution.map((distribution) => {
        const x = BigNumber.from((distribution.matchAmountInToken as any).hex);
        distribution.matchAmountInToken = x;
        const z = formatCurrency(x, token.decimal);
        return {
          ...distribution,
          matchAmount: Number(z || 0),
          matchAmountUSD:
            distribution.matchPoolPercentage * roundMatchingPoolUSD,
        };
      });
    }
    return matchingDistribution;
  } catch (err) {
    console.log(err);
  }
}
