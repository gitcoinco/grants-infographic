import useSWR from "swr";
import { Application } from "../functions/types";
import { getApplication } from "../functions/round";

type Params = {
  chainId?: number;
  roundId?: string;
  projectIds?: string[];
};

export function useRoundApprovedApplications(params: Params) {
  const shouldFetch = Object.values(params).every(Boolean);
  return useSWR(
    shouldFetch ? ["allApprovedApplications", params] : null,
    async () => {
      const validatedParams = (projectId: string) => {
        return {
          chainId: params.chainId as number,
          roundId: params.roundId as string,
          applicationId: projectId as string,
        };
      };
      if (!params.projectIds) return;

      const arr = params.projectIds?.map((projectId) => {
        return getApplication(validatedParams(projectId));
      });
      return Promise.all(arr).then(
        (applications) =>
          applications.filter(
            (application) => application?.status === "APPROVED"
          ) as Application[] | undefined
      );
    }
  );
}
