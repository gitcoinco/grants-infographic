import type { NextPage } from "next";
import { Address, useAccount, useSignMessage, useWalletClient } from "wagmi";
import { useContext, useEffect, useRef, useState } from "react";
import {
  fetchMatchingDistribution,
  getProjectsApplications,
  getRoundContributors,
  getRoundInfo,
} from "../../api/round";
import {
  MatchingStatsData,
  PayoutToken,
  Project,
  ProjectApplication,
  Round,
  RoundInfo,
} from "../../api/types";
import { useRouter } from "next/router";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import ProjectCard from "../../components/project-card";
import Stats from "../../components/stats";
import Card from "../../components/card";
import Link from "next/link";
import projectsDivider from "/assets/projects-divider.svg";
import downloadIcon from "../../assets/download-icon.svg";
import editIcon from "../../assets/edit-icon.svg";
import { COMMUNITY_ROUND_ADDRESS } from "../../constants/community-round";
const pinataSDK = require("@pinata/sdk");
const pinata = new pinataSDK({
  pinataJWTKey: process.env.NEXT_PUBLIC_PINATA_JWT,
});
import dynamic from "next/dynamic";
import {
  ChainId,
  fetchFromIPFS,
  formatAmount,
  getRoundById,
  payoutTokens,
  pinToIPFS,
  sortByMatchAmount,
} from "../../api/utils";
import Editor from "../../components/editor";
import WysiwygRender from "../../components/wysiwygRender";
import { ethers } from "ethers";
import roundsContext from "../../contexts/roundsContext";
import filtersContext from "../../contexts/filtersContext";
import roundImplementationAbi from "../../api/abi/roundImplementation";

const GrantPlot = dynamic(import("../../components/grant-plot"), {
  ssr: false,
});

