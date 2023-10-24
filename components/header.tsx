import { useCallback, useContext, useEffect, useState } from "react";
import gitcoinLogo from "/assets/gitcoin-logo.svg";
import heroBg from "/assets/hero-bg.svg";
import Image from "next/image";
import filtersContext from "../contexts/filtersContext";
import { CHAINS } from "../api/utils";
import roundsContext from "../contexts/roundsContext";
import { Round } from "../api/types";
import { useRouter } from "next/router";
import { Address } from "viem";
import { getRoundsByChainId } from "../api/round";
import Select, {
  components,
  OptionProps,
  ValueContainerProps,
  Props as SelectProps,
  SingleValue,
} from "react-select";

type OptionType = {
  value: string;
  label: string;
};

export default function Header() {
  const { filters, setFilters } = useContext(filtersContext);
  const { setRounds, setRoundsLoading, roundsLoading } =
    useContext(roundsContext);
  const [newFilters, setNewFilters] = useState(filters);
  const router = useRouter();
  const chains: OptionType[] =
    Object.values(CHAINS).map((chain) => {
      return {
        value: `${chain?.id}` || "1",
        label: chain?.name || "",
      };
    }) || [];

  const [roundOptions, setRoundOptions] = useState<OptionType[]>([]);
  const [allRounds, setAllRounds] = useState<Round[]>();

  const getRounds = useCallback(async (chainId: string) => {
    if (!chainId) return;
    try {
      const { data, error, success } = await getRoundsByChainId(
        Number(chainId)
      );
      if (!success) throw new Error(error);
      return data;
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    if (!filters || !roundsLoading) return;
    const init = async () => {
      setNewFilters(filters);
      if (!filters.chainId) return;
      const data = await getRounds(filters.chainId);
      setAllRounds(data);
      setRounds(data);
      setRoundsLoading(false);
    };
    init();
  }, [filters]);

  useEffect(() => {
    setRoundOptions(
      allRounds?.map((round) => {
        return {
          value: round.id || "",
          label: round.metadata?.name || "",
        };
      }) || []
    );
  }, [allRounds]);

  const handleChainChange = async (option: SingleValue<OptionType>) => {
    setNewFilters({ ...newFilters, chainId: option?.value || "" });
    if (!option?.value) return;
    const data = await getRounds(option.value);
    setAllRounds(data);
  };

  const handleRoundChange = (option: SingleValue<OptionType>) => {
    setNewFilters({ ...newFilters, roundId: option?.value });
    setFilters(newFilters);
    setRounds(allRounds);
    router.push(`/${newFilters.chainId}/${option?.value}`);
  };

  return (
    <header className="flex justify-between p-6 sm:flex-row flex-col gap-2">
      <Image src={gitcoinLogo} alt="gitcoin logo" width="89" height="30" />
      <div className="flex items-center gap-4 flex-wrap">
        <Select
          value={chains.find((chain) => chain.value == newFilters.chainId)}
          onChange={(option) => handleChainChange(option)}
          options={chains || []}
          className="w-40"
        />

        <Select
          isSearchable
          options={roundOptions || []}
          onChange={(option) => handleRoundChange(option)}
          value={roundOptions.find(
            (round) => round.value == newFilters.roundId
          )}
          placeholder="Select a round"
          className="w-60"
        />
      </div>
      {/* <ConnectButton /> */}
    </header>
  );
}
