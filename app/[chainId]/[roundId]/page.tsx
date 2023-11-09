import { ethers } from "ethers";
import {
  getRoundById,
  getProjectsApplications,
  fetchMatchingDistribution,
  getRoundInfo,
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

async function getData(chainId: number, roundId: Address) {
  let roundData: Round | undefined = undefined,
    roundInfo: RoundInfo | undefined = undefined,
    applications:
      | (ProjectApplication & { matchingData?: MatchingStatsData })[]
      | undefined = undefined;

  try {
    const { data } = await getRoundById(chainId, roundId);
    if (!data?.metadata?.quadraticFundingConfig?.matchingFundsAvailable)
      throw new Error("No round metadata");
    const matchingFundPayoutToken: PayoutToken = payoutTokens.filter(
      (t) => t.address.toLowerCase() == data?.token.toLowerCase()
    )[0];
    const tokenAmount = parseFloat(
      ethers.utils.formatUnits(
        data.matchAmount,
        matchingFundPayoutToken.decimal
      )
    );
    const rate = data.matchAmountUSD / tokenAmount;
    const matchingPoolUSD =
      data.metadata?.quadraticFundingConfig?.matchingFundsAvailable * rate;
    roundData = { ...data, matchingPoolUSD, rate, matchingFundPayoutToken };

    // applications data
    applications = await getProjectsApplications(roundId, chainId);
    if (!applications) throw new Error("No applications");

    // ipfs round data
    const {
      data: roundInfoData,
      error: roundInfoErr,
      success: roundInfoSuccess,
    } = await getRoundInfo(roundId);
    if (!roundInfoSuccess) throw new Error(roundInfoErr);
    const formattedRoundInfo = roundInfoData?.preamble
      ? {
          ...roundInfoData,
          preamble: roundInfoData.preamble
            .replace(/<\/?p[^>]*>/g, "")
            .replaceAll("<br>", "\n"),
        }
      : roundInfoData;
    roundInfo = formattedRoundInfo;
  } catch (err) {
    console.log(err);
  }
  return { roundData, roundInfo, applications };
}

export async function generateMetadata(
  { params }: GrantPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const roundId = params.roundId;
  const chainId = params.chainId;

  // fetch data
  const { roundData, roundInfo } = await getData(
    Number(chainId),
    roundId as Address
  );
  const ogTitle = roundData?.metadata?.name
    ? `${roundData?.metadata?.name} | Gitcoin Round Report Card`
    : `Gitcoin Round Report Cards`;
  const ogDescription =
    !roundInfo?.preamble || roundInfo?.preamble == defaultIntro
      ? PAGE_DESCRIPTION
      : `${roundInfo.preamble.slice(0, 150)}...`;

  return {
    title: roundData?.metadata?.name,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: "https://reportcards.gitcoin.co/",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  };
}

export default async function Page({
  params: { chainId, roundId },
}: GrantPageProps) {
  const { roundData, roundInfo, applications } = await getData(
    Number(chainId),
    roundId as Address
  );

  const refetchRoundInfo = async () => {
    "use server";
    revalidateTag("roundInfo");
  };
  return (
      <RoundPage
        roundData={roundData!}
        allApplications={applications!}
        roundInfo={roundInfo!}
        chainId={Number(chainId)}
        roundId={roundId}
        refetchRoundInfo={refetchRoundInfo}
      />
  );
}
