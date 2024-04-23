export default function Loading() {
  return (
    <div className="flex justify-center w-full animate-pulse mb-[50vh]">
      <div className="flex flex-col gap-16 max-w-screen w-full">
        <div className="flex w-full m-auto justify-center">
          <div className="w-full m-auto">
            <div className="bg-grey-200 max-h-[320px] max-w-[1280px] w-full h-auto aspect-[3.27] object-cover rounded-3xl border border-dark"></div>
            <div className="flex justify-between sm:gap-8 gap-4 sm:items-center mb-10 sm:flex-row flex-col">
              <div className="flex items-center gap-4 pl-4 sm:pl-6 lg:pl-8">
                <div className="relative -mt-16 z-[30]">
                  <div className="bg-grey-200 aspect-square object-cover h-32 w-32 ring-4 ring-white rounded-full border border-dark "></div>
                </div>
              </div>
            </div>
            <div className="text-2xl sm:text-4xl font-semibold sm:h-10 h-8 sm:w-96 w-40 rounded-md bg-grey-200"></div>
          </div>
        </div>
      </div>
      {/* <p className="text-center mt-4 text-semibold">Loading...</p> */}
    </div>
  );
}
