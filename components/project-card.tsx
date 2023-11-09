import Image from "next/image";
import { useState } from "react";
import { formatAmount } from "../api/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import EditIcon from "./edit-icon";
import Editor from "./editor";

export default function ProjectCard({
  imgSrc,
  name,
  description,
  link,
  matchAmount,
  contributions,
  crowdfundedAmount,
  canEdit,
  onCancel,
  onSave,
  isLoading,
}: {
  imgSrc: string;
  name: string;
  description: string;
  link?: string;
  matchAmount?: number;
  contributions: number;
  crowdfundedAmount?: number;
  canEdit: boolean;
  onCancel: () => void;
  onSave: (newVal: string) => void;
  isLoading: boolean;
}) {
  const [isSliced, setIsSliced] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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

            {!isEditorOpen && canEdit && (
              <span
                className="text-sm text-green cursor-pointer"
                onClick={() => setIsEditorOpen(true)}
              >
                <EditIcon />
              </span>
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

      <div>
        {isEditorOpen && canEdit ? (
          <Editor
            name={name}
            value={description}
            onCancel={() => {
              setIsEditorOpen(false);
              onCancel();
            }}
            onSave={async (newVal) => {
              await onSave(newVal);
              setIsEditorOpen(false);
            }}
            isLoading={isLoading}
            isTextarea={true}
          />
        ) : (
          <div className="prose break-words">
            <Markdown remarkPlugins={[remarkGfm]}>
              {description.slice(0, isSliced ? 500 : description.length)}
            </Markdown>

            {isSliced && description.length >= 500 && <span>...</span>}

            {description.length >= 500 && (
              <a
                onClick={() => setIsSliced(!isSliced)}
                className="2xl:text-base text-sm text-green underline inline-block cursor-pointer pl-2"
              >
                {isSliced ? " View more" : " View less"}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
