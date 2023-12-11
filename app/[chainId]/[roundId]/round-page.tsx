"use client";
import { Address, useAccount, useSignMessage } from "wagmi";
import { useEffect, useRef, useState } from "react";
import TweetEmbed from "react-tweet-embed";
import { fetchMatchingDistribution } from "../../../api/round";
import {
  MatchingStatsData,
  PayoutToken,
  ProjectApplication,
  Round,
  RoundInfo,
} from "../../../api/types";

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import ProjectCard from "../../../components/project-card";
import Stats from "../../../components/stats";
import Card from "../../../components/card";
import projectsDivider from "/assets/projects-divider.svg";
import downloadIcon from "/assets/download-icon.svg";
import editIcon from "/assets/edit-icon.svg";
import defaultBanner from "/assets/default-banner.svg";
import defaultLogo from "/assets/default-logo.svg";
import dynamic from "next/dynamic";
import {
  ChainId,
  defaultTweetURL,
  formatAmount,
  getBlockExplorerTxLink,
  getGranteeLink,
  payoutTokens,
  pinFileToIPFS,
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
import * as Papa from "papaparse";
import heroBg from "/assets/hero-bg.svg";
import Header from "../../../components/header";
import Button from "../../../components/button";
import IpfsImage from "../../../components/ipfs-image";

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
  allRounds,
}: {
  roundData: Round;
  roundInfo: RoundInfo;
  allApplications: ProjectApplication[];
  roundId: string;
  chainId: number;
  refetchRoundInfo: () => Promise<void>;
  allRounds: Round[];
}) {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [payoutTxnHash, setPayoutTxnHash] = useState<string>();
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
        setPayoutTxnHash(matchingData?.payoutTxnHash);

        let applications: (ProjectApplication & {
          matchingData?: MatchingStatsData;
        })[] = allApplications?.map((app) => {
          const projectMatchingData = matchingData?.matchingDistribution?.find(
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
      }, 1000);
    }
  };

  const [logo, setLogo] = useState<Blob>();
  const inputLogo = useRef<any>(null);

  const uploadFile = async (type: "banner" | "logo", file: Blob, e?: any) => {
    try {
      setUploading(true);
      if (!file) return;
      e && e.preventDefault();

      const formData = new FormData();
      formData.append("file", file);

      const res = await pinFileToIPFS(formData);

      const ipfsHash = res.IpfsHash;

      const roundBody = { ...newRoundInfo, [type]: ipfsHash };
      await uploadRoundInfo(roundBody, roundId);
      type == "logo" && setLogo(undefined);
      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleLogoChange = (e: any) => {
    setLogo(e.target.files[0]);
  };

  const defaultRoundInfo = {
    tweetURLs: defaultTweetURL,
    preamble:
      "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.",
    closing:
      "Welcome to this grant round! This is a placeholder text and we invite you, the round operator, to overwrite it with your own message. Use this space to introduce the round to participants, acknowledge those who funded the matching pool, or share personal insights and thoughts. Make this round uniquely yours.",
    projects: [],
    logo: "",
    banner: "",
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
      logo: roundInfo?.logo || "",
      banner: roundInfo?.banner || "",
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
      logo: roundInfo?.logo || "",
      banner: roundInfo?.banner || "",
    });
  }, [roundInfo, applications]);

  const getTweetId = (tweetUrl: string) => {
    if (!tweetUrl?.length) return "";
    const tweetId = tweetUrl.split("/").pop()?.split("?")[0];
    return tweetId || "";
  };

  function downloadCSV() {
    const data = createApplicationsCSV(applications!);
    const csvData = Papa.unparse(data as any);
    const fileName = `${roundData.metadata?.name} - Round Results.csv`;
    exportData(csvData, fileName, "text/csv;charset=utf-8;");
  }

  const exportData = (data: any, fileName: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const createApplicationsCSV = (
    applications: (ProjectApplication & { matchingData?: MatchingStatsData })[]
  ) => {
    const matchingFundPayoutToken: PayoutToken = payoutTokens.filter(
      (t) => t.address.toLowerCase() == roundData.token.toLowerCase()
    )[0];

    const tokenFieldName = `MATCHED ${matchingFundPayoutToken.name}`;

    const list = applications.map((proj, index) => {
      const tokenAmount = proj.matchingData?.matchAmount || 0;

      return {
        RANK: index + 1,
        "PROJECT NAME": proj.metadata.application.project.title,
        CONTRIBUTIONS: formatAmount(proj.votes, true),
        "CROWDFUNDED USD": `$${formatAmount(proj.amountUSD?.toFixed(2))}`,
        "MATCHED USD": `$${formatAmount(
          (proj.matchingData?.matchAmountUSD || 0).toFixed(2)
        )}`,
        [tokenFieldName]: `${formatAmount(tokenAmount, true)} ${
          matchingFundPayoutToken.name
        }`,
      };
    });
    return JSON.stringify(list);
  };
  return (
    <>
      <div className="relative">
        <Header allRounds={allRounds} />
      </div>
      <div className="p-6">
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
            className="max-w-screen z-[99]"
          >
            <div className="flex flex-col gap-16 max-w-screen">
              <div className="flex w-full m-auto justify-center">
                <div className="w-full  max-w-5xl m-auto">
                  <BannerEditor
                    canEdit={isRoundOperator && isSignSuccess}
                    isUploading={isUploading}
                    roundBanner={roundInfo?.banner}
                    type="banner"
                    saveBtnTitle="Save banner"
                    onSave={(file: Blob) => uploadFile("banner", file)}
                    roundName={roundData?.metadata?.name || ""}
                  />
                  <div className="flex justify-between sm:gap-8 gap-4 sm:items-center mb-12 sm:flex-row flex-col">
                    <div className="flex items-center gap-4 pl-10">
                      <div className="relative -mt-14 z-[30]">
                        <input
                          accept="image/*"
                          type="file"
                          id="Logo"
                          ref={inputLogo}
                          onChange={handleLogoChange}
                          style={{ display: "none" }}
                        />
                        {!!logo && isRoundOperator && isSignSuccess ? (
                          <div className=" flex flex-col gap-2 items-center relative ">
                            <Image
                              src={URL.createObjectURL(logo)}
                              width="120"
                              height="120"
                              className="aspect-square object-cover w-28 h-28 rounded-full border border-dark bg-sand"
                              alt="logo"
                            />
                            <div className="absolute -bottom-10 ">
                              <Button
                                type="secondary"
                                size="sm"
                                onClick={(e) => uploadFile("logo", logo, e)}
                                isLoading={isUploading}
                              >
                                Save logo
                              </Button>
                            </div>
                          </div>
                        ) : !!roundInfo?.logo ? (
                          <IpfsImage
                            type="logo"
                            width={120}
                            height={120}
                            cid={roundInfo.logo}
                            alt={`${roundData.metadata?.name} logo`}
                            className="aspect-square object-cover w-28 h-28 rounded-full border border-dark bg-sand"
                          />
                        ) : (
                          <Image
                            width="120"
                            height="120"
                            src={defaultLogo}
                            alt=""
                            className="aspect-square object-cover w-28 h-28 rounded-full border border-dark bg-sand"
                          />
                        )}
                        {isRoundOperator && isSignSuccess && (
                          <button
                            className="text-sm text-green cursor-pointer absolute right-4 top-4"
                            disabled={isUploading}
                            onClick={() => inputLogo.current?.click()}
                          >
                            <span
                              className="text-sm text-green cursor-pointer"
                              onClick={() => setIsEditorOpen(true)}
                            >
                              <EditIcon />
                            </span>
                          </button>
                        )}
                      </div>
                      <h1 className="text-2xl sm:text-4xl font-semibold">
                        {roundData.metadata?.name}
                      </h1>
                    </div>
                    <div className="z-50 group">
                      <Button type="primary" onClick={createPDF}>
                        <Image
                          src={downloadIcon}
                          width="12"
                          height="12"
                          alt="download icon"
                          className="transition-all group-hover:translate-y-0.5"
                        />
                        <span>PDF</span>
                      </Button>
                    </div>
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
                  <div className="md:w-[80vw] max-w-4xl m-auto">
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
                        <Masonry gutter="0.5rem">
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
                        <div className="flex items-center justify-between gap-4 sm:flex-row flex-col mb-6 sm:px-6 lg:px-8">
                          <h2 className="text-blue text-3xl text-center font-grad font-normal">
                            Leaderboard
                          </h2>
                          <div className="flex items-center gap-2">
                            <Button type="primary" onClick={downloadCSV}>
                              Download results
                            </Button>
                            {!!payoutTxnHash && (
                              <Button type="primary">
                                <a
                                  href={getBlockExplorerTxLink(
                                    chainId,
                                    payoutTxnHash
                                  )}
                                  target="_blank"
                                >
                                  View transaction
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
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
                                        Crowdfunded USD
                                      </th>
                                      <th
                                        scope="col"
                                        className="relative py-3 pl-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-black"
                                      >
                                        Matched USD
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

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 100,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const BannerEditor = ({
  isUploading,
  type,
  saveBtnTitle,
  onSave,
  canEdit,
  roundName,
  roundBanner,
}: {
  isUploading: boolean;
  type: "banner" | "logo";
  saveBtnTitle: string;
  onSave: (file: Blob) => Promise<void>;
  canEdit: boolean;
  roundName: string;
  roundBanner?: string;
}) => {
  const [newImgSrc, setNewImgSrc] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const blobUrlRef = useRef("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(
    type == "banner" ? 3.27 / 1 : 1
  );
  const inputBanner = useRef<any>(null);
  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setNewImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  async function handleSaveCroppedImage() {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
    }
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error("Crop canvas does not exist");
    }

    const offscreen = new OffscreenCanvas(
      completedCrop.width,
      completedCrop.height
    );
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      throw new Error("No 2d context");
    }

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height
    );

    const blob = await offscreen.convertToBlob({
      type: "image/webp",
    });

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = URL.createObjectURL(blob);

    await onSave(blob);
    setNewImgSrc("");
  }

  return (
    <div>
      <div className="flex justify-end mb-2 w-full">
        {!!completedCrop && !!newImgSrc && canEdit && (
          <>
            <Button
              type="secondary"
              size="sm"
              onClick={handleSaveCroppedImage}
              isLoading={isUploading}
            >
              {saveBtnTitle}
            </Button>

            <canvas
              ref={previewCanvasRef}
              style={{
                display: "none",
              }}
            />
          </>
        )}
      </div>
      <div className="z-[20] flex justify-center relative">
        {!!newImgSrc && canEdit ? (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minHeight={100}
          >
            <Image
              ref={imgRef}
              alt="Crop me"
              src={newImgSrc}
              onLoad={onImageLoad}
              width="1440"
              height="440"
              className="w-full h-auto  object-fill rounded-xl border border-dark"
            />
          </ReactCrop>
        ) : !!roundBanner ? (
          <IpfsImage
            type="banner"
            cid={roundBanner}
            alt={`${roundName} banner`}
            width={1440}
            height={440}
            className={`w-full h-auto ${
              type == "banner" ? "aspect-[3.27]" : "aspect-square"
            } object-cover rounded-xl border border-dark`}
          />
        ) : (
          <Image
            src={defaultBanner}
            alt=""
            width="1440"
            height="440"
            className={`w-full h-auto ${
              type == "banner" ? "aspect-[3.27]" : "aspect-square"
            } object-fill rounded-xl border border-dark`}
          />
        )}
        {canEdit && (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              ref={inputBanner}
              style={{ display: "none" }}
            />
            <button
              className="text-sm text-green cursor-pointer absolute right-5 top-5 flex  gap-2 items-center justify-end"
              disabled={isUploading}
              onClick={() => inputBanner.current?.click()}
            >
              <span className="text-xs">
                Recommended size: <br />
                1440 x 440
              </span>
              <span>
                <EditIcon />
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop
) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();
}
