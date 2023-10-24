import type { NextPage } from "next";
import { Address } from "wagmi";
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
// let GrantPlot = lazy(() => import("../components/grant-plot"));
import dynamic from "next/dynamic";
import {
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
const GrantPlot = dynamic(import("../../components/grant-plot"), {
  ssr: false,
});

const Home: NextPage = () => {
  const { rounds, setRounds } = useContext(roundsContext);
  const { setFilters } = useContext(filtersContext);

  // const { address, isConnected } = useAccount();
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
  });
  useEffect(() => {
    if (id && chainId) {
      setFilters({ chainId: chainId.toString(), roundId: id });
    }
  }, [id, chainId, setFilters]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.pathname);
    }

    const get = async (roundId: Address) => {
      try {
        setIsPageLoading(true);

        // setPageError({ value: false, message: "" });
        const data = rounds ? getRoundById(rounds, roundId) : undefined;
        setRoundData(data);

        if (!data) return;
        setPageError({ value: false, message: "" });

        const {
          data: roundInfo,
          error: roundInfoErr,
          success: roundInfoSuccess,
        } = await getRoundInfo(roundId);
        if (!roundInfoSuccess) throw new Error(roundInfoErr);

        setRoundInfo(roundInfo);

        let applications:
          | (ProjectApplication & { matchingData?: MatchingStatsData })[]
          | undefined = await getProjectsApplications(roundId, chainId);
        const matchingFundPayoutToken: PayoutToken = payoutTokens.filter(
          (t) => t.address.toLowerCase() == data?.token.toLowerCase()
        )[0];
        const matchingData = await fetchMatchingDistribution(
          roundId,
          new ethers.providers.EtherscanProvider(chainId),
          matchingFundPayoutToken
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
      } catch (err) {
        setPageError({ value: true, message: "An error occured." });
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
  }, [id, rounds, chainId]);

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
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque id risus a est condimentum placerat at a massa. Nunc et metus magna. Donec a finibus nulla. Donec porta urna sit amet eros cursus pulvinar.",
    closing:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque id risus a est condimentum placerat at a massa. Nunc et metus magna. Donec a finibus nulla. Donec porta urna sit amet eros cursus pulvinar.",
    projects: [],
  };
  const [newRoundInfo, setNewRoundInfo] = useState<RoundInfo>(defaultRoundInfo);

  useEffect(() => {
    if (roundInfo) {
      setNewRoundInfo(roundInfo);
    } else {
      setNewRoundInfo({
        preamble:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque id risus a est condimentum placerat at a massa. Nunc et metus magna. Donec a finibus nulla. Donec porta urna sit amet eros cursus pulvinar.",
        closing:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque id risus a est condimentum placerat at a massa. Nunc et metus magna. Donec a finibus nulla. Donec porta urna sit amet eros cursus pulvinar.",
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
            <Link href={`/${COMMUNITY_ROUND_ADDRESS}`} className="text-blue">
              Here is the latest grant
            </Link>{" "}
          </p>
        </>
      ) : pageError.value || !roundData ? (
        <>
          {/* <p>{pageError.message} </p> */}
          <p>
            Grant not found.{" "}
            <Link href={`/${COMMUNITY_ROUND_ADDRESS}`} className="text-blue">
              Here is the latest grant
            </Link>{" "}
          </p>
        </>
      ) : (
        <div id="report" ref={reportTemplateRef} className="max-w-screen">
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
              // totalContributionsAmount={
              //   applications?.reduce(
              //     (accumulator, currentValue) =>
              //       accumulator + currentValue.votesArray.map(vote => vote.amount) || 0,
              //     0
              //   ) || 0
              // }
              projectsAmount={
                applications?.map(
                  (application) =>
                    application.amountUSD +
                      (application.matchingData?.matchAmount || 0) || 0
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
                    (ap) => (ap.matchingData?.matchAmount || 0) + ap.amountUSD
                  ) || []
                }
                labels={
                  applications?.map(
                    (ap) => ap.metadata.application.project.title
                  ) || []
                }
              />
            </Stats>
            <div className="max-w-xl  m-auto z-50">
              <h2 className="text-3xl text-blue mb-4 font-grad flex items-center gap-4">
                Preamble{" "}
                {!isEditorOpen && (
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

              {isEditorOpen ? (
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

            <Card>
              <div className="max-w-[75vw]">
                <h2 className="text-blue text-3xl mb-6 text-center font-grad font-normal">
                  Leaderboard
                </h2>
                <div className="overflow-x-auto">
                  <div className="mt-8 flow-root">
                    <div className="-mx-2 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
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
                                DAI Match
                              </th>
                            </tr>
                          </thead>
                          <tbody className="">
                            {applications?.slice(0, 10)?.map((proj, index) => (
                              <tr
                                key={proj.id}
                                className="even:bg-light-orange"
                              >
                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium">
                                  {index + 1}
                                </td>
                                <td className="whitespace-prewrap min-w-[200px] px-3 py-3 text-sm">
                                  {proj.metadata.application.project.title}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-sm text-right">
                                  {formatAmount(proj.votes, true)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-sm text-right">
                                  ${formatAmount(proj.amountUSD?.toFixed(2))}
                                </td>
                                <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium">
                                  $
                                  {formatAmount(
                                    (
                                      proj.matchingData?.matchAmount || 0
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
                    link={proj.metadata.application.project?.projectGithub}
                    name={proj.metadata.application.project?.title}
                    description={proj.metadata.application.project?.description}
                    imgSrc={`https://ipfs.io/ipfs/${proj.metadata.application.project?.logoImg}`}
                  />
                  <Image src={projectsDivider} alt="" width="138" height="83" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
