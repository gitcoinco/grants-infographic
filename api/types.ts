import { BigNumber } from "ethers";
import { Address } from "wagmi";

export interface MetadataPointer {
  /**
   * The decentralized storage protocol
   * Read more here: https://github.com/gitcoinco/grants-round/blob/main/packages/contracts/docs/MetaPtrProtocol.md
   */
  protocol: number;
  /**
   * The identifier which represents the program metadata on a decentralized storage
   */
  pointer: string;
}

export interface IPFSObject {
  /**
   * File content to be saved in IPFS
   */
  content: object | Blob;
  /**
   * Optional metadata
   */
  metadata?: {
    name?: string;
    keyvalues?: object;
  };
}

/** Base Contract interface */
export interface Contract {
  /**
   * Contract address
   */
  address?: string;
  /**
   * Contract ABI in Human Readable ABI format
   */
  abi: Array<string>;
  /**
   * Contract ABI in binary format
   */
  bytecode?: string;
}

export interface Requirement {
  // Requirement for the round
  requirement?: string;
}

export interface Eligibility {
  // Eligibility for the round
  description: string;
  // Requirements for the round
  requirements?: Requirement[];
}

export interface Round {
  /**
   * The on-chain unique round ID
   */
  id?: string;

  metadata?: {
    name: string;
    eligibility: Eligibility;
    feesAddress: string;
    feesPercentage: number;
    programContractAddress: string;
    quadraticFundingConfig?: {
      matchingFundsAvailable: number;
      matchingCap: boolean;
      // percentage
      matchingCapAmount?: number;
      minDonationThreshold?: boolean;
      minDonationThresholdAmount?: number;
      sybilDefense?: boolean;
    };
    support?: {
      type: string;
      info: string;
    };
  };
  /**
   * Pointer to round metadata in a decentralized storage e.g IPFS, Ceramic etc.
   */
  // store?: MetadataPointer;
  /**
   * Pointer to application metadata in a decentralized storage e.g IPFS, Ceramic etc.
   */
  // applicationStore?: MetadataPointer;
  /**
   * Voting contract address
   */
  // votingStrategy: string;
  /**
   * Unix timestamp of the start of the round
   */
  roundStartTime: Date;
  /**
   * Unix timestamp of the end of the round
   */
  roundEndTime: Date;
  /**
   * Unix timestamp of when grants can apply to a round
   */
  applicationsStartTime: Date;
  /**
   * Unix timestamp after which grants cannot apply to a round
   */
  applicationsEndTime: Date;
  /**
   * Contract address of the token used to payout match amounts at the end of a round
   */
  token: string;

  /**
   * Contract address of the program to which the round belongs
   */
  // ownedBy: string;
  /**
   * List of projects approved for the round
   */
  amountUSD: number;
  applicationMetaPtr: string;
  applicationMetadata: {
    // applicationSchema

    lastUpdatedOn: string;
    version: string;
  };
  createdAtBlock: number;

  // approvedProjects?: Project[];
  matchAmount: string;
  matchAmountUSD: number;
  metaPtr: string;
  votes: number;
  uniqueContributors: number;
  rate: number;
  matchingPoolUSD: number;
}

export type GrantApplicationFormAnswer = {
  questionId: number;
  question: string;
  answer: string | string[];
  hidden: boolean;
  type?: string;
};

export type GrantApplicationId = string;
export type ProjectRegistryId = string;
export type recipient = string;

export type DonationInput = {
  projectRegistryId: ProjectRegistryId;
  amount: string;
  projectAddress: recipient;
  applicationIndex: number;
};

export enum ApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

interface ProjectOwner {
  address: string;
}

export type ProjectMetadata = {
  id: string;
  title: string;
  description: string;
  website: string;
  bannerImg?: string;
  logoImg?: string;
  projectTwitter?: string;
  userGithub?: string;
  projectGithub?: string;
  // credentials?: ProjectCredentials;
  createdAt?: number;
  metaPtr: {
    pointer: string;
    protocol: string;
  }
};

export interface ProjectApplication {
  // $ of crowdfunding
  amountUSD: number;
  createdAtBlock: number;
  id: string;
  metadata: { application: { project: ProjectMetadata; recipient: string } };
  projectId: Address;
  roundId: string;
  status: string;
  statusUpdatedAtBlock: number;
  uniqueContributors: number;
  votes: number;
}
export interface ProjectIPFSMetadata {
  applicationId: string;
  projectName: string;
  projectPayoutAddress: string;
  // decimal
  matchPoolPercentage: number;
  matchAmountInToken: number;
}

export interface Project extends ProjectApplication {
  ipfsMetadata: ProjectIPFSMetadata;
}

export enum ProgressStatus {
  IS_SUCCESS = "IS_SUCCESS",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_STARTED = "NOT_STARTED",
  IS_ERROR = "IS_ERROR",
}

export type PayoutToken = {
  name: string;
  chainId: number;
  address: string;
  decimal: number;
  logo?: string;
  default?: boolean;
  redstoneTokenId?: string;
};

export type RoundInfo = {
  preamble: string;
  closing: string;
  projects: {
    id: string;
    description: string;
  }[]
}

export type MatchingStatsData = {
  index?: number;
  projectName: string;
  uniqueContributorsCount?: number;
  contributionsCount: number;
  matchPoolPercentage: number;
  projectId: string;
  applicationId: string;
  matchAmountInToken: BigNumber;
  originalMatchAmountInToken: BigNumber;
  projectPayoutAddress: string;
  status?: string;
  hash?: string;
  matchAmount: number;
  matchAmountUSD: number;
};

export interface Program {
  /**
   * The on-chain unique program ID
   */
  id?: string;
  /**
   * Metadata of the Grant Program to be stored off-chain
   */
  metadata: {
    name: string;
  };
  /**
   * Pointer to a decentralized storage e.g IPFS, Ceramic etc.
   */
  store?: MetadataPointer;
  /**
   * Addresses of wallets that will have admin privileges to operate the Grant program
   */
  operatorWallets: Array<string>;
  /**
   * Network Chain Information
   */
  chain?: {
    id: number;
    name?: string;
    logo?: string;
  };
}

export const RedstoneTokenIds = {
  FTM: "FTM",
  USDC: "USDC",
  DAI: "DAI",
  ETH: "ETH",
  ARB: "ARB",
  BUSD: "BUSD",
  GTC: "GTC",
  MATIC: "MATIC",
  AVAX: "AVAX",
  CVP: "CVP",
} as const;