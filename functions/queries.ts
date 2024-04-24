import { gql } from "graphql-request";

export const getApplicationsForExplorerQuery = gql`
  query Applications($chainId: Int!, $roundId: String!) {
    applications(
      first: 1000
      condition: { chainId: $chainId, roundId: $roundId, status: APPROVED }
    ) {
      id
      chainId
      roundId
      projectId
      status
      totalAmountDonatedInUsd
      uniqueDonorsCount
      totalDonationsCount
      round {
        strategyName
        donationsStartTime
        donationsEndTime
        applicationsStartTime
        applicationsEndTime
        matchTokenAddress
        roundMetadata
      }
      metadata
      project: canonicalProject {
        tags
        id
        metadata
        anchorAddress
      }
    }
  }
`;

export const getRoundForExplorerQuery = gql`
  query getRoundForExplorer($roundId: String!, $chainId: Int!) {
    rounds(
      first: 1
      filter: { id: { equalTo: $roundId }, chainId: { equalTo: $chainId } }
    ) {
      id
      chainId
      roles {
        address
        role
        createdAtBlock
      }
      matchingDistribution
      uniqueDonorsCount
      applicationsStartTime
      applicationsEndTime
      donationsStartTime
      donationsEndTime
      matchTokenAddress
      roundMetadata
      roundMetadataCid
      applicationMetadata
      applicationMetadataCid
      strategyId
      projectId
      strategyAddress
      strategyName
      readyForPayoutTransaction
      applications(first: 1000, filter: { status: { equalTo: APPROVED } }) {
        id
        projectId
        status
        metadata
        anchorAddress
        project: canonicalProject {
          id
          metadata
          anchorAddress
        }
      }
    }
  }
`;
export const getApplicationQuery = gql`
  query Application(
    $chainId: Int!
    $applicationId: String!
    $roundId: String!
  ) {
    application(chainId: $chainId, id: $applicationId, roundId: $roundId) {
      id
      chainId
      roundId
      projectId
      status
      totalAmountDonatedInUsd
      uniqueDonorsCount
      totalDonationsCount
      round {
        strategyName
        donationsStartTime
        donationsEndTime
        applicationsStartTime
        applicationsEndTime
        matchTokenAddress
        roundMetadata
      }
      metadata
      project: canonicalProject {
        tags
        id
        metadata
        anchorAddress
      }
    }
  }
`;
