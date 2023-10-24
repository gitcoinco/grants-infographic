import { createContext } from "react";

export type Filters = {
  chainId: string;
  roundId: string | undefined;
};

const filtersContext = createContext({
  filters: {
    chainId: '1',
    roundId: undefined,
  } as Filters,
  setFilters: (filters: Filters) => {
    filters = filters;
  },
});

export default filtersContext;
