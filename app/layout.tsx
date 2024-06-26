import { PAGE_DESCRIPTION } from "../constants";
import AppProviders from "../providers";
import "tailwindcss/tailwind.css";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { DM_Mono } from "next/font/google";
import GlobalLayout from "../components/global-layout";
import { Suspense } from "react";
import Loading from "./loading";
import { Metadata } from "next/types";
import Script from "next/script";
import localFont from "next/font/local";

const mono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-dm-mono",
});

const sans = localFont({
  src: [
    {
      path: "./ModernEra-Regular.woff",
      weight: "400",
      style: "normal",
    },
    { path: "./modern-era-medium.otf", weight: "500", style: "normal" },
    { path: "./modern-era-bold.otf", weight: "600", style: "normal" },
  ],
  variable: "--font-modern-era",
});

export const metadata: Metadata = {
  title: {
    default: "Gitcoin Round Report Cards",
    template: "%s | Gitcoin Round Report Card",
  },
  description: PAGE_DESCRIPTION,
  icons: {
    icon: "https://assets-global.website-files.com/6433c5d029c6bb75f3f00bd5/6433c5d029c6bb9127f00c07_gitcoin-fav3.png",
    shortcut:
      "https://assets-global.website-files.com/6433c5d029c6bb75f3f00bd5/6433c5d029c6bb9127f00c07_gitcoin-fav3.png",
    apple:
      "https://assets-global.website-files.com/6433c5d029c6bb75f3f00bd5/6433c5d029c6bb9127f00c07_gitcoin-fav3.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} font-sans`}>
      {process.env.NODE_ENV === "production" && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=G-JSM7V1YTCB`}
          />

          <Script id="gtag" strategy="afterInteractive">
            {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-JSM7V1YTCB', {
                    page_path: window.location.pathname,
                    });
                `}
          </Script>
        </>
      )}
      <body>
        <AppProviders>
          <GlobalLayout>
            <Suspense
              fallback={
                <div className="pt-28">
                  <Loading />
                </div>
              }
            >
              {children}
            </Suspense>
          </GlobalLayout>
        </AppProviders>
      </body>
    </html>
  );
}
