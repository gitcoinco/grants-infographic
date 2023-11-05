import { Html, Head, Main, NextScript } from "next/document";
import { PAGE_DESCRIPTION } from "../constants";
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://use.typekit.net/hbx6hnl.css" />
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Gitcoin Round Report Cards" />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta
          name="twitter:image"
          content="https://reportcards.gitcoin.co/report-cards-twitter-card.jpg"
        />
        <meta property="og:title" content="Gitcoin Round Report Cards" />
        <meta property="og:url" content="https://reportcards.gitcoin.co/" />
        <meta
          property="og:image"
          content="https://reportcards.gitcoin.co/report-cards-twitter-card.jpg"
        />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <link rel="icon" type="image/x-icon" href="https://assets-global.website-files.com/6433c5d029c6bb75f3f00bd5/6433c5d029c6bb9127f00c07_gitcoin-fav3.png" />
        
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
