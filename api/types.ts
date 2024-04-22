import { BigNumber } from "ethers";
import { Address } from "wagmi";
import { ChainId } from "./utils";
import { Allo } from "./allo";

export type DistributionMatch = {
  projectId: string;
  projectName: string;
  applicationId: string;
  anchorAddress: string;
  matchPoolPercentage: number;
  contributionsCount: number;
  matchAmountInToken: string;
  projectPayoutAddress: string;
  originalMatchAmountInToken: string;
};

export type AddressAndRole = {
  address: string;
  role: string;
  createdAtBlock: string;
  // updatedAtBlock: string;
};

/**
 * Shape of IPFS content of Round RoundMetaPtr
 */
export type RoundMetadata = {
  name: string;
  roundType: RoundVisibilityType;
  eligibility: Eligibility;
  programContractAddress: string;
  support?: {
    info: string;
    type: string;
  };
  reportCardMetadata?: {
    socialPostUrls?: string[];
    statsDescription?: string;
    bannerImg?: string;
    logoImg?: string;
  };
};

export type Application = {
  id: string;
  chainId: string;
  roundId: string;
  projectId: string;
  status: ApplicationStatus;
  totalAmountDonatedInUsd: number;
  totalDonationsCount: string;
  uniqueDonorsCount: number;
  round: {
    strategyName: RoundPayoutType;
    donationsStartTime: string;
    donationsEndTime: string;
    applicationsStartTime: string;
    applicationsEndTime: string;
    roundMetadata: RoundMetadata;
    matchTokenAddress: string;
    tags: string[];
  };
  project: {
    id: string;
    metadata: ProjectMetadata;
    anchorAddress?: string;
  };
  metadata: {
    application: {
      recipient: string;
      answers: GrantApplicationFormAnswer[];
    };
  };
};

export type RoundGetRound = {
  id: string;
  tags: string[];
  chainId: number;
  ownedBy?: string;
  createdAtBlock: number;
  roundMetadataCid: string;
  roundMetadata: RoundMetadataGetRound;
  applicationsStartTime: string;
  applicationsEndTime: string;
  donationsStartTime: string;
  donationsEndTime: string;
  matchAmountInUsd: number;
  matchAmount: string;
  matchTokenAddress: string;
  strategyId: string;
  strategyName: RoundPayoutType;
  strategyAddress: string;
  applications: ApplicationWithId[];
};

export interface RoundMetadataGetRound {
  name: string;
  support?: Support;
  eligibility: Eligibility;
  feesAddress?: string;
  matchingFunds?: MatchingFunds;
  feesPercentage?: number;
  programContractAddress: string;
  quadraticFundingConfig?: QuadraticFundingConfig;
  roundType?: RoundVisibilityType;
  //
}

export type RoundPayoutType =
  | "allov1.Direct"
  | "allov1.QF"
  | "allov2.DirectGrantsSimpleStrategy"
  | "allov2.DonationVotingMerkleDistributionDirectTransferStrategy"
  | ""; // This is to handle the cases where the strategyName is not set in a round, mostly spam rounds
export type RoundVisibilityType = "public" | "private";

export interface Support {
  info: string;
  type: string;
}

export interface MatchingFunds {
  matchingCap: boolean;
  matchingFundsAvailable: number;
}

export interface QuadraticFundingConfig {
  matchingCap: boolean;
  sybilDefense: boolean;
  matchingCapAmount?: number;
  minDonationThreshold: boolean;
  matchingFundsAvailable: number;
  minDonationThresholdAmount?: number;
}

export interface ApplicationWithId {
  id: string;
}

export type RoundForExplorer = Omit<RoundGetRound, "applications"> & {
  applications: (Application & { anchorAddress: Address })[];
  matchingDistribution?: {
    matchingDistribution: DistributionMatch[];
  } | null;
  roles?: AddressAndRole[];
  uniqueDonorsCount?: number;
};

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

export interface PayoutStrategy {
  id: string;
  /**
   * Whether is QUADRATIC FUNDING or DIRECT GRANT
   * MERKLE for QF
   * DIRECT for DG
   */
  strategyName: RoundPayoutType;
}

