import { GrantPageProps } from "./page";
import { Address } from "viem";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { Application, PayoutToken, Round } from "../../../functions/types";
import { formatAmount, payoutTokens } from "../../../functions/utils";
import { ImageResponse } from "next/server";
import {
  getApplicationsForExplorer,
  getRoundForExplorer,
} from "../../../functions/round";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(LocalizedFormat);

export const runtime = "nodejs";

async function getData(chainId: number, roundId: Address) {
  let roundData: Round | undefined = undefined,
    poolTokenPrice: number | undefined = 0,
    tokenSymbol: string | undefined = "",
    applications: Application[] | undefined = undefined;

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

    // TODO: use JSON file instead of payout tokens
    const matchingFundPayoutToken: PayoutToken = payoutTokens.filter(
      (t) =>
        t.address.toLowerCase() == roundData?.token.toLowerCase() &&
        t.chainId == chainId
    )[0];

    if (!matchingFundPayoutToken) throw new Error("token not found");

    applications = await getApplicationsForExplorer({
      roundId:  roundId.toLowerCase(),
      chainId: chainId,
    });

    poolTokenPrice = matchingFundPayoutToken.redstoneTokenId
      ? await getTokenPrice(matchingFundPayoutToken.redstoneTokenId)
      : undefined;

    tokenSymbol = matchingFundPayoutToken.name;
  } catch (err) {
    console.log(err);
  }
  return { roundData, applications, poolTokenPrice, tokenSymbol };
}

export default async function GET(params: GrantPageProps) {
  const { roundData, applications, poolTokenPrice, tokenSymbol } =
    await getData(
      Number(params.params.chainId),
      params.params.roundId as Address
    );

  if (!roundData) return;

  const tokenAmount =
    roundData.roundMetadata?.quadraticFundingConfig?.matchingFundsAvailable ??
    0;
  const totalUSDCrowdfunded =
    applications
      ?.map((application) => application.totalAmountDonatedInUsd)
      .reduce((acc, amount) => acc + amount, 0) ?? 0;

  const totalDonations =
    applications
      ?.map((application) => application.uniqueDonorsCount)
      .reduce((acc, amount) => acc + amount, 0) ?? 0;

  const matchingPoolUSD = poolTokenPrice
    ? Number(poolTokenPrice) * tokenAmount
    : undefined;
  const matchingCapPercent =
    roundData.roundMetadata?.quadraticFundingConfig?.matchingCapAmount ?? 0;
  const matchingCapTokenValue = (tokenAmount * matchingCapPercent) / 100;

  const currentTime = new Date();
  const isAfterRoundEndDate = roundData.roundEndTime <= currentTime;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          fontSize: 20,
          fontWeight: 600,
          padding: "20px",
          display: "flex",
          backgroundColor: "#FFFFFF",
          flexDirection: "column",
          borderRadius: "4px",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "32px",
            justifyContent: "center",
            padding: "30px",
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 style={{ marginBottom: "40px", marginTop: "10px", fontSize: 26 }}>
            {roundData.roundMetadata?.name}
          </h2>
          <div
            style={{
              justifyContent: "center",
              display: "flex",
              width: "100%",
            }}
          ></div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                maxWidth: "100%",
                marginBottom: "36px",
                marginTop: "40px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 18,
                  borderRadius: "32px",
                  padding: "24px",
                  backgroundColor: "#F3F3F5",
                  width: "33.33%",
                }}
              >
                <p style={{ fontSize: 28, maxWidth: 160 }}>
                  {formatAmount(tokenAmount, true)} {tokenSymbol} {`\n\n`}
                  {matchingPoolUSD
                    ? `($${formatAmount(matchingPoolUSD ?? 0)})`
                    : ""}
                </p>

                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#757087" }}
                >
                  Matching Pool
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 18,
                  borderRadius: "32px",
                  padding: "24px",
                  backgroundColor: "#F3F3F5",
                  justifyContent: "space-between",
                  width: "33.33%",
                }}
              >
                <p style={{ fontSize: 28 }}>
                  ${formatAmount(totalUSDCrowdfunded.toFixed(2))}
                </p>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#757087" }}
                >
                  Total USD Crowdfunded
                </span>
              </div>

              {!!matchingCapPercent ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: 18,
                    borderRadius: "32px",
                    padding: "24px",
                    backgroundColor: "#F3F3F5",
                    justifyContent: "space-between",
                    width: "33.33%",
                  }}
                >
                  <p style={{ fontSize: 28 }}>
                    {matchingCapPercent.toFixed()}% {`\n\n`}(
                    {formatAmount(matchingCapTokenValue, true)} {tokenSymbol})
                  </p>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#757087",
                    }}
                  >
                    Matching Cap
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    fontSize: 18,
                    borderRadius: "32px",
                    padding: "24px",
                    backgroundColor: "#F3F3F5",
                    width: "33.33%",
                  }}
                >
                  <p style={{ fontSize: 28 }}>
                    {dayjs
                      .utc(roundData?.roundEndTime)
                      .format("YYYY/MM/DD HH:mm")}{" "}
                    (UTC)
                  </p>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: "#757087" }}
                  >
                    {isAfterRoundEndDate ? "Round ended on" : "Round ends on"}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                maxWidth: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 18,
                  borderRadius: "32px",
                  padding: "24px",
                  backgroundColor: "#F3F3F5",
                  width: "33.33%",
                }}
              >
                <p style={{ fontSize: 28 }}>
                  {formatAmount(applications?.length ?? 0, true)}
                </p>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#757087" }}
                >
                  Total Projects
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 18,
                  borderRadius: "32px",
                  padding: "24px",
                  backgroundColor: "#F3F3F5",
                  width: "33.33%",
                }}
              >
                <p style={{ fontSize: 28 }}>
                  {formatAmount(totalDonations, true)}
                </p>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#757087" }}
                >
                  Total Donations
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 18,
                  borderRadius: "32px",
                  padding: "24px",
                  backgroundColor: "#F3F3F5",
                  width: "33.33%",
                }}
              >
                <p style={{ fontSize: 28 }}>
                  {formatAmount(roundData.uniqueDonorsCount ?? 0, true)}
                </p>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#757087" }}
                >
                  Total Donors
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 600,
      // fonts: [
      //   {
      //     data: await readFile(join(__dirname, "../fonts/Outfit-Regular.ttf")),
      //     name: "Outfit",
      //     style: "normal",
      //     weight: 400,
      //   },
      // ],
    }
  );
}

const getTokenPrice = async (tokenId: string) => {
  let tokenPrice: number | undefined = undefined;
  const tokenPriceEndpoint = `https://api.redstone.finance/prices?symbol=${tokenId}&provider=redstone&limit=1`;
  try {
    await fetch(tokenPriceEndpoint)
      .then((resp) => {
        if (resp.ok) {
          return resp.json();
        } else {
          return resp.text().then((text) => {
            throw new Error(text);
          });
        }
      })
      .then((data) => {
        if (data && data.length > 0) {
          tokenPrice = data[0].value;
        } else {
          throw new Error(`No data returned: ${data.toString()}`);
        }
      });
  } catch (err) {
    console.log("error fetching token price", {
      tokenId,
      tokenPriceEndpoint,
      err,
    });
  }
  return tokenPrice;
};
