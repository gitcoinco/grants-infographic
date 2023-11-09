import {ReactNode} from 'react';
import heroBg from '/assets/hero-bg.svg';
import Image from 'next/image';
import Header from './header';
import Footer from './footer';

export default function GlobalLayout({children}: {children: ReactNode}) {
  return (
    <>
    <div className="bg-sand min-h-screen max-w-[100vw]">
      <div className="relative">
        <Image src={heroBg} alt="gitcoin logo" className='absolute top-0 right-0' />
        <Header />
      </div>
      <main className='p-6'>{children}</main>
      <Footer />
    
      </div>
    </>
  )
}