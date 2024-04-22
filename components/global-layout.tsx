"use client";
import { ReactNode } from "react";
import Navbar from "./navbar";
import Footer from "./footer";

export default function GlobalLayout({ children }: { children: ReactNode }) {
  return (
    <main className={"font-sans min-h-screen text-grey-500"}>
      <Navbar />
      <div className="container pt-24 relative z-10 mx-auto px-4 sm:px-6 lg:px-20 max-w-screen-2xl">
        {children}
      </div>
      <Footer />
    </main>
  );
}
