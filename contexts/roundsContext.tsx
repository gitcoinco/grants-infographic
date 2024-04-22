"use client";

import { createContext } from "react";
import { Round } from "../api/types";

export type Filters = {
  chainId: number;
  roundId: string | undefined;
};

const roundsContext = createContext({
  rounds: undefined as Round[] | undefined,
  setRounds: (rounds: Round[] | undefined) => {
    rounds = rounds;
  },
  roundsLoading: true,
  setRoundsLoading: (roundsLoading: boolean) => {
    roundsLoading = roundsLoading;
  },
});

export default roundsContext;
