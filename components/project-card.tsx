import Image from "next/image";
import { useState } from "react";
import { formatAmount } from "../api/utils";

export default function ProjectCard({
  imgSrc,
  name,
  description,
  link,
  matchAmount,
  contributions,
  crowdfundedAmount
}: {
  imgSrc: string;
  name: string;
  description: string;
  link?: string;
  matchAmount?: number;
  contributions: number;
  crowdfundedAmount?: number;
}) {
  const [isSliced, setIsSliced] = useState(true);
  const descriptionArray = description.split("\n");

  return (
    <div className="flex gap-8 flex-col max-w-[90vw]">
      <div className="flex-shrink-0 flex gap-8 items-center">
        <div className="flex-shrink-0 border border-orange rounded-[4px] p-0.5 bg-gradient-to-br from-peach via-yellow to-light-pink">
          <div className="rounded-[32px] p-1.5 bg-sand border border-orange">
            <img
              src={imgSrc}
              width="200"
              height="200"
              alt={name}
              className="rounded-[32px] w-16 h-16 md:w-[90px] md:h-[90px]"
            />
          </div>
        </div>
        <div>
          <h3 className="text-blue text-md sm:text-2xl font-grad hover:underline">
            {link ? (
              <a href={link} target="_blank">
                {name}{" "}
              </a>
            ) : (
              <span>{name}</span>
            )}
          </h3>
          <h5 className="text-dark text-xs sm:text-base font-grad hover:underline mt-2">
            <pre>
              {formatAmount(contributions, true)} contributions
              <br />${formatAmount((crowdfundedAmount || 0)?.toFixed(2))}{" "}
              crowdfunded
              <br />${formatAmount((matchAmount || 0).toFixed(2))} matching
              funded
            </pre>
          </h5>
        </div>
      </div>

      <p className="max-w-[90vw]">
        {description
          .slice(0, isSliced ? 500 : description.length)
          .split("\n")
          .map((item, index) => (
            <span
              key={index}
              className={`
                ${
                  index !==
                  (isSliced
                    ? description.slice(0, 500).split("\n").length - 1
                    : descriptionArray.length - 1)
                    ? "block mb-3 "
                    : ""
                } whitespace-pre-line text-justify 2xl:text-base text-sm break-words`}
            >
              {item}
            </span>
          ))}

        {isSliced && description.length >= 500 && <span>...</span>}

        {description.length >= 500 && (
          <a
            onClick={() => setIsSliced(!isSliced)}
            className="2xl:text-base text-sm text-green underline inline-block cursor-pointer pl-2"
          >
            {isSliced ? " View more" : " View less"}
          </a>
        )}
      </p>
    </div>
  );
}
