import Image from "next/image";
import { useState } from "react";
import useAsyncEffect from "use-async-effect";
import loadingBanner from "/assets/loading-banner.png";
import loadingLogo from "/assets/loading-logo.png";

export default function IpfsImage({
  cid,
  width,
  height,
  alt,
  className,
  type,
}: {
  cid: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  type?: "banner" | "logo";
}) {
  const [src, setSrc] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  useAsyncEffect(async () => {
    setSrc("");
    try {
      let response = await fetch(
        `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${cid}`
      );
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);
      setSrc(objectURL);
    } catch (err) {
      console.log(err);
    }
  }, [setSrc, cid]);
  return (
    <Image
      onLoad={handleLoad}
      loading="lazy"
      width={width}
      height={height}
      src={
        type && (isLoading || !src)
          ? type == "banner"
            ? loadingBanner
            : loadingLogo
          : src
      }
      alt={alt}
      className={`${className} ${isLoading || !src ? "animate-pulse" : ""}`}
    />
  );
}
