"use client";
import { getRoundForExplorer } from "../api/round";
import { Round } from "../api/types";
import React, { useState, useEffect } from "react";

export const useRoundById = (
  chainId: number,
  roundId: string
): {
  round?: Round;
  isLoading: boolean;
  getRoundByIdError?: any;
} => {
  const [round, setRound] = useState<Round | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchRound = async (chainId: number, roundId: string) => {
      try {
        if (roundId) {
          const result = await getRoundForExplorer({
            roundId,
            chainId,
          });
          setRound(result?.round);
        }
      } catch (e: any) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRound(chainId, roundId);
  }, [chainId, roundId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    round: round,
    isLoading: isLoading,
    getRoundByIdError: error,
  };
};
