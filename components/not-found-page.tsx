"use client";
import Navbar from "./navbar";
import Footer from "./footer";
import React, { Suspense } from "react";
import { Button } from "../app/styles";

export default function NotFoundPage() {
  return (
    <>
      <div className="relative top-16 lg:mx-20 h-screen px-4 py-7">
        <main>
          <div className="flex pt-8">
            <div className="m-auto text-center mt-5">
              <h1 className="my-5 text-sm text-red-100 font-bold">404 ERROR</h1>
              <h2 className="my-5 text-4xl">
                Uh oh! You might be a little lost
              </h2>

              <p className="text-grey-400 mb-0">
                It looks like the page you’re looking for doesn’t exist.
              </p>
              <p className="text-grey-400 mt-1 mb-5">
                For support, contact us on{" "}
                <a href="https://discord.com/invite/gitcoin">Discord.</a>
              </p>

              <a href="https://explorer.gitcoin.co/#/">
                <Button
                  $variant="outline"
                  type="button"
                  className="px-3 bg-violet-100 text-violet-400 border-0 text-xs"
                >
                  Go back home
                </Button>
              </a>

              <Suspense
                fallback={
                  <div
                    style={{
                      width: "502px",
                      height: "360px",
                    }}
                  />
                }
              >
                {/* <NotFoundBanner className="max-w-full" /> */}
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
