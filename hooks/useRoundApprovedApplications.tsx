import useSWR from "swr";
import { getApplicationsForExplorer } from "../functions/round";

type Params = {
  chainId?: number;
  roundId?: string;
};

export function useRoundApprovedApplications(params: Params) {
  const shouldFetch = Object.values(params).every(Boolean);
  return useSWR(
    shouldFetch ? ["allApprovedApplications", params] : null,
    async () => {
      if (params.chainId === undefined || params.roundId === undefined) {
        return null;
      }
      return await getApplicationsForExplorer({
        roundId: params.roundId,
        chainId: params.chainId,
      });
    }
  );
}
