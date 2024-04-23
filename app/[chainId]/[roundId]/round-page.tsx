"use client";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Formik, Field, Form, FieldArray, FormikProps } from "formik";
import { getUnixTime } from "date-fns";
import _ from "lodash";
import WarpcastIcon from "/assets/warpcast-logo.svg";
import TwitterBlueIcon from "/assets/x-logo.svg";
import { useRoundById } from "../../../hooks/useRoundById";
import TweetEmbed from "react-tweet-embed";
import {
  ChainId,
  isDirectRound,
  isInfiniteDate,
  pinFileToIPFS,
  votingTokens,
} from "../../../api/utils";
import NotFoundPage from "../../../components/not-found-page";
import {
  useAccount,
  useNetwork,
  usePublicClient,
  useToken,
  useWalletClient,
} from "wagmi";
import { getAddress } from "viem";
import { ethers } from "ethers";
import * as Papa from "papaparse";
import { UnparseObject } from "papaparse";
import GenericModal from "../../../components/generic-modal";
import { useRoundApprovedApplications } from "../../../hooks/useRoundApprovedApplications";
import {
  CameraIcon,
  CheckIcon,
  LinkIcon,
  PencilIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
// import { Tweet } from "react-tweet";
// @ts-ignore
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import "react-farcaster-embed/dist/styles.css";
import ConfirmationModal from "../../../components/confirmation-modal";
import {
  AnyJson,
  Application,
  DistributionMatch,
  Hex,
  PayoutToken,
  ProgressStatus,
  ProgressStep,
  Project,
  Round,
  RoundCategory,
  RoundMetadata,
  UpdateRoundData,
  VotingToken,
  getRoundStrategyTitle,
} from "../../../api/types";
import {
  CHAINS,
  formatUTCDateAsISOString,
  getDaysLeft,
  getUTCTime,
} from "../../../api/utils";
import { Badge, Button } from "../../styles";
import { CalendarIcon } from "../../../components/icons";
import { useTokenPrice } from "../../../hooks/useTokenPrice";
import useWindowDimensions from "../../../hooks/useWindowDimensions";
import dynamic from "next/dynamic";
import Loading from "../../loading";
import React from "react";
import { AlloV2 } from "../../../api/allo-v2";
import { AlloV1 } from "../../../api/allo-v1";
import { Allo } from "../../../api/allo";
import { createViemTransactionSender } from "../../../api/transaction-sender";
import { createWaitForIndexerSyncTo } from "../../../api/indexer";
import { createPinataIpfsUploader } from "../../../api/ipfs";
import ProgressModal from "../../../components/progress-modal";
import ErrorModal from "../../../components/error-modal";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Image from "next/image";
import IpfsImage from "../../../components/ipfs-image";
const GrantPlot = dynamic(() => import("../../../components/grant-plot"), {
  ssr: false,
  loading: () => <>Loading...</>,
});

export type ProjectMatchingData = DistributionMatch & {
  matchAmountUSD?: number;
};

type ApplicationWithMatchingData = Application & {
  matchingData?: ProjectMatchingData;
};
const BeforeRoundStart = () => {
  return <div>This round has not started yet. Check back later!</div>;
};

export default function ViewRoundStats({
  chainId,
  roundId,
}: {
  roundId: string;
  chainId: number;
}) {
  const { round, isLoading } = useRoundById(
    Number(chainId),
    roundId?.toLowerCase() as string
  );

  const currentTime = new Date();
  const isBeforeRoundStartDate = round && round.roundStartTime >= currentTime;
  const isAfterRoundStartDate = round && round.roundStartTime <= currentTime;

  return isLoading ? (
    <Loading />
  ) : (
    <>
      {round && chainId && roundId ? (
        <>
          {isBeforeRoundStartDate && <BeforeRoundStart />}

          {isAfterRoundStartDate && (
            <AfterRoundStart
              round={round}
              chainId={Number(chainId)}
              roundId={roundId}
            />
          )}
        </>
      ) : (
        <NotFoundPage />
      )}
    </>
  );
}

function AfterRoundStart(props: {
  round: Round;
  chainId: ChainId;
  roundId: string;
}) {
  const { round, chainId, roundId } = props;
  const [logoImg, setLogoImg] = useState<Blob | undefined>();
  const [bannerImg, setBannerImg] = useState<Blob | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // covers infinte dates for roundEndDate
  const currentTime = new Date();
  const isAfterRoundEndDate =
    round &&
    (isInfiniteDate(round.roundEndTime)
      ? false
      : round && round.roundEndTime <= currentTime);
  const isBeforeRoundEndDate =
    round &&
    (isInfiniteDate(round.roundEndTime) || round.roundEndTime > currentTime);

  const [projects, setProjects] = useState<Project[]>();

  useEffect(() => {
    const projects = round?.approvedProjects;
    setProjects(projects);
  }, [round]);

  const { data } = useToken({
    address: getAddress(props.round.token),
    chainId: Number(props.chainId),
  });

  // TODO: need a JSON file for votingTokens
  const nativePayoutToken = votingTokens.find(
    (t) =>
      t.chainId === Number(props.chainId) &&
      t.address === getAddress(props.round.token)
  );

  const tokenData = data ?? {
    ...nativePayoutToken,
    symbol: nativePayoutToken?.name ?? "ETH",
  };
  const tokenSymbol = tokenData.symbol;

  return (
    <>
      <div>
        <ViewRoundPageHero
          round={round}
          chainId={chainId}
          roundId={roundId}
          isBeforeRoundEndDate={isBeforeRoundEndDate}
          isAfterRoundEndDate={isAfterRoundEndDate}
          tokenSymbol={tokenData?.symbol}
          setBannerImg={setBannerImg}
          setLogoImg={setLogoImg}
          isEditorOpen={isEditorOpen}
        />

        <ReportCard
          projects={projects}
          token={nativePayoutToken}
          tokenSymbol={tokenSymbol}
          isBeforeRoundEndDate={isBeforeRoundEndDate}
          roundId={roundId}
          round={round}
          chainId={chainId}
          logoImg={logoImg}
          bannerImg={bannerImg}
          isEditorOpen={isEditorOpen}
          setIsEditorOpen={setIsEditorOpen}
        />
      </div>
    </>
  );
}

function ViewRoundPageHero({
  round,
  roundId,
  chainId,
  isAfterRoundEndDate,
  tokenSymbol,
  setLogoImg,
  setBannerImg,
  isEditorOpen,
}: {
  round: Round;
  chainId: ChainId;
  roundId: string;
  isBeforeRoundEndDate?: boolean;
  isAfterRoundEndDate?: boolean;
  tokenSymbol?: string;
  setLogoImg: Dispatch<SetStateAction<Blob | undefined>>;
  setBannerImg: Dispatch<SetStateAction<Blob | undefined>>;
  isEditorOpen: boolean;
}) {
  const currentTime = new Date();

  const getRoundEndsText = () => {
    if (!round.roundEndTime) return;

    const roundEndsIn =
      round.roundEndTime === undefined
        ? undefined
        : getDaysLeft(getUnixTime(round.roundEndTime).toString());

    if (roundEndsIn === undefined || roundEndsIn < 0) return;

    if (roundEndsIn === 0) return "Ends today";

    return `${roundEndsIn} ${roundEndsIn === 1 ? "day" : "days"} left`;
  };

  const roundEndsText = getRoundEndsText();

  const logoChangedHandler = (logo?: Blob) => {
    setLogoImg(logo);
  };

  const bannerChangedHandler = (banner?: Blob) => {
    setBannerImg(banner);
  };

  return (
    <>
      <section>
        <div className="mb-4">
          <RoundBanner
            canEdit={isEditorOpen}
            bannerImgCid={
              round.roundMetadata?.reportCardMetadata?.bannerImg ?? null
            }
            roundName={round.roundMetadata?.name ?? "Round banner"}
            changeHandler={bannerChangedHandler}
          />
          <div className="pl-4 sm:pl-6 lg:pl-8">
            <div className="sm:flex sm:items-end sm:space-x-5">
              <div className="flex">
                <RoundLogo
                  canEdit={isEditorOpen}
                  logoImgCid={
                    round.roundMetadata?.reportCardMetadata?.logoImg ?? ""
                  }
                  roundName={round.roundMetadata?.name ?? "Round logo"}
                  changeHandler={logoChangedHandler}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-center md:justify-between md:gap-8 md:flex-row md:mb-0 mb-4">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h1
                data-testid="round-title"
                className="text-2xl sm:text-3xl font-modern-era-medium text-grey-500"
              >
                {round.roundMetadata?.name}
              </h1>
              {!isAfterRoundEndDate ? (
                <Badge
                  color="blue"
                  rounded="full"
                  className="flex-shrink-0 px-2.5 font-modern-era-bold"
                >
                  {roundEndsText}
                </Badge>
              ) : (
                <Badge
                  color="orange"
                  rounded="full"
                  className="flex-shrink-0 px-2.5"
                >
                  Round ended
                </Badge>
              )}
            </div>
            <Badge
              color="grey"
              rounded="full"
              data-testid="round-badge"
              className=" text-gray-900 inline-flex px-2.5 mb-4"
            >
              <span>
                {round.payoutStrategy?.strategyName &&
                  getRoundStrategyTitle(round.payoutStrategy?.strategyName)}
              </span>
            </Badge>

            <div className="text-grey-400 flex gap-2 mb-2">
              <span>on</span>
              <div className="flex items-center">
                <img
                  className="w-4 h-4 mt-0.5 mr-1"
                  src={CHAINS[chainId]?.logo}
                  alt="Round Chain Logo"
                />
                <span>
                  {
                    (
                      CHAINS[chainId] as {
                        id: ChainId;
                        name: string;
                        logo: string;
                      }
                    )?.name
                  }
                </span>
              </div>
            </div>

            <div className="flex text-grey-500 mb-4">
              <p className="mr-4 flex items-center">
                <span className="mr-2">Donate</span>
                <CalendarIcon className="w-4 h-4 !text-grey-400 inline-block mr-2" />
                <span>
                  <span className="px-2 rounded bg-grey-50">
                    <span className="mr-1">
                      {formatUTCDateAsISOString(round.roundStartTime)}
                    </span>
                    <span>{getUTCTime(round.roundStartTime)}</span>
                  </span>
                  <span className="px-1.5">-</span>
                  <span className="px-2 rounded bg-grey-50">
                    {!isInfiniteDate(round.roundEndTime) ? (
                      <>
                        <span className="mr-1">
                          {formatUTCDateAsISOString(round.roundEndTime)}
                        </span>

                        <span>{getUTCTime(round.roundEndTime)}</span>
                      </>
                    ) : (
                      <span>No End Date</span>
                    )}
                  </span>
                </span>
              </p>
            </div>
          </div>

          {!isDirectRound(round) && (
            <div className="bg-grey-50 p-8 rounded-2xl">
              <p className="text-3xl mb-2 font-mono tracking-tighter">
                {round.roundMetadata?.quadraticFundingConfig?.matchingFundsAvailable.toLocaleString()}
                &nbsp;
                {tokenSymbol ?? "..."}
              </p>
              <p>Matching Pool</p>
            </div>
          )}
        </div>

        <p className="mb-4 overflow-x-auto">
          {round.roundMetadata?.eligibility?.description}
        </p>
      </section>
      <hr className="mt-4 mb-8" />
    </>
  );
}

const ReportCard = ({
  round,
  roundId,
  chainId,
  token,
  tokenSymbol,
  projects,
  logoImg,
  bannerImg,
  isEditorOpen,
  setIsEditorOpen,
}: {
  projects?: Project[];
  token?: PayoutToken;
  tokenSymbol?: string;
  isBeforeRoundEndDate?: boolean;
  roundId: string;
  round: Round;
  chainId: ChainId;
  logoImg?: Blob;
  bannerImg?: Blob;
  isEditorOpen: boolean;
  setIsEditorOpen: Dispatch<SetStateAction<boolean>>;
}): JSX.Element => {
  const roundPreamble =
    "Celebrate the impact of recent Gitcoin rounds through data, insights, and stories of participating grant projects and individuals. Our visual report cards highlight achievements, foster transparency, and track engagement in the open-source community.";
  const defaultTweetURL =
    "https://twitter.com/umarkhaneth/status/1718319104178753678";
  const twitterRegex =
    /^https?:\/\/(www.|m.|mobile.)?twitter|x\.com\/(?:#!\/)?\w+\/status?\/\d+/;
  const warpcastRegex =
    /^https?:\/\/(www.)?warpcast\.com\/(?:#!\/)?\w+\/(?:#!\/)?\w+/;

  const [alloVersion, setAlloVersion] = useState<"allo-v1" | "allo-v2">(
    "allo-v1"
  );
  const allo = useAllo(alloVersion);

  const { updateRound, IPFSCurrentStatus, roundUpdateStatus, indexingStatus } =
    useUpdateRound();

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [newRoundMetadata, setNewRoundMetadata] = useState(
    _.cloneDeep(round.roundMetadata)
  );

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [ipfsStep, setIpfsStep] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isOperatorNotice, setIsOperatorNoticeOpen] = useState(false);

  useEffect(() => {
    if (!roundId) return;
    setAlloVersion(roundId?.startsWith("0x") ? "allo-v1" : "allo-v2");
  }, [roundId, alloVersion]);

  const { data: applications, isLoading: isGetApplicationsLoading } =
    useRoundApprovedApplications({
      chainId,
      roundId,
      projectIds: round.approvedProjects?.map(
        (proj) => proj.grantApplicationId
      ),
    });

  const operatorWallets = round?.roles?.map(
    (account: { address: string }) => account.address
  );
  const { address } = useAccount();
  const isRoundOperator =
    !!address &&
    !!operatorWallets?.includes(address.toLowerCase()) &&
    // editing on allo-v1 rounds is not supported
    alloVersion === "allo-v2";
  const { data: tokenPrice } = useTokenPrice(token?.redstoneTokenId);

  const applicationsWithMetadataAndMatchingData:
    | ApplicationWithMatchingData[]
    | undefined = useMemo(() => {
    if (!applications || !projects) return;

    const tokenAmount =
      round.roundMetadata?.quadraticFundingConfig?.matchingFundsAvailable ?? 0;

    const matchingPoolUSD = Number(tokenPrice) * tokenAmount;

    const applicationsWithData = applications.map((application) => {
      const projectMatchingData =
        round.matchingDistribution?.matchingDistribution?.find(
          (match) => match.applicationId === application.id
        );

      const projectMatchUSD = projectMatchingData?.matchPoolPercentage
        ? projectMatchingData.matchPoolPercentage * matchingPoolUSD
        : 0;

      const applicationData = {
        ...application,
        matchingData: projectMatchingData
          ? {
              ...projectMatchingData,
              matchAmountUSD: projectMatchUSD,
            }
          : (undefined as ProjectMatchingData | undefined),
      };
      return applicationData;
    });

    const sortedApplications = [...applicationsWithData].sort((a, b) => {
      const totalA = a.matchingData
        ? a.matchingData?.matchAmountUSD ?? 0
        : a.totalAmountDonatedInUsd;
      const totalB = b.matchingData
        ? b.matchingData?.matchAmountUSD ?? 0
        : b.totalAmountDonatedInUsd;
      return totalB - totalA;
    });
    return sortedApplications;
  }, [applications, projects, round, tokenPrice]);

  const projectsMatchAmountInToken =
    applicationsWithMetadataAndMatchingData?.map((application) =>
      application.matchingData
        ? parseFloat(
            ethers.utils.formatUnits(
              application.matchingData?.matchAmountInToken ?? 0,
              token?.decimal
            )
          )
        : 0
    ) ?? [];

  const totalUSDCrowdfunded = useMemo(() => {
    return (
      applications
        ?.map((application) => application.totalAmountDonatedInUsd)
        .reduce((acc, amount) => acc + amount, 0) ?? 0
    );
  }, [applications]);

  const totalDonations = useMemo(() => {
    return (
      applications
        ?.map((application) => application.uniqueDonorsCount)
        .reduce((acc, amount) => acc + amount, 0) ?? 0
    );
  }, [applications]);

  const isFinished = (): ProgressStatus => {
    const ipfsSuccess = ipfsStep
      ? IPFSCurrentStatus === ProgressStatus.IS_SUCCESS
      : true;
    const roundSuccess = roundUpdateStatus === ProgressStatus.IS_SUCCESS;
    const indexingSuccess = indexingStatus === ProgressStatus.IS_SUCCESS;
    return ipfsSuccess && roundSuccess && indexingSuccess
      ? ProgressStatus.IS_SUCCESS
      : ProgressStatus.NOT_STARTED;
  };

  const progressSteps: ProgressStep[] = [
    ...(ipfsStep
      ? [
          {
            name: "Storing",
            description: "The metadata is being saved in a safe place.",
            status: IPFSCurrentStatus,
          },
        ]
      : []),
    {
      name: "Submitting",
      description: `Sending transaction to update the round contract.`,
      status: roundUpdateStatus,
    },
    {
      name: "Reindexing",
      description: "Making sure our data is up to date.",
      status: indexingStatus,
    },
    {
      name: "Finishing Up",
      description: "We’re wrapping up.",
      status: isFinished(),
    },
  ];

  useEffect(() => {
    const reportCardMetadata = round.roundMetadata?.reportCardMetadata;
    if (round && isRoundOperator && !JSON.stringify(reportCardMetadata)?.length)
      setIsOperatorNoticeOpen(true);
  }, [round, isRoundOperator]);

  function downloadProjectsCSV() {
    if (!applicationsWithMetadataAndMatchingData) return;
    const data = createApplicationsCSV(applicationsWithMetadataAndMatchingData);
    const csvData = Papa.unparse(
      data as unknown as unknown[] | UnparseObject<unknown>
    );
    const fileName = `${round.roundMetadata?.name} - Round Results.csv`;
    exportData(csvData, fileName, "text/csv;charset=utf-8;");
  }

  const exportData = (data: BlobPart, fileName: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const createApplicationsCSV = (
    applications: ApplicationWithMatchingData[]
  ) => {
    const tokenFieldName = `MATCHED ${token?.name}`;

    const list = applications.map((proj, index) => {
      const tokenAmount = proj.matchingData
        ? parseFloat(
            ethers.utils.formatUnits(
              proj.matchingData.matchAmountInToken,
              token?.decimal
            )
          )
        : 0;
      return {
        RANK: index + 1,
        "PROJECT NAME": proj.project?.metadata?.title ?? "-",
        CONTRIBUTIONS: formatAmount(proj.uniqueDonorsCount, true),
        "CROWDFUNDED USD": `$${formatAmount(
          proj.totalAmountDonatedInUsd?.toFixed(2)
        )}`,
        "MATCHED USD": `$${formatAmount(
          (proj.matchingData?.matchAmountUSD ?? 0).toFixed(2)
        )}`,
        [tokenFieldName]: `${formatAmount(tokenAmount, true)} ${tokenSymbol}`,
      };
    });
    return JSON.stringify(list);
  };

  const handleEdit = () => {
    setIsEditorOpen(true);
  };

  const handleCancel = () => {
    setIsEditorOpen(false);
    setNewRoundMetadata(round.roundMetadata);
  };

  const uploadFile = async (file: Blob, e?: any) => {
    let ipfsHash: string | undefined = undefined;
    try {
      if (!file) return;
      e && e.preventDefault();

      const formData = new FormData();
      formData.append("file", file);

      const res = await pinFileToIPFS(formData);

      ipfsHash = res.IpfsHash;
    } catch (e) {
      console.log(e);
    }
    return ipfsHash;
  };

  const updateRoundHandler = async (newMetadata: RoundMetadata) => {
    try {
      console.log(newMetadata, allo);
      if (!allo || !round.id) return;
      setIpfsStep(true);
      setIsConfirmationModalOpen(false);
      setIsProgressModalOpen(true);

      if (logoImg) {
        const logoCid = await uploadFile(logoImg);
        if (!logoCid) throw new Error("Could not upload round logo.");
        newMetadata = {
          ...newMetadata,
          reportCardMetadata: {
            ...newMetadata.reportCardMetadata,
            logoImg: logoCid,
          },
        };
      }
      if (bannerImg) {
        const bannerCid = await uploadFile(bannerImg);
        if (!bannerCid) throw new Error("Could not upload round banner.");
        newMetadata = {
          ...newMetadata,
          reportCardMetadata: {
            ...newMetadata.reportCardMetadata,
            bannerImg: bannerCid,
          },
        };
      }
      console.log(newMetadata);

      await updateRound({
        roundId: round.id,
        roundAddress: round.payoutStrategy.id as `0x${string}`,
        data: {
          roundMetadata: newMetadata as unknown as AnyJson,
        },
        allo,
        roundCategory: isDirectRound(round)
          ? RoundCategory.Direct
          : RoundCategory.QuadraticFunding,
      });
      setTimeout(() => {
        setIsProgressModalOpen(false);
        window.location.reload();
        setIpfsStep(false);
      }, 2000);
    } catch (e) {
      console.log("error", e);
    }
  };

  const getTweetId = (tweetUrl: string) => {
    if (!tweetUrl?.length) return "";
    const tweetId = tweetUrl.split("/").pop()?.split("?")[0];
    return tweetId ?? "";
  };

  const getSocialPostPlatform = (url: string) => {
    if (url.includes("warpcast.com")) return "FARCASTER";
    else return "TWITTER";
  };

  function validateSocialPostUrl(value: string) {
    let error;

    if (!!value && !twitterRegex.test(value) && !warpcastRegex.test(value)) {
      error = "Invalid Twitter / Farcaster URL";
    }
    return error;
  }

  const OperatorNoticeModal = ({
    onCancel,
    onEdit,
    isOpen,
    setIsOpen,
  }: {
    onCancel: () => void;
    onEdit: () => void;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
  }) => {
    const ShareModalBody = () => (
      <div>
        <p className="mb-2 mt-10">
          You can edit this page to include your organization’s branding and any
          other additional info you want to add. <br />
          Have fun and share with your community!
        </p>

        <div className="items-center gap-y-2 gap-x-4 mt-10 w-full grid sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-lg px-4 py-2.5 font-mono  bg-grey-50 hover:bg-grey-100  transition-all flex items-center justify-center gap-2"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-lg px-4 py-2.5 font-mono  bg-grey-50 hover:bg-grey-100 text-green-200 transition-all flex items-center justify-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>
    );

    return (
      <GenericModal
        title="Hey, It looks like you’re an operator for this round!"
        titleSize={"lg"}
        body={<ShareModalBody />}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    );
  };

  const ShareModal = () => {
    const ShareModalBody = () => (
      <div className="items-center gap-y-2 gap-x-4 mt-10 w-full grid sm:grid-cols-2">
        <ShareButton
          round={round}
          tokenSymbol={tokenSymbol}
          totalUSDCrowdfunded={totalUSDCrowdfunded}
          totalDonations={totalDonations}
          chainId={chainId}
          roundId={roundId}
          type="TWITTER"
        />
        <ShareButton
          round={round}
          tokenSymbol={tokenSymbol}
          totalUSDCrowdfunded={totalUSDCrowdfunded}
          totalDonations={totalDonations}
          chainId={chainId}
          roundId={roundId}
          type="FARCASTER"
        />
      </div>
    );

    return (
      <GenericModal
        title="Share this round’s stats on social media!"
        titleSize={"lg"}
        body={<ShareModalBody />}
        isOpen={isShareModalOpen}
        setIsOpen={setIsShareModalOpen}
      />
    );
  };

  const confirmationModalBody = (
    <p className="text-md text-center font-normal mb-4">
      You will need to sign a transaction to update your round with the latest
      changes.
    </p>
  );

  const RoundPageStatsContent = ({
    formProps,
  }: {
    formProps?: FormikProps<{
      tweets: string[];
      statsDescription: string;
    }>;
  }) => (
    <section className="flex flex-col gap-10 sm:gap-16">
      <div className="w-full">
        <div className="flex justify-end items-center gap-2">
          {isRoundOperator && (
            <>
              {!isEditorOpen ? (
                <EditButton handleClick={handleEdit} />
              ) : (
                <>
                  <CancelButton handleClick={handleCancel} />
                  <SaveButton />
                </>
              )}
            </>
          )}
          {!isEditorOpen && (
            <ShareStatsButton handleClick={() => setIsShareModalOpen(true)} />
          )}
        </div>

        <div className="max-w-3xl w-full m-auto">
          <h2 className="md:text-3xl text-2xl mb-8 flex items-center gap-4 font-modern-era-medium tracking-tighter">
            Round stats
          </h2>

          {isRoundOperator && isEditorOpen ? (
            <Field
              as="textarea"
              name="statsDescription"
              rows={4}
              placeholder="Type here..."
              className="w-full border border-gray-300 text-grey-500 px-2 font-modern-era-medium !text-base -mx-2 -mt-2.5"
              aria-label={"Round stats page description"}
            />
          ) : (
            <p className="whitespace-pre-line break-words text-grey-500 font-modern-era-medium">
              {round.roundMetadata?.reportCardMetadata?.statsDescription ??
                roundPreamble}
            </p>
          )}
        </div>
      </div>
      <Stats
        token={token}
        tokenSymbol={tokenSymbol}
        round={round}
        projectsMatchAmountInToken={projectsMatchAmountInToken}
        totalCrowdfunded={totalUSDCrowdfunded}
        totalDonations={totalDonations}
        totalDonors={round.uniqueDonorsCount ?? 0}
        totalProjects={applications?.length ?? 0}
        chainId={chainId}
        statsLoading={isGetApplicationsLoading}
      />
      {!!applicationsWithMetadataAndMatchingData && !!totalUSDCrowdfunded && (
        <div>
          <ProjectsPlot
            applications={applicationsWithMetadataAndMatchingData}
          />
          <aside className="flex flex-col items-center gap-2">
            <button className="underline" onClick={downloadProjectsCSV}>
              Download the full funding results.
            </button>
            <p className="text-center">
              Please note results are going through ratification in our
              governance process.
            </p>
          </aside>
        </div>
      )}
      {alloVersion === "allo-v2" && (
        <div className="max-w-7xl m-auto">
          <h2 className="w-fit m-auto md:text-3xl text-2xl mb-8 font-modern-era-medium tracking-tighter">
            What people are tweeting{" "}
          </h2>

          {isEditorOpen && isRoundOperator && formProps ? (
            <div className="w-full sm:min-w-[50rem]">
              <p className="mb-4">
                Add up to a maximum of 6 Twitter/Warpcast links below:
              </p>

              <FieldArray name="tweets">
                {({ insert, remove, push }) => (
                  <div>
                    {formProps.values.tweets?.length > 0 &&
                      formProps.values.tweets.map((tweetURL, index) => (
                        <div key={index}>
                          <div className="flex flex-col gap-2">
                            <label htmlFor={`tweets.${index}`}>
                              Twitter / Warpcast post URL
                            </label>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex gap-4 items-center justify-between">
                                <Field
                                  className="w-full border border-grey-300"
                                  name={`tweets.${index}`}
                                  placeholder="https://twitter.com/umarkhaneth/status/1718319104178753678"
                                  type="url"
                                  validate={validateSocialPostUrl}
                                />
                                <div>
                                  <button
                                    type="button"
                                    className="text-3xl hover:opacity-75 transition-all h-fit"
                                    onClick={() => remove(index)}
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>
                              {!!formProps.errors.tweets &&
                                formProps.errors.tweets[index] &&
                                formProps.touched.tweets !== undefined &&
                                formProps.touched.tweets && (
                                  <div className="text-sm text-[#e5524d]">
                                    {formProps.errors.tweets[index]}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    <button
                      type="button"
                      className={`${
                        (formProps.values.tweets?.length ?? 0) >= 6
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer hover:opacity-80"
                      } mt-8 transition-all duration-300 rounded-lg px-4 py-2.5 font-mono border`}
                      onClick={() => push("")}
                      disabled={(formProps.values.tweets?.length ?? 0) >= 6}
                    >
                      Add tweet
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>
          ) : (
            <div className="md:w-[80vw] max-w-4xl m-auto dark">
              <ResponsiveMasonry
                columnsCountBreakPoints={{
                  350: 1,
                  750:
                    (round.roundMetadata?.reportCardMetadata?.socialPostUrls
                      ?.length ?? 0) >= 2
                      ? 2
                      : 1,
                }}
              >
                <Masonry gutter="0.5rem">
                  {!round.roundMetadata?.reportCardMetadata?.socialPostUrls
                    ?.length ? (
                    <div>
                      <TweetEmbed
                        tweetId={getTweetId(defaultTweetURL)}
                        options={{
                          theme: "dark",
                          align: "center",
                          dnt: "true",
                        }}
                      />
                    </div>
                  ) : (
                    round.roundMetadata?.reportCardMetadata?.socialPostUrls.map(
                      (url) => (
                        <div key={url}>
                          {getSocialPostPlatform(url) === "TWITTER" ? (
                            <div className="mx-auto">
                              {/* new library */}
                              {/* <Tweet id={getTweetId(url)} /> */}

                              {/* prev library */}
                              <TweetEmbed
                                tweetId={getTweetId(url)}
                                options={{
                                  theme: "dark",
                                  align: "center",
                                  dnt: "true",
                                }}
                              />
                            </div>
                          ) : (
                            <div className="mx-auto">
                              {/* <ErrorBoundary> */}
                              <FarcasterEmbed url={url} />
                              {/* </ErrorBoundary> */}
                            </div>
                          )}
                        </div>
                      )
                    )
                  )}
                </Masonry>
              </ResponsiveMasonry>
            </div>
          )}
        </div>
      )}
      {!!applicationsWithMetadataAndMatchingData && !!totalUSDCrowdfunded && (
        <RoundLeaderboard
          applications={applicationsWithMetadataAndMatchingData}
        />
      )}
      <div className="max-w-4xl m-auto w-full bg-green-50 rounded-2xl py-8 px-2 flex justify-center items-center gap-5 flex-wrap">
        <p className="text-2xl">Share the results</p>
        <ShareStatsButton handleClick={() => setIsShareModalOpen(true)} />
      </div>

      {/* Modals */}
      <ShareModal />
      <OperatorNoticeModal
        onCancel={() => setIsOperatorNoticeOpen(false)}
        onEdit={() => {
          setIsOperatorNoticeOpen(false);
          setIsEditorOpen(true);
        }}
        isOpen={isOperatorNotice}
        setIsOpen={setIsOperatorNoticeOpen}
      />
      <ConfirmationModal
        title={"Update Round?"}
        body={confirmationModalBody}
        isOpen={isConfirmationModalOpen}
        setIsOpen={() => {
          /**/
        }}
        confirmButtonText={"Proceed to Update"}
        confirmButtonAction={() => {
          updateRoundHandler(newRoundMetadata as unknown as RoundMetadata);
        }}
        cancelButtonAction={() => {
          setIsConfirmationModalOpen(false);
        }}
        modalStyle="wide"
      />
      <ProgressModal
        isOpen={isProgressModalOpen}
        subheading="Please hold while we update your round settings"
        steps={progressSteps}
      />
      <ErrorModal
        isOpen={isErrorModalOpen}
        setIsOpen={() => {}}
        tryAgainFn={() => {}}
        doneFn={() => {
          setIsErrorModalOpen(false);
        }}
      />
    </section>
  );

  return isEditorOpen ? (
    <Formik
      initialValues={{
        tweets: round.roundMetadata?.reportCardMetadata?.socialPostUrls?.length
          ? round.roundMetadata?.reportCardMetadata?.socialPostUrls
          : [""],
        statsDescription:
          round.roundMetadata?.reportCardMetadata?.statsDescription ?? "",
      }}
      validateOnChange={true}
      onSubmit={(values) => {
        const tweets: string[] | undefined = values.tweets?.filter(
          (item) => !!item?.length
        );
        let metadata = _.cloneDeep(newRoundMetadata);
        if (!metadata) return;
        if (tweets)
          metadata = {
            ...metadata,
            reportCardMetadata: {
              ...metadata.reportCardMetadata,
              socialPostUrls: tweets,
            },
          };
        if (values.statsDescription)
          metadata = {
            ...metadata,
            reportCardMetadata: {
              ...metadata.reportCardMetadata,
              statsDescription: values.statsDescription,
            },
          };

        setNewRoundMetadata(metadata);
        setIsConfirmationModalOpen(true);
      }}
    >
      {(props) => (
        <Form>
          <RoundPageStatsContent formProps={props} />
        </Form>
      )}
    </Formik>
  ) : (
    <RoundPageStatsContent />
  );
};

const Stats = ({
  round,
  totalCrowdfunded,
  totalProjects,
  // matching value by projects
  projectsMatchAmountInToken,
  token,
  tokenSymbol,
  totalDonations,
  totalDonors,
  statsLoading,
}: {
  round: Round;
  totalCrowdfunded: number;
  totalProjects: number;
  projectsMatchAmountInToken: number[];
  chainId: number;
  token?: PayoutToken;
  tokenSymbol?: string;
  totalDonations: number;
  totalDonors: number;
  statsLoading: boolean;
}): JSX.Element => {
  const tokenAmount =
    round.roundMetadata?.quadraticFundingConfig?.matchingFundsAvailable ?? 0;

  const { data: poolTokenPrice } = useTokenPrice(token?.redstoneTokenId);

  const matchingPoolUSD = poolTokenPrice
    ? Number(poolTokenPrice) * tokenAmount
    : undefined;
  const matchingCapPercent =
    round.roundMetadata?.quadraticFundingConfig?.matchingCapAmount ?? 0;
  const matchingCapTokenValue = (tokenAmount * matchingCapPercent) / 100;
  const projectsReachedMachingCap: number =
    projectsMatchAmountInToken?.filter(
      (amount) => amount >= matchingCapTokenValue
    )?.length ?? 0;

  return (
    <div className="max-w-6xl m-auto w-full">
      <div className={`xl:grid-cols-3 grid grid-cols-2 gap-2 sm:gap-4`}>
        <StatCard
          statValue={`${formatAmount(tokenAmount, true)} ${tokenSymbol}`}
          secondaryStatValue={`${
            matchingPoolUSD ? `($${formatAmount(matchingPoolUSD ?? 0)})` : ""
          }`}
          statName="Matching Pool"
          isValueLoading={statsLoading}
        />
        <StatCard
          statValue={`$${formatAmount(totalCrowdfunded.toFixed(2))}`}
          statName="Total USD Crowdfunded"
          isValueLoading={statsLoading}
        />
        {!!matchingCapPercent && (
          <StatCard
            statValue={`${matchingCapPercent.toFixed()}% `}
            secondaryStatValue={`(${formatAmount(
              matchingCapTokenValue,
              true
            )} ${tokenSymbol})`}
            statName="Matching Cap"
            isValueLoading={statsLoading}
          />
        )}

        <StatCard
          statValue={formatAmount(totalProjects, true)}
          statName="Total Projects"
          isValueLoading={statsLoading}
        />

        <StatCard
          statValue={formatAmount(totalDonations, true)}
          statName="Total Donations"
          isValueLoading={statsLoading}
        />
        <StatCard
          statValue={formatAmount(totalDonors, true)}
          statName="Total Donors"
          isValueLoading={statsLoading}
        />
      </div>
    </div>
  );
};

const StatCard = ({
  statValue,
  secondaryStatValue,
  statName,
  isValueLoading,
}: {
  statValue: string;
  secondaryStatValue?: string;
  statName: string;
  isValueLoading?: boolean;
}): JSX.Element => {
  return (
    <div className="bg-grey-50 p-4 sm:p-6 rounded-2xl flex flex-col justify-between w-full">
      {isValueLoading ? (
        <div className="w-[80%] rounded text-5 sm:h-9 mb-4 bg-grey-200 animate-pulse" />
      ) : (
        <div className="pb-4">
          <p className="text-xl sm:text-3xl font-mono prose tracking-tighter">
            {statValue}
          </p>
          {!!secondaryStatValue?.length && (
            <p className="text-sm font-mono font-medium prose tracking-tighter">
              {secondaryStatValue}
            </p>
          )}
        </div>
      )}

      <p className="text-sm text-grey-400 font-bold max-w-[20ch]">{statName}</p>
    </div>
  );
};

const ProjectsPlot = ({
  applications,
}: {
  applications: ApplicationWithMatchingData[];
}): JSX.Element => {
  const labelsAndValues = useMemo(() => {
    const amounts: number[] = [];
    const projectNames: string[] = [];
    const parents: string[] = [];

    applications?.forEach((application) => {
      const totalReceived =
        (application.matchingData?.matchAmountUSD ?? 0) +
        application.totalAmountDonatedInUsd;
      amounts.push(totalReceived);

      const projectName = application.project?.metadata?.title;

      projectNames.push(
        `${
          projectName
            ? `${projectName.slice(0, 20)}${
                projectName.length >= 20 ? "..." : ""
              }`
            : "-"
        } `
      );
      parents.push("");
    });

    return { amounts, projectNames, parents };
  }, [applications]);

  return (
    <div className="bg-sand w-full max-w-4xl m-auto">
      <GrantPlot
        values={labelsAndValues.amounts}
        labels={labelsAndValues.projectNames}
      />
    </div>
  );
};

export function RoundBanner(props: {
  canEdit?: boolean;
  bannerImgCid: string | null;
  changeHandler: (logo?: Blob | undefined) => void;
  roundName?: string;
}) {
  const BANNER_WIDTH = 1280,
    BANNER_HEIGHT = 320;

  return (
    <ImageEditor
      canEdit={!!props.canEdit}
      imgCid={props.bannerImgCid ?? undefined}
      type="banner"
      onChange={(file: Blob | undefined) => props.changeHandler(file)}
      roundName={props.roundName || ""}
      imageHeight={BANNER_HEIGHT}
      imageWidth={BANNER_WIDTH}
    />
  );
}

export function RoundLogo(props: {
  canEdit?: boolean;
  logoImgCid: string | null;
  changeHandler: (logo?: Blob | undefined) => void;
  roundName?: string;
}): JSX.Element {
  const LOGO_WIDTH = 128,
    LOGO_HEIGHT = 128;

  // const logoImageUrl = props.imageCid
  //   ? createIpfsImageUrl({
  //       baseUrl: ipfsBaseUrl,
  //       cid: props.imageCid,
  //     })
  //   : "/logo-placeholder.png";
  return (
    // <img
    //   className={"-mt-16 h-32 w-32 rounded-full ring-4 ring-white bg-white"}
    //   src={logoImageUrl as string}
    //   alt={props.alt}
    // />
    <div className="-mt-16">
      <ImageEditor
        canEdit={!!props.canEdit}
        imgCid={props.logoImgCid ?? undefined}
        type="logo"
        onChange={(file: Blob | undefined) => props.changeHandler(file)}
        roundName={props.roundName || ""}
        imageHeight={LOGO_HEIGHT}
        imageWidth={LOGO_WIDTH}
      />
    </div>
  );
}

const RoundLeaderboard = ({
  applications,
}: {
  applications: ApplicationWithMatchingData[];
}): JSX.Element => {
  return (
    <div className="max-w-4xl w-full m-auto px-6 py-12 md:p-12 bg-grey-50 rounded-[2rem]">
      <div className="mb-10 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:flex-row flex-col">
        <h2 className="text-center m-auto md:text-3xl text-2xl font-modern-era-medium tracking-tighter">
          Leaderboard
        </h2>
      </div>
      <div className="overflow-x-auto max-w-[85vw]">
        <div className="flow-root">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead className="text-left text-sm font-semibold uppercase">
                  <tr>
                    <th scope="col" className="py-3 pl-4 pr-3">
                      Rank
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Project name
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Contributions
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Crowdfunded USD
                    </th>
                    <th scope="col" className="relative py-3 pl-3 pr-4">
                      Matched USD
                    </th>
                  </tr>
                </thead>
                <tbody className="text-lg">
                  {applications?.slice(0, 10)?.map((proj, index) => (
                    <tr key={proj.id} className="odd:bg-grey-100 odd:rounded">
                      <td className="whitespace-nowrap py-3 pl-4 pr-3 font-bold text-grey-300">
                        {index + 1}
                      </td>
                      <td className="whitespace-prewrap min-w-[200px] px-3 py-3 font-bold">
                        {proj.project?.metadata?.title.slice(0, 30)}

                        {(proj.project?.metadata?.title.length ?? 0) >= 30
                          ? "..."
                          : ""}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        {formatAmount(proj.uniqueDonorsCount, true)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        $
                        {formatAmount(proj.totalAmountDonatedInUsd?.toFixed(2))}
                      </td>
                      <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right">
                        $
                        {formatAmount(
                          (proj.matchingData?.matchAmountUSD ?? 0).toFixed(2)
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
  );
};

const ShareButton = ({
  round,
  tokenSymbol,
  totalUSDCrowdfunded,
  totalDonations,
  chainId,
  roundId,
  type,
}: {
  round: Round;
  tokenSymbol?: string;
  totalUSDCrowdfunded: number;
  totalDonations: number;
  chainId: ChainId;
  roundId: string;
  type: "TWITTER" | "FARCASTER";
}) => {
  const roundName = round.roundMetadata?.name;
  const tokenAmount =
    round.roundMetadata?.quadraticFundingConfig?.matchingFundsAvailable ?? 0;

  const shareText = `🌐 ${formatAmount(
    tokenAmount,
    true
  )} ${tokenSymbol} matching pool
📈 $${formatAmount(totalUSDCrowdfunded.toFixed(2))} funded so far
🤝 ${formatAmount(totalDonations, true)} donations
👀 Check out ${roundName}’s stats!

${window.location.href}`;

  const embedURL = "";

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${embedURL}`;

  const farcasterShareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    shareText
  )}&embeds[]=${embedURL}`;

  return (
    <>
      {type === "TWITTER" ? (
        <button
          type="button"
          onClick={() => window.open(twitterShareUrl, "_blank")}
          className="w-full flex items-center justify-center gap-2 font-mono hover:opacity-70 transition-all shadow-sm border px-4 py-2 rounded-lg border-black hover:shadow-md"
        >
          <TwitterBlueIcon className="h-6" />
          <span className="flex-shrink-0 text-sm">Share on X</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => window.open(farcasterShareUrl, "_blank")}
          className="w-full flex items-center justify-center gap-2 font-mono hover:opacity-70 transition-all shadow-sm border px-4 py-2 rounded-lg border-black hover:shadow-md"
        >
          <span>
            <WarpcastIcon className="h-6" />
          </span>
          <span className="flex-shrink-0 text-sm">Share on Warpcast</span>
        </button>
      )}
    </>
  );
};

const ShareStatsButton = ({
  handleClick,
}: {
  handleClick: () => void;
}): JSX.Element => {
  return (
    <button
      onClick={handleClick}
      className="rounded-lg px-4 py-2.5 font-mono sm:text-lg bg-green-200 hover:bg-green-300 text-white transition-all flex items-center justify-center gap-2"
      data-testid="share-results-footer"
    >
      <LinkIcon className="w-4 h-4" />
      Share
    </button>
  );
};

const EditButton = ({
  handleClick,
}: {
  handleClick: () => void;
}): JSX.Element => {
  return (
    <button
      onClick={handleClick}
      className="rounded-lg px-4 py-2.5 font-mono sm:text-lg bg-grey-50 hover:bg-grey-100 text-green-200 transition-all flex items-center justify-center gap-2"
    >
      <PencilIcon className="w-4 h-4" />
      Edit
    </button>
  );
};

const CancelButton = ({
  handleClick,
}: {
  handleClick: () => void;
}): JSX.Element => {
  return (
    <button
      onClick={handleClick}
      className="rounded-lg px-4 py-2.5 font-mono sm:text-lg bg-grey-50 hover:bg-grey-100 transition-all flex items-center justify-center gap-2"
    >
      Cancel
    </button>
  );
};

const SaveButton = ({
  handleClick,
  isSaving,
}: {
  handleClick?: () => void;
  isSaving?: boolean;
}): JSX.Element => {
  return (
    <button
      type="submit"
      disabled={isSaving}
      onClick={handleClick}
      className="rounded-lg px-4 py-2.5 font-mono sm:text-lg bg-grey-50 hover:bg-grey-100 text-green-200 border border-green-200 transition-all flex items-center justify-center gap-2"
    >
      <CheckIcon className="w-4 h-4" />
      {isSaving ? "Saving..." : "Save"}
    </button>
  );
};

const formatAmount = (amount: string | number, noDigits?: boolean) => {
  return Number(amount).toLocaleString("en-US", {
    maximumFractionDigits: noDigits ? 0 : 2,
    minimumFractionDigits: noDigits ? 0 : 2,
  });
};

// update round
type SetStatusFn = React.Dispatch<SetStateAction<ProgressStatus>>;

export interface UpdateRoundState {
  IPFSCurrentStatus: ProgressStatus;
  setIPFSCurrentStatus: SetStatusFn;
  roundUpdateStatus: ProgressStatus;
  setRoundUpdateStatus: SetStatusFn;
  indexingStatus: ProgressStatus;
  setIndexingStatus: SetStatusFn;
}

const initialUpdateRoundState: UpdateRoundState = {
  IPFSCurrentStatus: ProgressStatus.NOT_STARTED,
  setIPFSCurrentStatus: () => {
    /* empty */
  },
  roundUpdateStatus: ProgressStatus.NOT_STARTED,
  setRoundUpdateStatus: () => {
    /* empty */
  },
  indexingStatus: ProgressStatus.NOT_STARTED,
  setIndexingStatus: () => {
    /* empty */
  },
};

const useUpdateRound = () => {
  const [IPFSCurrentStatus, setIPFSCurrentStatus] =
    React.useState<ProgressStatus>(initialUpdateRoundState.IPFSCurrentStatus);
  const [roundUpdateStatus, setRoundUpdateStatus] =
    React.useState<ProgressStatus>(initialUpdateRoundState.roundUpdateStatus);

  const [indexingStatus, setIndexingStatus] = React.useState<ProgressStatus>(
    initialUpdateRoundState.indexingStatus
  );

  const updateRound = async (updateRoundData: UpdateRoundData) => {
    console.log(updateRoundData);
    setIPFSCurrentStatus(initialUpdateRoundState.IPFSCurrentStatus);
    setRoundUpdateStatus(initialUpdateRoundState.roundUpdateStatus);
    setIndexingStatus(initialUpdateRoundState.indexingStatus);

    //
    interface _updateRoundParams {
      context: UpdateRoundState;
      updateRoundData: UpdateRoundData;
    }

    const _updateRound = async ({
      context,
      updateRoundData,
    }: _updateRoundParams) => {
      const { setIPFSCurrentStatus, setRoundUpdateStatus, setIndexingStatus } =
        context;

      const { roundId, roundAddress, data, allo, roundCategory } =
        updateRoundData;

      let id;
      if (!roundId.toString().startsWith("0x")) {
        id = Number(roundId);
      } else {
        id = roundId as Hex;
      }

      if (data.applicationMetadata || data.roundMetadata) {
        setIPFSCurrentStatus(ProgressStatus.IN_PROGRESS);
      } else {
        setRoundUpdateStatus(ProgressStatus.IN_PROGRESS);
      }

      await allo
        .editRound({
          roundId: id,
          roundAddress,
          data,
          strategy: roundCategory,
        })
        .on("ipfs", (res: any) => {
          if (res.type === "success") {
            setIPFSCurrentStatus(ProgressStatus.IS_SUCCESS);
            setRoundUpdateStatus(ProgressStatus.IN_PROGRESS);
          } else {
            console.error("IPFS Error", res.error);
            setIPFSCurrentStatus(ProgressStatus.IS_ERROR);
          }
        })
        .on("transactionStatus", (res: any) => {
          if (res.type === "success") {
            setRoundUpdateStatus(ProgressStatus.IS_SUCCESS);
            setIndexingStatus(ProgressStatus.IN_PROGRESS);
          } else {
            console.error("Transaction Status Error", res.error);
            setRoundUpdateStatus(ProgressStatus.IS_ERROR);
          }
        })
        .on("indexingStatus", (res: any) => {
          if (res.type === "success") {
            setIndexingStatus(ProgressStatus.IS_SUCCESS);
          } else {
            console.error("Indexing Status Error", res.error);
            setIndexingStatus(ProgressStatus.IS_ERROR);
          }
        })
        .execute();
      //
    };

    return _updateRound({
      context: {
        IPFSCurrentStatus,
        setIPFSCurrentStatus,
        roundUpdateStatus,
        setRoundUpdateStatus,
        indexingStatus,
        setIndexingStatus,
      },
      updateRoundData,
    });
  };
  return {
    updateRound,
    IPFSCurrentStatus: IPFSCurrentStatus,
    roundUpdateStatus: roundUpdateStatus,
    indexingStatus: indexingStatus,
  };
};

const useAllo = (alloVersion: "allo-v1" | "allo-v2") => {
  const { chain } = useNetwork();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainID = chain?.id;

  const [backend, setBackend] = useState<Allo | null>(null);

  const config = {
    allo: {
      version: alloVersion,
    },
    pinata: {
      jwt: process.env.NEXT_PUBLIC_PINATA_JWT ?? "",
      baseUrl: process.env.NEXT_PUBLIC_PINATA_BASE_URL ?? "",
    },
    dataLayer: {
      gsIndexerEndpoint: process.env.NEXT_PUBLIC_INDEXER_V2_API_URL ?? "",
    },
  };
  function isChainIdSupported(chainId: number) {
    if (chainId === 424 && config.allo.version === "allo-v2") {
      return false;
    }
    return Object.values(ChainId).includes(chainId);
  }
  const chainIdSupported = chainID ? isChainIdSupported(chainID) : false;

  useEffect(() => {
    if (!publicClient || !walletClient || !chainID || !chainIdSupported) {
      setBackend(null);
    } else {
      let alloBackend: Allo;

      if (config.allo.version === "allo-v2") {
        alloBackend = new AlloV2({
          chainId: chainID,
          transactionSender: createViemTransactionSender(
            walletClient,
            publicClient
          ),
          ipfsUploader: createPinataIpfsUploader({
            token: config.pinata.jwt,
            endpoint: `${config.pinata.baseUrl}/pinning/pinFileToIPFS`,
          }),
          waitUntilIndexerSynced: createWaitForIndexerSyncTo(
            `${config.dataLayer.gsIndexerEndpoint}/graphql`
          ),
        });

        setBackend(alloBackend);
      } else {
        alloBackend = new AlloV1({
          chainId: chainID,
          transactionSender: createViemTransactionSender(
            walletClient,
            publicClient
          ),
          ipfsUploader: createPinataIpfsUploader({
            token: config.pinata.jwt,
            endpoint: `${config.pinata.baseUrl}/pinning/pinFileToIPFS`,
          }),
          waitUntilIndexerSynced: createWaitForIndexerSyncTo(
            `${config.dataLayer.gsIndexerEndpoint}/graphql`
          ),
        });

        setBackend(alloBackend);
      }
    }
  }, [publicClient, walletClient, chainID]);

  return backend;
};

const ImageEditor = ({
  type,
  onChange,
  canEdit,
  roundName,
  imgCid,
  imageWidth,
  imageHeight,
}: {
  type: "banner" | "logo";
  onChange: (file: Blob | undefined) => void;
  canEdit: boolean;
  roundName: string;
  imgCid?: string;
  imageWidth: number;
  imageHeight: number;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newImgSrc, setNewImgSrc] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const blobUrlRef = useRef("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(
    type == "banner" ? 4 : 1
  );
  const inputImage = useRef<any>(null);

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

  async function handleChange() {
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

    const offscreen = new OffscreenCanvas(imageWidth, imageHeight);
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

    onChange(blob);
    setNewImgSrc("");
  }

  useEffect(() => {
    const resetUploadedImg = () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = "";
      onChange(undefined);
      setNewImgSrc("");
    };

    if (!canEdit) {
      resetUploadedImg();
    }
  }, [canEdit, onChange]);

  const handleSelectImg = async () => {
    await handleChange();
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="z-[20] flex justify-center relative">
        {!!blobUrlRef.current && canEdit ? (
          <Image
            alt="new round banner"
            src={blobUrlRef.current}
            width={imageWidth}
            height={imageHeight}
            className={`${type == "banner" ? "aspect-[4]" : "aspect-square"} ${
              type === "logo"
                ? "h-32 w-32 rounded-full ring-4 ring-white bg-white"
                : ""
            } object-fill rounded-3xl shadow-lg`}
          />
        ) : !!imgCid ? (
          <IpfsImage
            type={type}
            cid={imgCid}
            alt={roundName}
            width={imageWidth}
            height={imageHeight}
            className={`${type == "banner" ? "aspect-[4]" : "aspect-square"} ${
              type === "logo"
                ? "h-32 w-32 rounded-full ring-4 ring-white bg-white"
                : ""
            } object-fill rounded-3xl shadow-lg`}
          />
        ) : (
          <Image
            src={
              type === "banner"
                ? "/banner-placeholder.png"
                : "/logo-placeholder.png"
            }
            alt=""
            width={imageWidth}
            height={imageHeight}
            className={`${type == "banner" ? "aspect-[4]" : "aspect-square"} ${
              type === "logo"
                ? "h-32 w-32 rounded-full ring-4 ring-white bg-white"
                : ""
            } object-fill rounded-3xl shadow-lg`}
          />
        )}
        {canEdit && (
          <Button
            $variant="outline"
            className={`${
              type === "logo"
                ? "p-1 right-[50%] bottom-[50%] translate-x-[50%] translate-y-[50%]"
                : "right-5 bottom-5"
            } text-sm cursor-pointer absolute flex gap-2 items-center justify-end`}
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            {type === "banner" ? (
              <>
                <span className="text-xs hidden sm:block">
                  Recommended size: <br />
                  {imageWidth} x {imageHeight}
                </span>
                <div>
                  <CameraIcon className="sm:w-8 sm:h-8 w-5 h-5" />
                </div>
              </>
            ) : (
              <div>
                <CameraIcon className="sm:w-5 sm:h-5 w-4 h-4" />
              </div>
            )}
          </Button>
        )}
      </div>
      <GenericModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        title="Select image"
        size={"full"}
      >
        <div className="">
          <div className="">
            <div className="flex justify-end mb-2 w-full">
              {!!completedCrop && !!newImgSrc && canEdit && (
                <>
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
              {!!newImgSrc ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  minHeight={100}
                  circularCrop={type === "logo"}
                >
                  <Image
                    ref={imgRef}
                    alt="Crop me"
                    src={newImgSrc}
                    onLoad={onImageLoad}
                    width={imageWidth}
                    height={imageHeight}
                    className={`object-fill rounded-3xl shadow-lg ${
                      type === "logo"
                        ? "h-32 w-32 rounded-full ring-4 ring-white bg-white"
                        : ""
                    }`}
                  />
                </ReactCrop>
              ) : (
                <div className="">
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onSelectFile}
                      ref={inputImage}
                      style={{ display: "none" }}
                    />
                    <Button
                      $variant="outline"
                      className="cursor-pointer flex flex-col gap-2 items-center p-8"
                      onClick={() => {
                        inputImage.current?.click();
                      }}
                    >
                      <p>Click to Upload</p>
                      <div className="text-sm">
                        Recommended size: <br />
                        {imageWidth} x {imageHeight}
                      </div>
                    </Button>
                  </>
                </div>
              )}
            </div>
          </div>

          {newImgSrc && (
            <div className="flex items-center justify-end mt-10 gap-4">
              <Button
                $variant="outline"
                className="text-sm  cursor-pointer flex gap-2 items-center justify-end"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewImgSrc("");
                }}
              >
                Cancel
              </Button>
              <Button
                $variant="outline"
                className="text-sm cursor-pointer flex gap-2 items-center justify-end"
                onClick={handleSelectImg}
              >
                Select
              </Button>
            </div>
          )}
        </div>
      </GenericModal>
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
