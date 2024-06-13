"use client";
import { useState, useEffect } from "react";

export type MatchingEstimateResult = {
  applicationId: string;
  projectId: string;
  projectName: string;
  contributionsCount: string;
  capOverflow: string;
  matchedWithoutCap: string;
  matchedUSD: number;
  payoutAddress: string;
  totalReceived: bigint;
  sumOfSqrt: bigint;
  matched: bigint;
};

const getRoundMatch = async ({
  chainId,
  roundId,
}: {
  chainId: number;
  roundId: string;
}) => {
  return fetch(
    `https://grants-stack-indexer-v2.gitcoin.co/api/v1/chains/${chainId}/rounds/${roundId}/matches`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    }
  ).then((resp) => {
    if (resp.ok) {
      return resp.json();
    }

    return Promise.reject(resp);
  });
};
export const useRoundMatches = (
  chainId: number,
  roundId: string
): {
  roundMatches?: MatchingEstimateResult[];
  isLoading: boolean;
  getRoundMatchesError?: any;
} => {
  const [matches, setMatches] = useState<
    MatchingEstimateResult[] | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchRoundMatches = async (chainId: number, roundId: string) => {
      try {
        if (roundId) {
          const result = await getRoundMatch({
            roundId,
            chainId,
          });
          setMatches(result);
        }
      } catch (e: any) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoundMatches(chainId, roundId);
  }, [chainId, roundId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    roundMatches: matches,
    isLoading: isLoading,
    getRoundMatchesError: error,
  };
};
