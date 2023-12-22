export default function Loading() {
  return (
    <div className="flex justify-center w-full animate-pulse mb-[50vh] mt-2">
      <div className="flex flex-col gap-16 max-w-screen w-full">
        <div className="flex w-full m-auto justify-center">
          <div className="w-full max-w-5xl m-auto">
            <div className="bg-[#E2E3D1] max-h-[440px] max-w-[1440px] w-full h-auto aspect-[3.27] object-cover rounded-xl border border-dark"></div>
            <div className="flex justify-between sm:gap-8 gap-4 sm:items-center mb-12 sm:flex-row flex-col">
              <div className="flex items-center gap-4 pl-10">
                <div className="relative -mt-14 z-[30]">
                  <div className="bg-[#E2E3D1] aspect-square object-cover w-28 h-28 rounded-full border border-dark "></div>
                </div>
                <div className="text-2xl sm:text-4xl  font-semibold sm:h-10 h-8 sm:w-96 w-40 rounded-md bg-[#E2E3D1]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <p className="text-center mt-4 text-semibold">Loading...</p> */}
    </div>
  );
}
