import { ReactNode } from "react";

import Footer from "./footer";

export default function GlobalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-sand min-h-screen max-w-[100vw]">
        <main>{children}</main>
        <Footer />
      </div>
    </>
  );
}
