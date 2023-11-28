import { ethers } from "ethers";
import {
  getRoundById,
  getProjectsApplications,
  fetchMatchingDistribution,
  getRoundInfo,
  fetchPayoutTokenPrice,
} from "../../../api/round";
import {
  MatchingStatsData,
  PayoutToken,
  ProjectApplication,
  Round,
  RoundInfo,
} from "../../../api/types";
import {
  ChainId,
  defaultIntro,
  payoutTokens,
  sortByMatchAmount,
} from "../../../api/utils";
import RoundPage from "./round-page";
import { Address } from "viem";
import type { Metadata, ResolvingMetadata } from "next";
import { PAGE_DESCRIPTION } from "../../../constants";
import { revalidateTag } from "next/cache";

export interface GrantPageProps {
  params: { chainId: string; roundId: string };
}



// export async function generateMetadata(
//   { params }: GrantPageProps,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   // read route params
//   const roundId = params.roundId;
//   const chainId = params.chainId;

//   // fetch data
//   // const { roundData, roundInfo } = await getData(
//   //   Number(chainId),
//   //   roundId as Address
//   // );
//   // const ogTitle = roundData?.metadata?.name
//   //   ? `${roundData?.metadata?.name} | Gitcoin Round Report Card`
//   //   : `Gitcoin Round Report Cards`;
//   // const ogDescription =
//   //   !roundInfo?.preamble || roundInfo?.preamble == defaultIntro
//   //     ? PAGE_DESCRIPTION
//   //     : `${roundInfo.preamble.slice(0, 150)}...`;

//   return {
//     title: roundData?.metadata?.name,
//     openGraph: {
//       title: ogTitle,
//       description: ogDescription,
//       url: "https://reportcards.gitcoin.co/",
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: ogTitle,
//       description: ogDescription,
//     },
//   };
// }

export default async function Page({
  params: { chainId, roundId },
}: GrantPageProps) {
  // const { roundData, roundInfo, applications } = await getData(
  //   Number(chainId),
  //   roundId as Address
  // );

  // const refetchRoundInfo = async () => {
  //   "use server";
  //   revalidateTag("roundInfo");
  // };
  return (
    <RoundPage
      // roundData={roundData!}
      // allApplications={applications!}
      // roundInfo={roundInfo!}
      chainId={Number(chainId)}
      roundId={roundId as Address}
      // refetchRoundInfo={refetchRoundInfo}
    />
  );
}
