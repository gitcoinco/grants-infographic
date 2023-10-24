import { createContext } from "react";

export type Filters = {
  chainId: string | undefined;
  roundId: string | undefined;
};

const filtersContext = createContext({
  filters: {
    chainId: undefined,
    roundId: undefined,
  } as Filters,
  setFilters: (filters: Filters) => {
    filters = filters;
  },
});

export default filtersContext;
