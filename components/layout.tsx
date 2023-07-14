import { ConnectButton } from '@rainbow-me/rainbowkit';
import {ReactNode} from 'react';
import gitcoinLogo from '/assets/gitcoin-logo.svg';
import heroBg from '/assets/hero-bg.svg';
import Image from 'next/image';

export default function Layout({children}: {children: ReactNode}) {
  return (
    <>
    <div className="bg-sand min-h-screen max-w-[100vw]">
      <div className="relative">
        <Image src={heroBg} alt="gitcoin logo" className='absolute top-0 right-0' />
        <header className="flex justify-between p-6">
          <Image src={gitcoinLogo} alt="gitcoin logo" width="89" height="30" />
          {/* <ConnectButton /> */}
        </header>
      </div>
      <main className='p-6'>{children}</main>
      <footer className='p-6'></footer>
      </div>
    </>
  )
}