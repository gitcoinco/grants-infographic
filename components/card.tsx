import { ReactNode } from "react";

export default function Card({noPadding, children}: {noPadding?: boolean, children: ReactNode}) {
  return (
    <div className="max-w-5xl m-auto bg-gradient-to-b from-peach via-yellow to-light-pink flex items-center justify-center p-2 bg-red rounded-[4px] border border-purple">
      <div className={noPadding ? 'child:rounded-[32px] rounded-[32px] bg-sand border border-purple w-full' : 'rounded-[32px] bg-sand border border-purple px-6 py-10 sm:p-10 w-full'}>
        {children}
      </div>
    </div>
  )
}