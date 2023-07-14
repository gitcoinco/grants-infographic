
import type { NextPage } from 'next';
import { Address } from 'wagmi';
import { useEffect, useRef, useState } from 'react';
import { ProjectApplication, getProjectsApplications, getRoundById, getRoundContributors } from '../api/round';
import { Round } from '../api/types';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import ProjectCard from '../components/project-card';
import Stats from '../components/stats';
import Card from '../components/card';
import Link from 'next/link';
import projectsDivider from '/assets/projects-divider.svg';
import downloadIcon from '../assets/download-icon.svg';
import {  COMMUNITY_ROUND_ADDRESS} from '../constants/community-round';

// let GrantPlot = lazy(() => import("../components/grant-plot"));
import dynamic from 'next/dynamic'
import { formatAmount, sortByMatch } from '../api/utils';
const GrantPlot = dynamic(import('../components/grant-plot'), {
  ssr: false
});

const Home: NextPage = () => {
  // const { address, isConnected } = useAccount();
  const [roundData, setRoundData] = useState<Round>();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageError, setPageError] = useState({value: false, message: ""});
  const reportTemplateRef = useRef(null);
  const [applications, setApplications ] = useState<ProjectApplication[]>();
  const [totalContributors, setTotalContributors] = useState(0);
  const router = useRouter();
  const id = router.query.grantId as Address;  

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.pathname);
    }
   
    const get = async (roundId: Address) => {
      try {
        const {data, error, success } = await getRoundById(roundId, 1);
        if (!success) throw new Error(error);
        setPageError({value: false, message: ''});
        setRoundData(data);
  
        const applications = await getProjectsApplications(roundId, data?.roundMetadata?.quadraticFundingConfig?.matchingFundsAvailable || 0);
        const sorted = sortByMatch(applications || []);
        setApplications(sorted);

        const contributors = await getRoundContributors(roundId);
        setTotalContributors(contributors?.length || 0);
      } catch (err) {
        setPageError({value: true, message: 'An error occured.'});
      } finally {
        setIsPageLoading(false);
      }
    };
    id ? get(id) : () => {setIsPageLoading(false); setPageError({value: true, message:'Grant not found'})};
  }, [id]);

   const createPDF = useReactToPrint({
    content: () => reportTemplateRef.current,
  });

  return (
    <div>
      
    { isPageLoading ? (
        <p>Loading...</p>
      ) : !id ? (
        <>
        <p>Grant not found. <Link href={`/${COMMUNITY_ROUND_ADDRESS}`} className='text-blue'>Here is the latest grant</Link> </p>
        </>
      ) : pageError.value || !roundData ? (
        <>
        
          {/* <p>{pageError.message} </p> */}
          <p>Grant not found. <Link href={`/${COMMUNITY_ROUND_ADDRESS}`} className='text-blue'>Here is the latest grant</Link> </p>
        </>
      ) : ( 
        <div id="report" ref={reportTemplateRef}>
          <div className='flex flex-col gap-16 max-w-screen'>
            <div className='flex justify-center mt-6'>
            <div className="">
              <div className="flex justify-between sm:gap-8 gap-4 sm:items-center mb-12 sm:flex-row flex-col">
                <h1 className='text-2xl sm:text-3xl font-semibold'>{roundData.roundMetadata?.name}</h1>
                <button onClick={createPDF} className="group z-50 cursor-pointer hover:border-dark transition-all duration-300 rounded-[12px] h-fit w-fit border-2 border-green text-green py-1 px-4 flex items-center gap-2">
                  <Image src={downloadIcon} width="12" height="12" alt="download icon" className='transition-all group-hover:translate-y-0.5' />
                  PDF
                </button>
              </div>
              <h2 className='text-blue mb-4 text-3xl font-grad'>Thank You!</h2>
              <p className='max-w-xl text-lg text-justify'>Tellus in metus vulputate eu scelerisque felis imperdiet proin. Sit amet dictum sit amet justo donec enim diam. Massa tincidunt dui ut ornare lectus sit amet est placerat.</p>
            </div>
          </div>
          <Stats 
            round={roundData} 
            totalContributions={applications?.reduce(
            (accumulator, currentValue) => accumulator + currentValue.votesArray?.length || 0,
            0
          ) || 0}
          totalContributors={totalContributors}
          totalCrowdfunded={applications?.reduce(
            (accumulator, currentValue) => accumulator + currentValue.amountUSD,
            0
          ) || 0}
          totalProjects={applications?.length || 0}
          >
             <GrantPlot 
              values={applications?.map(ap => ap.match + ap.amountUSD) || []}
              labels={applications?.map(ap => ap.metadata.application.project.title) || []}
            />
          </Stats>
          <div className='max-w-xl  m-auto'>
          <h2 className='text-3xl text-blue mb-4 font-grad'>Preamble</h2>
            <p className='text-justify'>Tellus in metus vulputate eu scelerisque felis imperdiet proin. Sit amet dictum sit amet justo donec enim diam. Massa tincidunt dui ut ornare lectus sit amet est placerat. Amet porttitor eget dolor morbi non arcu risus quis varius. A lacus vestibulum sed arcu non odio euismod lacinia at. Eu sem integer vitae justo. Enim blandit volutpat maecenas volutpat blandit. Neque sodales ut etiam sit. Lobortis mattis aliquam faucibus purus in massa tempor nec feugiat. Ut morbi tincidunt augue interdum. Nibh tellus molestie nunc non. Enim ut sem viverra aliquet eget sit amet tellus. Elementum curabitur vitae nunc sed velit dignissim sodales ut eu. Leo in vitae turpis massa sed elementum tempus egestas sed. In hac habitasse platea dictumst. Enim sit amet venenatis urna cursus. Metus aliquam eleifend mi in. Ac placerat vestibulum lectus mauris ultrices. Nam libero justo laoreet sit.</p>
          </div>
          
          <Card>
            <div className='max-w-[75vw]'>
              <h2 className='text-blue text-3xl mb-6 text-center font-grad font-normal'>Leaderboard</h2>
              <div className='overflow-x-auto'>
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
                            <th scope="col" className="relative py-3 pl-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-black">
                              DAI Match
                            </th>
                          </tr>
                        </thead>
                        <tbody className="">
                          { applications?.slice(0,10)?.map((proj, index) => (
                            <tr key={proj.id} className="even:bg-light-orange">
                              <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium">
                                {index + 1}
                              </td>
                              <td className="whitespace-prewrap min-w-[200px] px-3 py-3 text-sm">{proj.metadata.application.project.title}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-sm text-right">{formatAmount(proj.votes)}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-sm text-right">${formatAmount(proj.amountUSD.toFixed(2))}</td>
                              <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium">
                                ${formatAmount(proj.match.toFixed(2))}
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

          <div className='flex flex-col gap-8 max-w-3xl m-auto'>
            { applications?.slice(0, 10).map(proj => (
              <div key={proj.id} className='pt-8 flex flex-col items-center gap-8'>
                <ProjectCard link={''} name={proj.metadata.application.project?.title} description={proj.metadata.application.project?.description} imgSrc={`https://ipfs.io/ipfs/${proj.metadata.application.project?.logoImg}`} />
                <Image src={projectsDivider} alt="" width="138" height="83" />
              </div>
          ) )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Home;
