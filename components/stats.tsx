import { ReactNode } from "react";
import { PayoutToken, Round } from "../api/types";
import { formatAmount, payoutTokens } from "../api/utils";
import Card from "./card";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { ethers } from "ethers";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(LocalizedFormat);

export default function Stats({
  round,
  totalCrowdfunded,
  totalProjects,
  // matching value by projects
  projectsTokenAmount,
  children,
  chainId
}: {
  round: Round;
  totalCrowdfunded: number;
  totalProjects: number;
  projectsTokenAmount: number[];
  children: ReactNode;
  chainId: number
}) {
  const matchingFundPayoutToken: PayoutToken = payoutTokens.filter(
    (t) =>
      t.address.toLowerCase() == round.token.toLowerCase() &&
      t.chainId == chainId
  )[0];
 
  const tokenAmount = parseFloat(
    ethers.utils.formatUnits(round.matchAmount, matchingFundPayoutToken.decimal)
  );

  const matchingCapPercent =
    round.metadata?.quadraticFundingConfig?.matchingCapAmount || 0;
  const matchingCapTokenValue =
    ((tokenAmount || 0) * (matchingCapPercent || 0)) / 100;
  const projectsReachedMachingCap: number =
    projectsTokenAmount?.filter((amount) => amount >= matchingCapTokenValue)
      ?.length || 0;

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl mb-6">{round.metadata?.name}</h2>
        <div
          className={`${
            !!matchingCapPercent ? "xl:grid-cols-4" : "xl:grid-cols-3"
          } grid grid-cols-2 gap-4 child:py-2`}
        >
          <div className="flex flex-col justify-between">
            <p className="text-orange text-xl pb-2 font-grad leading-none">
              {formatAmount(tokenAmount, true)} {matchingFundPayoutToken.name}{" "}
              <br />
              (${formatAmount(round.matchingPoolUSD || 0)})
            </p>
            <p className="sm:text-base text-sm">Matching Pool</p>
          </div>
          <div className="flex flex-col justify-between">
            <p className="text-orange text-xl pb-2 font-grad">
              ${formatAmount(totalCrowdfunded.toFixed(2))}
            </p>
            <p className="sm:text-base text-sm">Total USD Crowdfunded</p>
          </div>
          {!!matchingCapPercent && (
            <div className="flex flex-col justify-between">
              <p className="text-orange text-xl pb-2 font-grad">
                {matchingCapPercent.toFixed()}% (
                {formatAmount(matchingCapTokenValue, true)}{" "}
                {matchingFundPayoutToken.name})
              </p>
              <p className="sm:text-base text-sm">Matching Cap</p>
            </div>
          )}
          {!!round.roundEndTime && (
            <div className="flex flex-col justify-between">
              <p className="text-orange text-xl pb-2 font-grad">
                {dayjs.utc(dayjs.unix(Number(round.roundEndTime))).format("YYYY/MM/DD HH:mm")} (UTC)
              </p>
              <p className="sm:text-base text-sm">Round ended on</p>
            </div>
          )}
          <div className="!h-[1px] xl:col-span-4 col-span-2 border-b border-purple"></div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">
              {formatAmount(totalProjects, true)}
            </p>
            <p className="sm:text-base text-sm">Total Projects</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">
              {formatAmount(round.votes, true)}
            </p>
            <p className="sm:text-base text-sm">Total Donations</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">
              {formatAmount(round.uniqueContributors, true)}
            </p>
            <p className="sm:text-base text-sm">Total Donors</p>
          </div>
          {!!matchingCapPercent && (
            <div>
              <p className="text-orange text-xl pb-2 font-grad">
                {projectsReachedMachingCap}
              </p>
              <p className="sm:text-base text-sm">
                {projectsReachedMachingCap == 1 ? "Project" : "Projects"}{" "}
                Reaching Matching Cap
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </Card>
  );
}