export interface Round {
  /**
   * The on-chain unique round ID
   */
  id?: string;
  /**
   * The chain ID of the network
   */
  chainId?: number;
  /**
   * Metadata of the Round to be stored off-chain
   */
  roundMetadata?: {
    name: string;
    roundType?: RoundVisibilityType;
    eligibility: Eligibility;
    programContractAddress: string;
    quadraticFundingConfig?: {
      matchingFundsAvailable: number;
      matchingCap: boolean;
      matchingCapAmount?: number;
      minDonationThreshold?: boolean;
      minDonationThresholdAmount?: number;
      sybilDefense?: boolean;
    };
    support?: {
      type: string;
      info: string;
    };
    reportCardMetadata?: {
      socialPostUrls?: string[];
      statsDescription?: string;
      bannerImg?: string;
      logoImg?: string;
    };
  };
  /**
   * Pointer to round metadata in a decentralized storage e.g IPFS, Ceramic etc.
   */
  store?: MetadataPointer;
  /**
   * Pointer to application metadata in a decentralized storage e.g IPFS, Ceramic etc.
   */
  applicationStore?: MetadataPointer;
  /**
   * Helps identifying Round Types from QF and DG
   */
  payoutStrategy: PayoutStrategy;
  /**
   * Voting contract address
   */
  votingStrategy?: string;
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
  ownedBy?: string;
  /**
   * Addresses of wallets that will have admin privileges to operate the Grant program
   */
  operatorWallets?: Array<string>;
  /**
   * List of projects approved for the round
   */
  approvedProjects?: Project[];
  matchingDistribution?: {
    matchingDistribution: DistributionMatch[];
  } | null;
  roles?: AddressAndRole[];
  uniqueDonorsCount?: number;
}

export type AnyJson =
  | boolean
  | number
  | string
  | null
  | undefined
  | JsonArray
  | JsonMap;

interface JsonMap {
  [key: string]: AnyJson;
}
type JsonArray = Array<AnyJson>;

export type ProgressStep = {
  name: string;
  description: string;
  status: ProgressStatus;
};

export type UpdateRoundParams = {
  applicationMetadata?: AnyJson;
  roundMetadata?: AnyJson;
  matchAmount?: BigNumber;
  roundStartTime?: Date;
  roundEndTime?: Date;
  applicationsStartTime?: Date;
  applicationsEndTime?: Date;
};

export enum RoundCategory {
  QuadraticFunding,
  Direct,
}

export enum UpdateAction {
  UPDATE_APPLICATION_META_PTR = "updateApplicationMetaPtr",
  UPDATE_ROUND_META_PTR = "updateRoundMetaPtr",
  UPDATE_ROUND_START_AND_END_TIMES = "updateStartAndEndTimes",
  UPDATE_MATCH_AMOUNT = "updateMatchAmount",
  UPDATE_ROUND_FEE_ADDRESS = "updateRoundFeeAddress",
  UPDATE_ROUND_FEE_PERCENTAGE = "updateRoundFeePercentage",
}

export type UpdateRoundData = {
  roundId: string;
  roundAddress: Hex;
  data: UpdateRoundParams;
  // TODO
  allo: Allo;
  // allo: Allo;
  roundCategory?: RoundCategory;
};

export const dateToEthereumTimestamp = (date: Date): bigint =>
  BigInt(Math.floor(date.getTime() / 1000));

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
  title: string;
  description: string;
  website: string;
  bannerImg?: string;
  logoImg?: string;
  projectTwitter?: string;
  userGithub?: string;
  projectGithub?: string;
  credentials?: any;
  owners: ProjectOwner[];
  createdAt: number;
  lastUpdated: number;
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

/**
 * The project type for v1
 *
 * @remarks
 *
 * This is more of the Application snapshot of the project at the time of the application.
 *
 * @deprecated - This type is deprecated and should not be used for new projects.
 */
export type Project = {
  grantApplicationId: string;
  projectRegistryId: string;
  anchorAddress?: string;
  recipient: string;
  projectMetadata: ProjectMetadata;
  grantApplicationFormAnswers: GrantApplicationFormAnswer[];
  status: ApplicationStatus;
  applicationIndex: number;
};

export function getRoundStrategyTitle(name: string) {
  switch (getRoundStrategyType(name)) {
    case "DirectGrants":
      return "Direct Grants";

    case "QuadraticFunding":
      return "Quadratic Funding";
  }
}

export type RoundStrategyType = "QuadraticFunding" | "DirectGrants";

export function getRoundStrategyType(name: string): RoundStrategyType {
  switch (name) {
    case "allov1.Direct":
    case "DIRECT":
    case "allov2.DirectGrantsSimpleStrategy":
      return "DirectGrants";

    case "allov1.QF":
    case "MERKLE":
    case "allov2.DonationVotingMerkleDistributionDirectTransferStrategy":
      return "QuadraticFunding";

    default:
      throw new Error(`Unknown round strategy type: ${name}`);
  }
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
  tweetURLs: string;
  preamble: string;
  closing: string;
  projects: {
    id: string;
    description: string;
  }[];
  logo?: string;
  banner?: string;
};

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

export type Hex = `0x${string}`;

export type VotingToken = {
  name: string;
  chainId: ChainId;
  address: Hex;
  decimal: number;
  logo?: string;
  default?: boolean;
  redstoneTokenId: string;
  permitVersion?: string;
  //TODO: remove if the previous default was intended to be used as defaultForVoting
  defaultForVoting: boolean;
  //TODO: split PayoutTokens and VotingTokens in
  // 2 different types/lists and remove the following attribute
  canVote: boolean;
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
  USDT: "USDT",
  LUSD: "LUSD",
  MUTE: "MUTE",
  mkUSD: "mkUSD",
  DATA: "DATA",
  USDGLO: "USDGLO",
} as const;