const Home: NextPage = () => {
  const { isConnected, address } = useAccount();

  const { rounds, roundsLoading } = useContext(roundsContext);
  const { setFilters } = useContext(filtersContext);
  const [isRoundOperator, setIsRoundOperator] = useState(false);
  const {
    data: signData,
    isError: isSignError,
    isLoading: isSignLoading,
    isSuccess: isSignSuccess,
    signMessage,
  } = useSignMessage({
    message: "Prove ownership as round operator",
  });

  useEffect(() => {
    if (!signData && !isSignLoading && isRoundOperator && !isSignError) {
      signMessage();
    }
  }, [signData, isRoundOperator, isSignLoading, isSignError, signMessage]);

  const [roundData, setRoundData] = useState<Round>();
  const [roundInfo, setRoundInfo] = useState<RoundInfo>();
  const [isUploading, setUploading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageError, setPageError] = useState({ value: false, message: "" });
  const reportTemplateRef = useRef(null);
  const [applications, setApplications] =
    useState<(ProjectApplication & { matchingData?: MatchingStatsData })[]>();
  const router = useRouter();
  const [id, setId] = useState(router.query.grantId as Address);
  const [chainId, setChainId] = useState(
    Number(router.query.chainId as string)
  );

  useEffect(() => {
    setId(router.query.grantId as Address);
    setChainId(Number(router.query.chainId as string));
  }, [router.query.grantId, router.query.chainId]);

  useEffect(() => {
    if (id && chainId) {
      setFilters({ chainId: chainId.toString(), roundId: id });
    }
  }, [id, chainId]);

  useEffect(() => {
    if (roundsLoading) return;
    const get = async (roundId: Address) => {
      try {
        setIsPageLoading(true);

        // round data
        const data = rounds ? getRoundById(rounds, roundId) : undefined;
        console.log(data);
        if (!data?.metadata?.quadraticFundingConfig?.matchingFundsAvailable)
          throw new Error("No round metadata");
        const matchingFundPayoutToken: PayoutToken = payoutTokens.filter(
          (t) => t.address.toLowerCase() == data?.token.toLowerCase()
        )[0];

        const tokenAmount = parseFloat(
          ethers.utils.formatUnits(
            data.matchAmount,
            matchingFundPayoutToken.decimal
          )
        );
        const rate = data.matchAmountUSD / tokenAmount;
        const matchingPoolUSD =
          data.metadata?.quadraticFundingConfig?.matchingFundsAvailable * rate;
        setRoundData({ ...data, matchingPoolUSD, rate });
        setPageError({ value: false, message: "" });

        // applications data
        let applications:
          | (ProjectApplication & { matchingData?: MatchingStatsData })[]
          | undefined = await getProjectsApplications(roundId, chainId);

        if (!applications) throw new Error("No applications");

        // matching data
        const signerOrProvider =
          chainId == ChainId.PGN
            ? new ethers.providers.JsonRpcProvider(
                "https://rpc.publicgoods.network",
                chainId
              )
            : chainId == ChainId.FANTOM_MAINNET_CHAIN_ID
            ? new ethers.providers.JsonRpcProvider(
                "https://rpcapi.fantom.network/",
                chainId
              )
            : new ethers.providers.InfuraProvider(
                chainId,
                process.env.NEXT_PUBLIC_INFURA_API_KEY
              );

        const matchingData = await fetchMatchingDistribution(
          roundId,
          signerOrProvider,
          matchingFundPayoutToken,
          matchingPoolUSD
        );
        applications = applications?.map((app) => {
          const projectMatchingData = matchingData?.find(
            (data) => data.projectId == app.projectId
          );
          return {
            ...app,
            matchingData: projectMatchingData,
          };
        });
        const sorted = sortByMatchAmount(applications || []);
        setApplications(sorted);

        // ipfs round data
        const {
          data: roundInfo,
          error: roundInfoErr,
          success: roundInfoSuccess,
        } = await getRoundInfo(roundId);
        if (!roundInfoSuccess) throw new Error(roundInfoErr);

        setRoundInfo(roundInfo);
      } catch (err) {
        console.log(err);
        setPageError({ value: true, message: err + "An error occured." });
      } finally {
        setIsPageLoading(false);
      }
    };
    id
      ? get(id)
      : () => {
          setIsPageLoading(false);
          setPageError({ value: true, message: "Grant not found" });
        };
  }, [id, rounds, chainId, roundsLoading]);

  useEffect(() => {
    if (!address || !isConnected || !chainId) return;

    const signerOrProvider =
      chainId == ChainId.PGN
        ? new ethers.providers.JsonRpcProvider(
            "https://rpc.publicgoods.network",
            chainId
          )
        : chainId == ChainId.FANTOM_MAINNET_CHAIN_ID
        ? new ethers.providers.JsonRpcProvider(
            "https://rpcapi.fantom.network/",
            chainId
          )
        : new ethers.providers.InfuraProvider(
            chainId,
            process.env.NEXT_PUBLIC_INFURA_API_KEY
          );
    const get = async () => {
      const roundImplementation = new ethers.Contract(
        id,
        roundImplementationAbi,
        signerOrProvider
      );
      const operatorRole = await roundImplementation.ROUND_OPERATOR_ROLE();

      const hasRole = await roundImplementation.hasRole(operatorRole, address);
      setIsRoundOperator(hasRole);
    };
    get();
  }, [address, id, chainId]);

  const createPDF = useReactToPrint({
    content: () => reportTemplateRef.current,
  });

  const uploadRoundInfo = async (body: RoundInfo, roundId: string) => {
    try {
      setUploading(true);
      const res = await pinToIPFS(JSON.stringify(body), roundId);
      // const ipfsHash = await res.text();
    } catch (e) {
      console.log(e);
      alert("Trouble uploading file");
    } finally {
      const { data, error, success } = await getRoundInfo(roundId);
      if (!success) throw new Error(error);

      setRoundInfo(data);
      setIsEditorOpen(false);
      setUploading(false);
    }
  };

  const defaultRoundInfo = {
    preamble:
      "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.",
    closing:
      "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.",
    projects: [],
  };
  const [newRoundInfo, setNewRoundInfo] = useState<RoundInfo>(defaultRoundInfo);

  useEffect(() => {
    if (roundInfo) {
      setNewRoundInfo(roundInfo);
    } else {
      setNewRoundInfo({
        preamble:
          "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.",
        closing:
          "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.",
        projects:
          applications?.slice(0, 10)?.map((ap) => {
            return {
              id: ap.projectId,
              description: ap.metadata.application.project.description,
            };
          }) || [],
      });

      const x = JSON.stringify(newRoundInfo, undefined, 2);
    }
  }, [roundInfo, applications]);

  return (
    <div>
      {isPageLoading ? (
        <p>Loading...</p>
      ) : !id ? (
        <>
          <p>
            Grant not found.{" "}
            {/* <Link href={`/${COMMUNITY_ROUND_ADDRESS}`} className="text-blue">
              Here is the latest grant
            </Link>{" "} */}
          </p>
        </>
      ) : pageError.value || !roundData ? (
        <>
          {/* <p>{pageError.message || "err"} </p> */}
          <p>
            Grant not found.{" "}
            {/* <Link href={`/${COMMUNITY_ROUND_ADDRESS}`} className="text-blue">
              Here is the latest grant
            </Link>{" "} */}
          </p>
        </>
      ) : (
        <div
          id="report"
          ref={reportTemplateRef}
          className="max-w-screen z-[100]"
        >
          <div className="flex flex-col gap-16 max-w-screen">
            <div className="flex justify-center mt-6">
              <div className="">
                <div className="flex justify-between sm:gap-8 gap-4 sm:items-center mb-12 sm:flex-row flex-col">
                  <h1 className="text-2xl sm:text-3xl font-semibold">
                    {roundData.metadata?.name}
                  </h1>
                  <button
                    onClick={createPDF}
                    className="group z-50 cursor-pointer hover:border-dark transition-all duration-300 rounded-[12px] h-fit w-fit border-2 border-green text-green py-1 px-4 flex items-center gap-2"
                  >
                    <Image
                      src={downloadIcon}
                      width="12"
                      height="12"
                      alt="download icon"
                      className="transition-all group-hover:translate-y-0.5"
                    />
                    PDF
                  </button>
                </div>
                {!!applications?.length &&
                  !applications[0].matchingData?.matchAmountUSD && (
                    <h5 className="text-lg text-blue">
                      Note that this round&apos;s matching data is not finalized
                      yet and the graph is displaying only crowdfunded amount
                    </h5>
                  )}
                {/* <h2 className="text-blue mb-4 text-3xl font-grad">
                  Thank You!
                </h2>
                <p className="max-w-xl text-lg text-justify">
                  Tellus in metus vulputate eu scelerisque felis imperdiet
                  proin. Sit amet dictum sit amet justo donec enim diam. Massa
                  tincidunt dui ut ornare lectus sit amet est placerat.
                </p> */}
              </div>
            </div>
            <Stats
              round={roundData}
              projectsAmount={
                applications?.map(
                  (application) => application.matchingData?.matchAmountUSD || 0
                ) || []
              }
              totalCrowdfunded={
                applications?.reduce(
                  (accumulator, currentValue) =>
                    accumulator + currentValue.amountUSD,
                  0
                ) || 0
              }
              totalProjects={applications?.length || 0}
            >
              <GrantPlot
                values={
                  applications?.map(
                    (ap) =>
                      (ap.matchingData?.matchAmountUSD || 0) + ap.amountUSD
                  ) || []
                }
                labels={
                  applications?.map(
                    (ap) =>
                      `${ap.metadata.application.project.title.slice(0, 20)}${
                        ap.metadata.application.project.title.length >= 20
                          ? "..."
                          : ""
                      }`
                  ) || []
                }
              />
            </Stats>
            <div className="max-w-xl  m-auto z-50">
              <h2 className="text-3xl text-blue mb-4 font-grad flex items-center gap-4">
                A note from your round operator{" "}
                {isRoundOperator && isSignSuccess && !isEditorOpen && (
                  <span
                    className="text-sm text-green cursor-pointer "
                    onClick={() => setIsEditorOpen(true)}
                  >
                    <Image
                      src={editIcon}
                      width="24"
                      height="24"
                      alt="edit icon"
                      className="text-green hover:text-blue transition-all group-hover:translate-y-0.5"
                    />
                  </span>
                )}
              </h2>

              {isEditorOpen && isRoundOperator && isSignSuccess ? (
                <Editor
                  value={newRoundInfo.preamble}
                  onChange={(value: string) =>
                    setNewRoundInfo({ ...newRoundInfo, preamble: value })
                  }
                  onCancel={() => {
                    setIsEditorOpen(false);
                    setNewRoundInfo(roundInfo || defaultRoundInfo);
                  }}
                  onSave={() => uploadRoundInfo(newRoundInfo, id)}
                  isLoading={isUploading}
                />
              ) : (
                <WysiwygRender text={newRoundInfo.preamble} />
              )}
            </div>

            {!!applications?.length &&
              applications[0].matchingData?.matchAmountUSD && (
                <div className="flex flex-col gap-16 max-w-screen">
                  <Card>
                    <div className="max-w-[75vw]">
                      <h2 className="text-blue text-3xl mb-6 text-center font-grad font-normal">
                        Leaderboard
                      </h2>
                      <div className="overflow-x-auto">
                        <div className="mt-8 flow-root">
                          <div className="overflow-x-auto">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                              <table className="min-w-full">
                                <thead>
                                  <tr>
                                    <th
                                      scope="col"
                                      className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-black"
                                    >
                                      Rank
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black"
                                    >
                                      Project name
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black"
                                    >
                                      Contributions
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black"
                                    >
                                      $ Contributed
                                    </th>
                                    <th
                                      scope="col"
                                      className="relative py-3 pl-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-black"
                                    >
                                      $ Match
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="">
                                  {applications
                                    ?.slice(0, 10)
                                    ?.map((proj, index) => (
                                      <tr
                                        key={proj.id}
                                        className="even:bg-light-orange"
                                      >
                                        <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium">
                                          {index + 1}
                                        </td>
                                        <td className="whitespace-prewrap min-w-[200px] px-3 py-3 text-sm">
                                          {proj.metadata.application.project.title.slice(
                                            0,
                                            20
                                          )}

                                          {proj.metadata.application.project
                                            .title.length >= 20
                                            ? "..."
                                            : ""}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-sm text-right">
                                          {formatAmount(proj.votes, true)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-sm text-right">
                                          $
                                          {formatAmount(
                                            proj.amountUSD?.toFixed(2)
                                          )}
                                        </td>
                                        <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium">
                                          $
                                          {formatAmount(
                                            (
                                              proj.matchingData
                                                ?.matchAmountUSD || 0
                                            ).toFixed(2)
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="flex flex-col gap-8 max-w-3xl m-auto">
                    {applications?.slice(0, 10).map((proj) => (
                      <div
                        key={proj.id}
                        className="pt-8 flex flex-col items-center gap-8"
                      >
                        <ProjectCard
                          link={
                            proj.metadata.application.project?.projectGithub
                          }
                          name={proj.metadata.application.project?.title}
                          contributions={proj.votes}
                          matchAmount={proj.matchingData?.matchAmountUSD}
                          crowdfundedAmount={proj.amountUSD}
                          description={
                            proj.metadata.application.project?.description
                          }
                          imgSrc={`https://ipfs.io/ipfs/${proj.metadata.application.project?.logoImg}`}
                        />
                        <Image
                          src={projectsDivider}
                          alt=""
                          width="138"
                          height="83"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
