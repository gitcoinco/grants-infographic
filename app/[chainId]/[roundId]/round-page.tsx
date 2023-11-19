"use client";
import { Address, useAccount, useSignMessage } from "wagmi";
import { useEffect, useRef, useState } from "react";
import TweetEmbed from "react-tweet-embed";
import { fetchMatchingDistribution } from "../../../api/round";
import {
  MatchingStatsData,
  ProjectApplication,
  Round,
  RoundInfo,
} from "../../../api/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import ProjectCard from "../../../components/project-card";
import Stats from "../../../components/stats";
import Card from "../../../components/card";
import projectsDivider from "/assets/projects-divider.svg";
import downloadIcon from "/assets/download-icon.svg";
import editIcon from "/assets/edit-icon.svg";
import dynamic from "next/dynamic";
import {
  ChainId,
  defaultTweetURL,
  formatAmount,
  getGranteeLink,
  pinToIPFS,
  sortByMatchAmount,
} from "../../../api/utils";
import Editor from "../../../components/editor";
import { ethers } from "ethers";
import roundImplementationAbi from "../../../api/abi/roundImplementation";
import { markdownImgRegex } from "../../../constants";
import EditIcon from "../../../components/edit-icon";
import Loading from "../../loading";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
const GrantPlot = dynamic(() => import("../../../components/grant-plot"), {
  ssr: false,
  loading: () => <>Loading...</>,
});

