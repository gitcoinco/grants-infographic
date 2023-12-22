"use client";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { COMMUNITY_ROUND_ADDRESS } from "../constants/community-round";
import Loading from "./loading";

const Homepage: NextPage = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    startTransition(() => {
      router.push(`/1/${COMMUNITY_ROUND_ADDRESS}`);
    });
  }, [router]);
  return (
    <>
      {isPending && (
        <div className="pt-28">
          <Loading />
        </div>
      )}
    </>
  );
};

export default Homepage;
