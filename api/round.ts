import { calculateMatch, fetchFromIPFS, graphql_fetch } from "./utils";
import { Address, getAddress } from "viem";
import {
  ApplicationStatus,
  Eligibility,
  MetadataPointer,
  Project,
  ProjectMetadata,
  Round,
} from "./types";

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
  projects: RoundProjectResult[];
}
interface RoundProjectResult {
  id: string;
  project: string;
  status: string | number;
  applicationIndex: number;
  metaPtr: MetadataPointer;
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

export async function getRoundById(
  roundId: string,
  chainId: any
): Promise<{ data: Round | undefined; success: boolean; error: string }> {
  try {
    // get the subgraph for round by $roundId
    const res: GetRoundByIdResult = await graphql_fetch(
      `
        query GetRoundById($roundId: String) {
          rounds(where: {
            id: $roundId
          }) {
            id
            program {
              id
            }
            roundMetaPtr {
              protocol
              pointer
            }
            applicationMetaPtr {
              protocol
              pointer
            }
            applicationsStartTime
            applicationsEndTime
            roundStartTime
            roundEndTime
            token
            votingStrategy
            projectsMetaPtr {
              pointer
            }
            projects(
              first: 1000
              where:{
                status: 1
              }
            ) {
              id
              project
              status
              applicationIndex
              metaPtr {
                protocol
                pointer
              }
            }
          }
        }
      `,
      chainId,
      { roundId }
    );

    const round: RoundResult = res.data.rounds[0];

    const roundMetadata: RoundMetadata = await fetchFromIPFS(
      round.roundMetaPtr.pointer
    );

    round.projects = round.projects.map((project) => {
      return {
        ...project,
        status: convertStatus(project.status),
      };
    });

    // const approvedProjectsWithMetadata = await loadApprovedProjectsMetadata(
    //   round,
    //   chainId
    // );

    return {
      data: {
        id: roundId,
        roundMetadata,
        applicationsStartTime: new Date(
          parseInt(round.applicationsStartTime) * 1000
        ),
        applicationsEndTime: new Date(
          parseInt(round.applicationsEndTime) * 1000
        ),
        roundStartTime: new Date(parseInt(round.roundStartTime) * 1000),
        roundEndTime: new Date(parseInt(round.roundEndTime) * 1000),
        token: round.token,
        votingStrategy: round.votingStrategy,
        ownedBy: round.program.id,
        // approvedProjects: approvedProjectsWithMetadata,
      },
      error: "",
      success: true,
    };
  } catch (error) {
    const err = error as string;
    return { data: undefined, success: false, error: err };
    console.error("getRoundById", error);
    throw Error("Unable to fetch round");
  }
}

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
  round: RoundResult,
  chainId: any
): Promise<Project[]> {
  if (round.projects.length === 0) {
    return [];
  }

  const approvedProjects = round.projects;

  const fetchApprovedProjectMetadata: Promise<Project>[] = approvedProjects.map(
    (project: RoundProjectResult) =>
      fetchMetadataAndMapProject(project, chainId)
  );

  return Promise.all(fetchApprovedProjectMetadata);
}

async function fetchMetadataAndMapProject(
  project: RoundProjectResult,
  chainId: any
): Promise<Project> {
  const applicationData = await fetchFromIPFS(project.metaPtr.pointer);
  // NB: applicationData can be in two formats:
  // old format: { round, project, ... }
  // new format: { signature: "...", application: { round, project, ... } }
  const application = applicationData.application || applicationData;
  const projectMetadataFromApplication = application.project;
  const projectRegistryId = `0x${projectMetadataFromApplication.id}`;
  const projectOwners = await getProjectOwners(chainId, projectRegistryId);

  return {
    grantApplicationId: project.id,
    grantApplicationFormAnswers: application.answers,
    projectRegistryId: project.project,
    recipient: application.recipient,
    projectMetadata: {
      ...projectMetadataFromApplication,
      owners: projectOwners.map((address: string) => ({ address })),
    },
    status: ApplicationStatus.APPROVED,
    applicationIndex: project.applicationIndex,
  };
}

export interface ProjectApplication {
  amountUSD: number;
  createdAtBlock: number;
  id: string;
  metadata: { application: { project: ProjectMetadata } };
  projectId: Address;
  projectNumber: number;
  roundId: string;
  status: string;
  statusUpdatedAtBlock: number;
  uniqueContributors: number;
  votes: number;
  votesArray: ProjectVote[];
  match: number;
}
export const getProjectsApplications = async (roundId: Address, totalRoundMatch: number) => {
  try {
    const resp = await fetch(
      `https://indexer-grants-stack.gitcoin.co/data/1/rounds/${getAddress(
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

    const projects = await loadProjectsVotes(
      roundId,
      approvedData
    );

    const matchedData = calculateMatch(projects, totalRoundMatch);
    return projects;
  } catch (err) {
    console.log(err);
  }
};

async function loadProjectsVotes(
  roundId: Address,
  projects: ProjectApplication[]
): Promise<ProjectApplication[]> {
  if (projects.length === 0) {
    return [];
  }

  const fetchProjectsVotes: Promise<ProjectApplication>[] = projects.map(
    (project: ProjectApplication) =>
      fetchVotesAndMapProject(roundId, project)
  );

  return Promise.all(fetchProjectsVotes);
}

async function fetchVotesAndMapProject(
  roundId: Address,
  project: ProjectApplication,
): Promise<ProjectApplication> {
const votesArray = await getProjectVotes(roundId, project.projectId) || [];
  return {
   ...project,
   votesArray
  };
}

export const getRoundContributors = async (roundId: Address) => {
  try {
    const resp = await fetch(
      `https://indexer-grants-stack.gitcoin.co/data/1/rounds/${getAddress(
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
  projectId: Address
) => {
  try {
    const resp = await fetch(
      `https://indexer-grants-stack.gitcoin.co/data/1/rounds/${getAddress(
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

export const getProjectVotes = async (roundId: Address, projectId: string) => {
  try {
    const resp = await fetch(
      `https://indexer-grants-stack.gitcoin.co/data/1/rounds/${getAddress(
        roundId
      )}/projects/${projectId}/votes.json`,
      {
        method: "GET",
        // headers: {
        //   Accept: "application/json",
        //   "Content-Type": "application/json",
        // },
      }
    );
    const data = await resp.json();
    return data as ProjectVote[];
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