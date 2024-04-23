import tw from "tailwind-styled-components";

type ButtonProps = {
  $variant?: "solid" | "outline" | "secondary" | "external-link";
  $hidden?: boolean;
};

export const Button = tw.button`
  bg-violet-400 text-white
  py-2 px-4
  rounded
  transition-colors
  focus:shadow-outline
  disabled:bg-slate-100
  disabled:text-slate-500
  disabled:border-slate-200
  disabled:shadow-none
  disabled:cursor-not-allowed
  ${(p: ButtonProps) => {
    if (p.$variant === "outline") {
      return "bg-white text-grey-500 border border-grey-100 hover:border-grey-300";
    } else if (p.$variant === "secondary") {
      return "bg-violet-100 text-violet-400 hover:bg-violet-50 hover:brightness-100";
    } else if (p.$variant === "external-link") {
      return "bg-white text-gitcoin-violet-500";
    } else {
      return "bg-violet-400 text-white";
    }
  }}
  ${(p: ButtonProps) => (p.$hidden ? "hidden" : "")}
`;


export const Badge = tw.div<{
  color?: keyof typeof colorMap;
  rounded?: keyof typeof roundedMap;
  disabled?: boolean;
  flex?: boolean;
}>`
  font-mono
  text-xs
  text-gray-900
  bg-gray-100
  whitespace-nowrap
  inline-flex
  max-w-full
  w-fit
  items-center
  justify-center
  px-2
  py-1.5
  ${(p) => colorMap[p.color ?? "grey"]}
  ${(p) => roundedMap[p.rounded ?? "lg"]}
  ${(p) => (p.disabled ? "opacity-50" : "")}
  `;


const colorMap = {
  blue: "bg-blue-100",
  green: "bg-green-100",
  grey: "bg-grey-100",
  yellow: "bg-yellow-100",
  orange: "bg-orange-100",
} as const;

const roundedMap = {
  full: "rounded-full",
  lg: "rounded-lg",
  "3xl": "rounded-3xl",
} as const;

export const colors = {
  "primary-background": "#6F3FF5",
  "secondary-background": "#0E0333",
  "danger-background": "#D03E63",
  "primary-text": "#0E0333",
  "secondary-text": "#757087",
  "tertiary-text": "#E2E0E7",
  "quaternary-text": "#FFFFFF",
  "green-text": "#11BC92",
  "grey-text": "#0E0333",
};