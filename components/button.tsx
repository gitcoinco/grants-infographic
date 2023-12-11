import { ReactNode } from "react";

export default function Button({
  type,
  isLoading,
  isDisabled,
  size,
  children,
  onClick,
  isSubmit,
}: {
  type: "primary" | "secondary" | "tertiary";
  children: ReactNode;
  onClick?: (e: any) => void;
  size?: "sm" | "lg";
  isSubmit?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
}) {
  const sizeClass =
    size == "sm"
      ? "px-2 py-1 w-[6rem] text-xs"
      : size == "lg"
      ? "w-[7.5rem] px-4 py-2 text-sm"
      : "px-4 py-1";
  const typeClass =
    type == "primary"
      ? "hover:border-dark !rounded-[12px] border-2 border-green text-green py-1"
      : type == "secondary"
      ? "font-semibold text-white bg-blue hover:bg-indigo-400"
      : "font-semibold border border-blue hover:opacity-80";
  const defaultClass =
    "leading-6 shadow rounded-md flex justify-center items-center gap-2 transition-all ease-in-out duration-150 cursor-pointer";
  const disabledClass = "pointer-events-none opacity-40";
  return (
    <div>
      {!isLoading ? (
        <button
          onClick={onClick && onClick}
          type={isSubmit ? "submit" : undefined}
          className={
            sizeClass +
            " " +
            typeClass +
            " " +
            defaultClass +
            " " +
            (isDisabled ? disabledClass : "")
          }
        >
          {children}
        </button>
      ) : (
        <button
          disabled
          className={`${
            sizeClass + " " + typeClass + " " + defaultClass
          } flex justify-center items-center cursor-not-allowed`}
        >
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Saving...
        </button>
      )}
    </div>
  );
}
