import { ReactNode } from "react";
import { Round } from "../api/types";
import { formatAmount } from "../api/utils";
import Card from "./card";

export default function Stats({round, totalContributions, totalCrowdfunded, totalContributors, totalProjects, children} : {round: Round, totalContributions: number, totalCrowdfunded: number, totalContributors: number, totalProjects: number, children: ReactNode}) {
  const matchingCapPercent = round.roundMetadata?.quadraticFundingConfig?.matchingCapAmount || 0;
  const matchingCapValue =  (round.roundMetadata?.quadraticFundingConfig?.matchingFundsAvailable || 0) * (matchingCapPercent || 0) / 100;
  const projectsReachedMachingCap: number =  0;
  return (
    <Card>
      <div className='flex flex-col gap-4'>
        <h2 className="text-xl mb-6">{round.roundMetadata?.name}</h2>
        <div className="grid xl:grid-cols-4 grid-cols-2 gap-4 child:py-2">
          <div>
            <p className="text-orange text-xl pb-2 font-grad">$ {formatAmount(round.roundMetadata?.quadraticFundingConfig?.matchingFundsAvailable || 0)}</p>
            <p className="sm:text-base text-sm">Matching Pool</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">$ {formatAmount(totalCrowdfunded.toFixed(2))}</p>
            <p className="sm:text-base text-sm">Total USD Crowdfunded</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">{matchingCapPercent.toFixed()}% (${formatAmount(matchingCapValue)})</p>
            <p className="sm:text-base text-sm">Matching Cap</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">-{}</p>
            <p className="sm:text-base text-sm">Donations Matched</p>
          </div>
          <div className="!h-[1px] xl:col-span-4 col-span-2 border-b border-purple"></div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">{formatAmount(totalProjects)}</p>
            <p className="sm:text-base text-sm">Total Projects</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">{formatAmount(totalContributions)}</p>
            <p className="sm:text-base text-sm">Total Donations</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">{formatAmount(totalContributors)}</p>
            <p className="sm:text-base text-sm">Total Donors</p>
          </div>
          <div>
            <p className="text-orange text-xl pb-2 font-grad">{projectsReachedMachingCap}</p>
            <p className="sm:text-base text-sm">{projectsReachedMachingCap == 1 ? 'Project' : 'Projects'} Reaching Matching Cap</p>
          </div>
        </div>
        <div className="flex items-center justify-center">
        {children}
        </div>
      </div>
    </Card>
  )
}