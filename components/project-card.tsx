import Image from "next/image";
import { useState } from "react";
import { formatAmount } from "../api/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import EditIcon from "./edit-icon";

export default function ProjectCard({
  imgSrc,
  name,
  link,
  matchAmount,
  contributions,
  crowdfundedAmount,
}: {
  imgSrc: string;
  name: string;
  link?: string;
  matchAmount?: number;
  contributions: number;
  crowdfundedAmount?: number;
}) {
  return (
    <div className="flex gap-8 flex-col max-w-[90vw] w-full">
      <div className="flex-shrink-0 flex gap-8 items-center w-full">
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
          <h3 className="text-blue text-md sm:text-2xl font-grad hover:underline flex items-center gap-4">
            {link ? (
              <a href={link} target="_blank">
                {name}{" "}
              </a>
            ) : (
              <span>{name}</span>
            )}
          </h3>
          <h5 className="text-dark text-xs sm:text-base font-grad mt-2">
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
    </div>
  );
}
