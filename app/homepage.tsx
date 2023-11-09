"use client";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COMMUNITY_ROUND_ADDRESS } from "../constants/community-round";

const Homepage: NextPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.push(`/1/${COMMUNITY_ROUND_ADDRESS}`);
  }, [router]);
  return (
    <>
    </>
  );
};

export default Homepage;
