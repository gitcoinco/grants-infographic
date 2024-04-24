import { Address } from "viem";
import { Application, Project, Round, RoundForExplorer } from "./types";
import { request } from "graphql-request";
import { getApplicationQuery, getApplicationsForExplorerQuery, getRoundForExplorerQuery } from "./queries";

const gsIndexerEndpoint = `${
  process.env.NEXT_PUBLIC_INDEXER_V2_API_URL ?? ""
}/graphql`;
export async function getApplication({
  roundId,
  chainId,
  applicationId,
}: {
  roundId: Lowercase<Address> | string;
  chainId: number;
  applicationId: string;
}): Promise<Application | null> {
  const requestVariables = {
    roundId,
    chainId,
    applicationId,
  };

  const response: { application: Application } = await request(
    gsIndexerEndpoint,
    getApplicationQuery,
    requestVariables
  );

  return response.application ?? null;
}
export async function getApplicationsForExplorer({
  roundId,
  chainId,
}: {
  roundId: string;
  chainId: number;
}): Promise<Application[]> {
  const requestVariables = {
    roundId,
    chainId,
  };

  const response: { applications: Application[] } = await request(
    gsIndexerEndpoint,
    getApplicationsForExplorerQuery,
    requestVariables
  );

  return response.applications ?? [];
}

export async function getRoundForExplorer({
  roundId,
  chainId,
}: {
  roundId: string;
  chainId: number;
}): Promise<{ round: Round } | null> {
  const requestVariables = {
    roundId,
    chainId,
  };

  const response: { rounds: RoundForExplorer[] } = await request(
    gsIndexerEndpoint,
    getRoundForExplorerQuery,
    requestVariables
  );
  if (response.rounds.length === 0) {
    return null;
  }

  const round = response.rounds[0];

  const projects: Project[] = round.applications.flatMap((application) => {
    if (application.project === null) {
      console.error(`Project not found for application ${application.id}`);
      return [];
    }

    return [
      {
        grantApplicationId: application.id,
        projectRegistryId: application.projectId,
        anchorAddress: application.anchorAddress,
        recipient: application.metadata.application.recipient,
        projectMetadata: {
          title: application.project.metadata.title,
          description: application.project.metadata.description,
          website: application.project.metadata.website,
          logoImg: application.project.metadata.logoImg,
          bannerImg: application.project.metadata.bannerImg,
          projectTwitter: application.project.metadata.projectTwitter,
          userGithub: application.project.metadata.userGithub,
          projectGithub: application.project.metadata.projectGithub,
          credentials: application.project.metadata.credentials,
          owners: application.project.metadata.owners,
          createdAt: application.project.metadata.createdAt,
          lastUpdated: application.project.metadata.lastUpdated,
        },
        grantApplicationFormAnswers:
          application.metadata.application.answers.map((answer) => ({
            questionId: answer.questionId,
            question: answer.question,
            answer: answer.answer,
            hidden: answer.hidden,
            type: answer.type,
          })),
        status: application.status,
        applicationIndex: Number(application.id),
      },
    ];
  });

  return {
    round: {
      id: round.id,
      chainId: round.chainId,
      applicationsStartTime: new Date(round.applicationsStartTime),
      applicationsEndTime: new Date(round.applicationsEndTime),
      roundStartTime: new Date(round.donationsStartTime),
      roundEndTime: new Date(round.donationsEndTime),
      token: round.matchTokenAddress,
      ownedBy: round.ownedBy,
      roundMetadata: round.roundMetadata,
      payoutStrategy: {
        id: round.strategyAddress,
        strategyName: round.strategyName,
      },
      approvedProjects: projects,
      uniqueDonorsCount: round.uniqueDonorsCount,
      matchingDistribution: round.matchingDistribution,
      roles: round.roles,
    },
  };
}
