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
  /**
   * Metadata of the Round to be stored off-chain
   */
  roundMetadata?: {
    name: string;
    roundType: string;
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
   * Voting contract address
   */
  votingStrategy: string;
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
  ownedBy: string;
  /**
   * List of projects approved for the round
   */
  approvedProjects?: Project[];
}

export type GrantApplicationFormAnswer = {
  questionId: number;
  question: string;
  answer: string | string[];
  hidden: boolean;
  type?: string;
};

export interface GrantApplication {
  /**
   * The on-chain unique grant application ID
   */
  id: GrantApplicationId;
  /**
   * The round contract address applied to
   */
  round: string;
  /**
   * Recipient wallet address of grantee
   */
  recipient: string;
  /**
   * Project information
   */
  project?: Project;
  /** List of answers to questions */
  answers?: any[];
  /**
   * Pointer to the list of approved/rejected grant applications in a decentralized storage
   * e.g IPFS, Ceramic etc.
   */
  projectsMetaPtr: MetadataPointer;
  /**
   * Status of each grant application
   */
  status?: string;
  /**
   * Index of a grant application
   */
  applicationIndex?: number;
  /**
   * Created timestamp of a grant application
   */
  createdAt: string;
}

export type Project = {
  grantApplicationId: GrantApplicationId;
  projectRegistryId: ProjectRegistryId;
  recipient: recipient;
  projectMetadata: ProjectMetadata;
  grantApplicationFormAnswers: GrantApplicationFormAnswer[];
  status: ApplicationStatus;
  applicationIndex: number;
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
  // credentials?: ProjectCredentials;
  owners: ProjectOwner[];
  createdAt?: number;
};

export enum ProgressStatus {
  IS_SUCCESS = "IS_SUCCESS",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_STARTED = "NOT_STARTED",
  IS_ERROR = "IS_ERROR",
}

export type PayoutToken = {
  name: string;
  chainId: string;
  address: string;
  decimal: number;
  logo?: string;
  default?: boolean;
  redstoneTokenId?: string;
};
