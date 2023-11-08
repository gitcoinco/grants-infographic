import { PAGE_DESCRIPTION } from "../constants";
import AppProviders from "../providers";
import "tailwindcss/tailwind.css";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Inter } from "next/font/google";
import GlobalLayout from "../components/global-layout";
import { Suspense } from "react";
import Loading from "./loading";
import { Metadata } from "next/types";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" className={inter.className}>
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
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </GlobalLayout>
        </AppProviders>
      </body>
    </html>
  );
}
