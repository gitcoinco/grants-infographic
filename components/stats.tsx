import { ReactNode } from "react";
import { Round } from "../api/types";
import { formatAmount } from "../api/utils";
import Card from "./card";

export default function Stats({
  round,
  totalCrowdfunded,
  totalProjects,
  projectsAmount,
  children,
}: {
  round: Round;
  totalCrowdfunded: number;
  totalProjects: number;
  projectsAmount: number[];
  children: ReactNode;
}) {
  const matchingCapPercent =
    round.metadata?.quadraticFundingConfig?.matchingCapAmount || 0;
  const matchingCapValue =
    ((round.metadata?.quadraticFundingConfig?.matchingFundsAvailable ||
      0) *
      (matchingCapPercent || 0)) /
    100;
  const projectsReachedMachingCap: number =
    projectsAmount.filter((amount) => amount >= matchingCapValue)?.length || 0;
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl mb-6">{round.metadata?.name}</h2>
        <div className="grid xl:grid-cols-4 grid-cols-2 gap-4 child:py-2">
          <div>
            <p className="text-orange text-xl pb-2 font-grad">
              ${" "}
              {formatAmount(
                round.metadata?.quadraticFundingConfig
                  ?.matchingFundsAvailable || 0
              )}
            </p>
            <p className="sm:text-base text-sm">Matching Pool</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">
              $ {formatAmount(totalCrowdfunded.toFixed(2))}
            </p>
            <p className="sm:text-base text-sm">Total USD Crowdfunded</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">
              {matchingCapPercent.toFixed()}% (${formatAmount(matchingCapValue)}
              )
            </p>
            <p className="sm:text-base text-sm">Matching Cap</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">
              -{}
              {/* sum of revised contributions divided by the total donations.  */}
            </p>
            <p className="sm:text-base text-sm">Donations Matched</p>
          </div>
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
          <div>
            <p className="text-orange text-xl pb-2 font-grad">
              {projectsReachedMachingCap}
            </p>
            <p className="sm:text-base text-sm">
              {projectsReachedMachingCap == 1 ? "Project" : "Projects"} Reaching
              Matching Cap
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </Card>
  );
}
