import Image from "next/image";
import GrantsStackLogo from "/assets/grants-stack-logo.svg";

export default function Footer() {
  return (
    <footer className=" px-6 py-16 mt-10">
      <a
        className="cursor-pointer flex gap-8 items-center justify-center w-fit m-auto sm:flex-row flex-col-reverse"
        href="https://www.gitcoin.co/grants-stack"
      >
        <GrantsStackLogo />
        <h3 className="link sm:text-lg sm:text-left text-center !no-underline">
          <span>This round was hosted on Gitcoin Grants Stack</span>
          <br /> <span> Host your own today</span>
        </h3>
      </a>
    </footer>
  );
}