export default function RoundPage({
  roundData,
  roundInfo,
  allApplications,
  chainId,
  roundId,
  refetchRoundInfo,
}: {
  roundData: Round;
  roundInfo: RoundInfo;
  allApplications: ProjectApplication[];
  roundId: string;
  chainId: number;
  refetchRoundInfo: () => void;
}) {
  const router = useRouter();
  const { isConnected, address } = useAccount();

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

  const [applications, setApplications] =
    useState<(ProjectApplication & { matchingData?: MatchingStatsData })[]>();
  const [isUploading, setUploading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTweetsEditorOpen, setIsTweetsEditorOpen] = useState(false);
  const [pageError, setPageError] = useState({ value: false, message: "" });
  const reportTemplateRef = useRef(null);

  const [isPageLoading, setIsPageLoading] = useState(false);

  useEffect(() => {
    const get = async (roundId: Address) => {
      try {
        setIsPageLoading(true);

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
          roundData.matchingFundPayoutToken,
          roundData.matchingPoolUSD
        );
        let applications: (ProjectApplication & {
          matchingData?: MatchingStatsData;
        })[] = allApplications?.map((app) => {
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
      } catch (err) {
        console.log(err);
        setPageError({ value: true, message: err + "An error occured." });
      } finally {
        setIsPageLoading(false);
      }
    };
    roundId
      ? get(roundId as Address)
      : () => {
          setIsPageLoading(false);
          setPageError({ value: true, message: "Grant not found" });
        };
  }, [roundId, chainId]);

  useEffect(() => {
    setIsRoundOperator(false);
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
        roundId,
        roundImplementationAbi,
        signerOrProvider
      );
      const operatorRole = await roundImplementation.ROUND_OPERATOR_ROLE();

      const hasRole = await roundImplementation.hasRole(operatorRole, address);
      setIsRoundOperator(hasRole);
    };
    get();
  }, [address, roundId, chainId]);

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
      await refetchRoundInfo();
      router.refresh();
      setTimeout(() => {
        setIsEditorOpen(false);
        setIsTweetsEditorOpen(false);
        setUploading(false);
      }, 2000);
    }
  };

  const defaultRoundInfo = {
    tweetURLs: defaultTweetURL,
    preamble:
      "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.",
    closing:
      "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.",
    projects: [],
  };
  const [newRoundInfo, setNewRoundInfo] = useState<RoundInfo>(defaultRoundInfo);

  const handleCancelEditor = (isTweetsEditor?: boolean) => {
    isTweetsEditor ? setIsTweetsEditorOpen(false) : setIsEditorOpen(false);

    const defaultProjects =
      applications?.slice(0, 10)?.map((ap) => {
        return {
          id: ap.projectId,
          description: ap.metadata.application.project.description,
        };
      }) || [];
    const defaultText =
      "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.";

    setNewRoundInfo({
      preamble: roundInfo?.preamble || defaultText,
      closing: roundInfo?.closing || defaultText,
      tweetURLs: roundInfo?.tweetURLs || defaultTweetURL,
      projects: roundInfo?.projects?.length
        ? roundInfo.projects
        : defaultProjects,
    });
  };

  useEffect(() => {
    const defaultProjects =
      applications?.slice(0, 10)?.map((ap) => {
        return {
          id: ap.projectId,
          description: ap.metadata.application.project.description,
        };
      }) || [];
    const defaultText =
      "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.";

    setNewRoundInfo({
      preamble: roundInfo?.preamble || defaultText,
      closing: roundInfo?.closing || defaultText,
      tweetURLs: roundInfo?.tweetURLs || defaultTweetURL,
      projects: roundInfo?.projects?.length
        ? roundInfo.projects
        : defaultProjects,
    });
  }, [roundInfo, applications]);

  const getTweetId = (tweetUrl: string) => {
    if (!tweetUrl?.length) return "";
    const tweetId = tweetUrl.split("/").pop()?.split("?")[0];
    return tweetId || "";
  };

  return (
    <>
      <div>
        {!roundId || pageError.value || !roundData ? (
          <>
            <NotFound />
          </>
        ) : isPageLoading ? (
          <Loading />
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
                        Note that this round&apos;s matching data is not
                        finalized yet and the graph is displaying only
                        crowdfunded amount
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

              {/* Stats */}
              <Stats
                round={roundData}
                projectsTokenAmount={
                  applications?.map(
                    (application) => application.matchingData?.matchAmount || 0
                  ) || []
                }
                totalCrowdfunded={roundData.amountUSD}
                totalProjects={allApplications?.length || 0}
              >
                {!!applications?.length && (
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
                          `${ap.metadata.application.project.title.slice(
                            0,
                            20
                          )}${
                            ap.metadata.application.project.title.length >= 20
                              ? "..."
                              : ""
                          }`
                      ) || []
                    }
                  />
                )}
              </Stats>

              {/* Intro */}
              <div className="max-w-xl w-full m-auto z-50 py-8">
                <h2 className="text-3xl text-blue mb-4 font-grad flex items-center justify-center gap-4">
                  A note from your round operator{" "}
                  {!isEditorOpen && isRoundOperator && isSignSuccess && (
                    <span
                      className="text-sm text-green cursor-pointer "
                      onClick={() => setIsEditorOpen(true)}
                    >
                      <EditIcon />
                    </span>
                  )}
                </h2>

                {isEditorOpen && isRoundOperator && isSignSuccess ? (
                  <Editor
                    name="preamble"
                    value={newRoundInfo.preamble}
                    onCancel={() => handleCancelEditor()}
                    onSave={(newVal: string) =>
                      uploadRoundInfo(
                        { ...newRoundInfo, preamble: newVal },
                        roundId
                      )
                    }
                    isLoading={isUploading}
                    isTextarea={true}
                  />
                ) : (
                  <p className="whitespace-pre-line break-words">
                    {newRoundInfo.preamble}
                  </p>
                )}
              </div>

              {/* Tweets */}
              <div className="max-w-7xl m-auto">
                <h2 className="text-3xl text-blue mb-4 font-grad flex items-center justify-center gap-4">
                  What people are tweeting{" "}
                  {!isTweetsEditorOpen && isRoundOperator && isSignSuccess && (
                    <span
                      className="text-sm text-green cursor-pointer "
                      onClick={() => setIsTweetsEditorOpen(true)}
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
                {isTweetsEditorOpen && isRoundOperator && isSignSuccess ? (
                  <div className="w-full sm:min-w-[50rem]">
                    <p className="mb-4">You can add max 6 tweet links here:</p>

                    <Editor
                      name="tweetURLs"
                      value={newRoundInfo.tweetURLs}
                      onCancel={() => handleCancelEditor(true)}
                      onSave={(newVal: string) =>
                        uploadRoundInfo(
                          { ...newRoundInfo, tweetURLs: newVal },
                          roundId
                        )
                      }
                      isLoading={isUploading}
                      isTextarea={false}
                    />
                  </div>
                ) : (
                  <div className="md:w-[80vw] max-w-7xl m-auto">
                    {!!newRoundInfo?.tweetURLs?.length && (
                      <ResponsiveMasonry
                        columnsCountBreakPoints={{
                          350: 1,
                          750: 2,
                          1125:
                            newRoundInfo.tweetURLs.split(",")?.length >= 3
                              ? 3
                              : newRoundInfo.tweetURLs.split(",")?.length >= 2
                              ? 2
                              : 1,
                        }}
                      >
                        <Masonry gutter="1.5rem">
                          {newRoundInfo.tweetURLs
                            .split(",")
                            .map((tweetUrl, index) => (
                              <div key={index}>
                                <TweetEmbed
                                  tweetId={getTweetId(tweetUrl)}
                                  options={{
                                    theme: "dark",
                                    align: "center",
                                    dnt: "true",
                                  }}
                                />
                              </div>
                            ))}
                        </Masonry>
                      </ResponsiveMasonry>
                    )}
                  </div>
                )}
              </div>

              {/* Leaderboard */}
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

                    <div className="flex flex-col gap-8 max-w-[65ch] m-auto">
                      {applications?.slice(0, 10).map((proj) => (
                        <div
                          key={proj.id}
                          className="pt-8 flex flex-col items-center gap-8"
                        >
                          <ProjectCard
                            link={getGranteeLink(chainId, roundId, proj.id)}
                            name={proj.metadata.application.project?.title}
                            contributions={proj.votes}
                            matchAmount={proj.matchingData?.matchAmountUSD}
                            crowdfundedAmount={proj.amountUSD}
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
    </>
  );
}

const NotFound = () => {
  return (
    <div className="min-h-[95vh] flex justify-center ">
      <p className="text-center mt-4 text-semibold">Round not found</p>
    </div>
  );
};
