
import type { NextPage } from 'next';
import { Address, useAccount, useConnect, useEnsName } from 'wagmi';
import { useEffect, useRef, useState } from 'react';
import roundImplementation from '../api/abi/roundImplementation';
import { useContractRead } from 'wagmi'
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import ProjectCard from '../components/project-card';
import Card from '../components/card';
import projectsDivider from '/assets/projects-divider.svg';
import downloadIcon from '../assets/download-icon.svg';
import networkGraph from '/assets/network-graph.png';
import { crowdfundingAmount, totalAmount, numberOfContributions, names, COMMUNITY_ROUND_ADDRESS, stats, projectsData, leaderboardData} from '../constants/community-round';
// let GrantPlot = lazy(() => import("../components/grant-plot"));
import dynamic from 'next/dynamic';
import { formatAmount } from '../api/utils';
const GrantPlot = dynamic(import('../components/grant-plot'), {
  ssr: false
});

const Home: NextPage = () => {
  const reportTemplateRef = useRef(null);
    
   const createPDF = useReactToPrint({
    content: () => reportTemplateRef.current,
  });
  const [w, setW] = useState(0);
    useEffect(() => {
      const width = window.innerWidth;
      if (width) setW(w);
    }, [w]);
  return (
    <div>
     
        <div id="report" ref={reportTemplateRef}>
          <div className='flex flex-col gap-16 max-w-inherit'>
            <div className='flex justify-center mt-6'>
            <div className="">
              <div className="flex justify-between sm:gap-8 gap-4 sm:items-center mb-12 sm:flex-row flex-col">
                <h1 className='text-2xl sm:text-3xl font-semibold'>Beta Round: Web3 Community & Education</h1>
                <button onClick={createPDF} className="group z-50 cursor-pointer hover:border-dark transition-all duration-300 rounded-[12px] h-fit w-fit border-2 border-green text-green py-1 px-4 flex items-center gap-2">
                  <Image src={downloadIcon} width="12" height="12" alt="download icon" className='transition-all group-hover:translate-y-0.5' />
                  PDF
                </button>
              </div>
              <h2 className='text-blue mb-4 text-3xl font-grad'>Thank You!</h2>
              <p className='max-w-xl text-lg text-justify'>
                <i>Thank You Our Matching Partners: </i><br/>
                Vitalik Buterin, the Ethereum Foundation, Go+ & DMC.
              </p>
            </div>
          </div>
          <Card>
            <div className='flex flex-col gap-4'>
              <h2 className="text-xl mb-6">Beta Round: Web3 Community & Education</h2>
              <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 child:py-2">
                <div>
                  <p className="text-orange text-xl pb-2 font-grad">$ {formatAmount(stats.matchingPool.toFixed(2))}</p>
                  <p className="sm:text-base text-sm">Matching Pool</p>
                </div>
                <div>
                  <p className="text-orange text-xl pb-2 font-grad">$ {formatAmount(stats.usdCrowdfunded.toFixed(2))}</p>
                  <p className="sm:text-base text-sm">Total USD Crowdfunded</p>
                </div>
                <div>
                  <p className="text-orange text-xl pb-2 font-grad">{stats.matchingCapPercent.toFixed()}% (${formatAmount(stats.matchingCapValue)})</p>
                  <p className="sm:text-base text-sm">Matching Cap</p>
                </div>
                <div>
                  <p className="text-orange text-xl pb-2 font-grad">{stats.donationsMatchedPercent.toFixed(1)}%</p>
                  <p className="sm:text-base text-sm">Donations Matched</p>
                </div>
                <div className="!h-[1px] xl:col-span-4 md:col-span-2 border-b border-purple"></div>
                <div>
                  <p className="text-orange text-xl pb-2 font-grad">{formatAmount(stats.totalProjects)}</p>
                  <p className="sm:text-base text-sm">Total Projects</p>
                </div>
                <div>
                  <p className="text-orange text-xl pb-2 font-grad">{formatAmount(stats.totalDonations)}</p>
                  <p className="sm:text-base text-sm">Total Donations</p>
                </div>
                <div>
                  <p className="text-orange text-xl pb-2 font-grad">{formatAmount(stats.totalDonors)}</p>
                  <p className="sm:text-base text-sm">Total Donors</p>
                </div>
                <div>
                  <p className="text-orange text-xl pb-2 font-grad">{stats.projectsReachingMatchingCap}</p>
                  <p className="sm:text-base text-sm">{stats.projectsReachingMatchingCap == 1 ? 'Project' : 'Projects'} Reaching Matching Cap</p>
                </div>
              </div>
              <div className={`flex items-center justify-center`}>
                <GrantPlot 
                  values={projectsData?.map(ap => ap.totalAmount) || []}
                  labels={projectsData?.map(ap => ap.name) || []}
                />
             </div>
            </div>
          </Card>
            
         
          <div className='max-w-xl  m-auto mb-6'>
            <h2 className='text-3xl text-blue mb-4 font-grad'>Preamble</h2>
            <p className='text-justify'>
              Each Gitcoin round is a distinct journey, filled with unexpected twists and turns. New projects can suddenly gain momentum, while established ones may lose their spark. However, the common denominator in all these scenarios is the amount of intentional effort invested in fostering community engagement. A project backed by a supportive community is a powerful indicator of ongoing success, and this is particularly evident in the Web 3 Community & Education round.
              <br/><br/>
              This round marks our first venture into Community & Education, building on the foundation of the Media round we initiated in 2020. This previous round brought to light remarkable projects like Bankless, Week in Ethereum News, and the Zero Knowledge Podcast. We are grateful for your support, which has enabled the community to rally behind more such initiatives. Given its grassroots nature, Quadratic Funding could be an ideal mechanism to gather signals and identify promising projects in this area.
              <br/><br/>
              The top 10 grantees, by matching funding, represent an accomplished global community. They include Taiwan&apos;s #1 podcast, an education and services DAO promoting adoption in Africa, a talent incubator for women builders in Latin America, the  pseudonymous scam investigator ZachXBT whose work has been featured in NYT and <a className="link" href="https://twitter.com/BanklessHQ/status/1669807545194803200" target="_blank">right now needs your help</a>, and an international collective of governance researchers from institutions including Harvard, the University of Oxford, and Microsoft. We can’t wait to see what the future holds for all of the projects in this round!
            </p>
            <div className='flex flex-col items-center justify-center gap-3 mt-6'>
              <Card noPadding={true}><Image src={networkGraph} alt="community round network graph" width='500' height='500' /></Card>
              <p className='text-xs'>Network Graph of Donors(red) and Grantees(blue) based on round data. <a className="link" href="https://gitcoin-beta-networks.streamlit.app/" target="_blank">Explore it here.</a></p>
            </div>
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
                          { projectsData.slice(0,10)?.map((proj, index) => (
                            <tr key={proj.name} className="even:bg-light-orange">
                              <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium">
                                {index + 1}
                              </td>
                              <td className="whitespace-prewrap min-w-[200px] px-3 py-3 text-sm">{proj.name}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-sm text-right">{proj.contributions || 0}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-sm text-right">${formatAmount(proj.crowdfundingAmount.toFixed(2))}</td>
                              <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium">
                                ${formatAmount(proj.daiMatch.toFixed(2))}
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
            { leaderboardData.map(proj => (
              <div key={proj.name} className='pt-8 flex flex-col items-center gap-8'>
                <ProjectCard name={proj.name} link={proj.link} description={proj.description} imgSrc={`https://ipfs.io/ipfs/${proj.logo}`} />
                <Image src={projectsDivider} alt="" width="138" height="83" />
              </div>
          ) )}
          </div>


          <div className='max-w-xl m-auto mb-6'>
            <h2 className='text-blue mb-4 text-3xl font-grad'>In closing</h2>
            <p className='text-justify'>
              Thank you to all our partners for helping make this round possible and for your continued support of Gitcoin. Gitcoin wouldn’t be here today without the ideals, drive, and  dedication that you possess. 
              <br/><br/>
              The Web3 community continues to grow with your example and support. Some of the grantees in this round are familiar favorites and others are relative unknowns. We look forward to seeing how they all evolve as a result of your contributions and this round. 
              <br/><br/>
              In the near future, we’ll be sharing more of our thoughts and learnings from the Beta round but in the meantime we wanted to take a moment to celebrate the incredible work of the grantees in this round. 
              <br/><br/>
              Public goods are good.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
