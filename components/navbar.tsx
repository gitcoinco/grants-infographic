"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import GitcoinLogo from "/assets/gitcoinlogo-black.svg";

export default function Navbar() {
  const exploreRoundsLink = `https://explorer.gitcoin.co/#/rounds?orderBy=MATCH_AMOUNT_IN_USD_DESC&status=active%2Ctaking_applications`;

  return (
    <nav
      className={`blurred fixed w-full z-20 shadow-[0_4px_24px_0px_rgba(0,0,0,0.08)]`}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-20 max-w-screen-2xl">
        <div className="flex justify-between h-16">
          <div className="flex">
            <a
              href="https://explorer.gitcoin.co/"
              className="flex-shrink-0 flex items-center"
            >
              <div className="flex gap-1 lg:gap-3 items-center">
                <GitcoinLogo />
              </div>
            </a>
          </div>

          <div className="flex items-center gap-6">
            <a
              href={exploreRoundsLink}
              className="font-medium hover:underline hidden md:block"
            >
              Explore rounds
            </a>
            <div>
              <ConnectButton
                showBalance={false}
                accountStatus={{
                  smallScreen: "avatar",
                  largeScreen: "full",
                }}
                chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
