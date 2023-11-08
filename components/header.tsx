"use client";
import { useCallback, useEffect, useState } from "react";
import gitcoinLogo from "/assets/gitcoin-logo.svg";
import heroBg from "/assets/hero-bg.svg";
import Image from "next/image";
import filtersContext from "../contexts/filtersContext";
import { CHAINS, isTestnet } from "../api/utils";
import roundsContext from "../contexts/roundsContext";
import { Round } from "../api/types";
import { usePathname, useRouter } from "next/navigation";
import { Address } from "viem";
import { getRoundsByChainId } from "../api/round";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Select, { Props as SelectProps, SingleValue } from "react-select";
import dayjs from "dayjs";

type OptionType = {
  value: string;
  label: string;
};

export default function Header() {
  const pathname = usePathname();
  const [filters, setFilters] = useState({
    chainId: pathname?.split("/")[1] as string,
    roundId: pathname?.split("/")[2] as string,
  });

  const [newFilters, setNewFilters] = useState({
    chainId: pathname?.split("/")[1] as string,
    roundId: pathname?.split("/")[2] as string,
  });

  useEffect(() => {
    const newChainId = pathname?.split("/")[1] as string;
    const newRoundId = pathname?.split("/")[2] as string;

    if (!newChainId) return;
    const init = async () => {
      if (!!allRounds?.length) return;
      const data = await getRounds(newChainId);
      setAllRounds(data);
    };

    init();

    if (filters.roundId) return;
    setNewFilters({
      chainId: newChainId,
      roundId: newRoundId,
    });
    !filters.roundId &&
      setFilters({
        chainId: newChainId,
        roundId: newRoundId,
      });
  }, [pathname]);

  const router = useRouter();
  const chains: OptionType[] =
    Object.values(CHAINS)
      .filter((chain) => !isTestnet(chain?.id!))
      .map((chain) => {
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

      const filteredData = data?.filter(
        (round) =>
          !!round.metadata?.name &&
          !!round.metadata.quadraticFundingConfig?.matchingFundsAvailable &&
          !!round.votes &&
          !round.metadata?.name.toLowerCase().includes("test") &&
          round.amountUSD > 50
        // && dayjs.unix(Number(round.roundEndTime)).isAfter(dayjs(minDate))
      );
      return filteredData;
    } catch (err) {
      console.log(err);
    }
  }, []);

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
    router.push(`/${newFilters.chainId}/${option?.value}`);
    setNewFilters({ ...newFilters, roundId: option?.value! });
    setFilters({ ...newFilters, roundId: option?.value! });
  };

  return (
    <header className="flex justify-between p-6 sm:flex-row flex-col gap-2 z-[100]">
      <Image src={gitcoinLogo} alt="gitcoin logo" width="89" height="30" />
      <div className="flex items-center gap-4 flex-wrap">
        <Select
          value={chains.find((chain) => chain.value == newFilters.chainId)}
          onChange={(option) => handleChainChange(option)}
          options={chains || []}
          className="w-40 z-[99]"
        />

        <Select
          isSearchable
          options={roundOptions || []}
          onChange={(option) => handleRoundChange(option)}
          value={roundOptions.find(
            (round) => round.value == newFilters.roundId
          )}
          placeholder="Select a round"
          className="w-60 z-[99]"
        />
      </div>
      <ConnectButton />
    </header>
  );
}
