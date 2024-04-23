import { Address } from "viem";
import { getRoundForExplorer } from "../../../functions/round";
import { Application, Round } from "../../../functions/types";
import ViewRoundStats from "./round-page";
import { Metadata, ResolvingMetadata } from "next";
import { PAGE_DESCRIPTION } from "../../../constants";

export interface GrantPageProps {
  params: { chainId: string; roundId: string };
  searchParams: { search: string | undefined };
}

async function getData(chainId: number, roundId: Address) {
  let roundData: Round | undefined = undefined;

  try {
    const result = await getRoundForExplorer({
      chainId: Number(chainId),
      roundId: roundId.toLowerCase() as string,
    });
    if (!result || !result?.round) throw new Error("round not found");

    roundData = result?.round;
    const currentTime = new Date();
    const isBeforeRoundStartDate =
      roundData && roundData.roundStartTime >= currentTime;
    if (isBeforeRoundStartDate) throw new Error("round has not started yet");
  } catch (err) {
    console.log(err);
  }
  return { roundData };
}

export async function generateMetadata(
  { params }: GrantPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const roundId = params.roundId;
  const chainId = params.chainId;

  // fetch data
  const { roundData } = await getData(Number(chainId), roundId as Address);
  const ogTitle = roundData?.roundMetadata?.name
    ? `${roundData.roundMetadata?.name} | Gitcoin Round Report Card`
    : `Gitcoin Round Report Cards`;
  const ogDescription = !roundData?.roundMetadata?.reportCardMetadata
    ?.statsDescription?.length
    ? PAGE_DESCRIPTION
    : `${roundData.roundMetadata.reportCardMetadata.statsDescription.slice(
        0,
        150
      )}...`;

  return {
    title: roundData?.roundMetadata?.name,
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
  searchParams: { search },
}: GrantPageProps) {
  return (
    <>
      <ViewRoundStats chainId={Number(chainId)} roundId={roundId} />
    </>
  );
}
