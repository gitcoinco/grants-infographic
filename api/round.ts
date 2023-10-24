import { fetchFromIPFS, formatCurrency, graphql_fetch } from "./utils";
import { Address, getAddress } from "viem";
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
  RoundInfo,
} from "./types";
import { BigNumber, ethers } from "ethers";
import roundImplementationAbi from "./abi/roundImplementation";
import merklePayoutStrategyImplementationAbi from "./abi/merklePayoutStrategyImplementation";

const pinataSDK = require("@pinata/sdk");
const pinata = new pinataSDK({
  pinataJWTKey: process.env.NEXT_PUBLIC_PINATA_JWT,
});

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

export const getRoundsByChainId = async (
  chainId: number
): Promise<{ data: Round[] | undefined; success: boolean; error: string }> => {
  try {
    const resp = await fetch(
      `https://indexer-production.fly.dev/data/${chainId}/rounds.json`,
      {
        method: "GET",
      }
    );
    const data = (await resp.json()) as Round[];

    return {
      data,
      success: true,
      error: "",
    };
  } catch (err) {
    return { data: undefined, success: false, error: err as string };
  }
};

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
      {
        method: "GET",
      }
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

//  Fetch finalized matching distribution
export async function fetchMatchingDistribution(
  roundId: string | undefined,
  signerOrProvider: any,
  token: PayoutToken
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
        const y = Number(BigInt(x._hex).toString());
        const z = formatCurrency(x, token.decimal, 2);
        return { ...distribution, matchAmount: Number(z || 0) };
      });
    }
    return matchingDistribution;
  } catch (err) {
    console.log(err);
  }
}
