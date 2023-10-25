import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { COMMUNITY_ROUND_ADDRESS } from '../constants/community-round';

const Home: NextPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.push(`/1/${COMMUNITY_ROUND_ADDRESS}`);
  }, [router]);
  return (<></>)
};

export default Home;
