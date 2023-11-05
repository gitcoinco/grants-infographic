import Image from "next/image";
import grantsStackLogo from "/assets/grants-stack-logo.svg";

export default function Footer() {
  return (
    <footer className=" px-6 py-16 mt-10">
      <a
        className="cursor-pointer flex gap-8 items-center justify-center w-fit m-auto sm:flex-row flex-col-reverse"
        href="https://www.gitcoin.co/grants-stack"
      >
        <Image src={grantsStackLogo} alt="grants stack logo" width={65} />
        <h3 className="link sm:text-lg sm:text-left text-center">
          <span>This Round was Hosted on Grants Stack</span>
          <br /> <span> Host your own today</span>
        </h3>
      </a>
    </footer>
  );
}
