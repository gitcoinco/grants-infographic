import dynamic from "next/dynamic";
const QuillNoSSRWrapper = dynamic(import("react-quill"), { ssr: false });

export default function GrantPlot({
  value,
  onChange,
  onCancel,
  onSave,
  isLoading,
}: {
  value: string;
  onChange: (val: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isLoading: boolean;
}) {
  const modules = {
    toolbar: [["bold", "italic", "underline"], ["link"]],
    clipboard: {
      matchVisual: true,
    },
  };

  const formats = [
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
    "image",
    "video",
  ];

  return (
    <div>
      <div>
        <QuillNoSSRWrapper
          className={`${isLoading ? "pointer-events-none opacity-50" : ""}`}
          theme="snow"
          placeholder="Write description"
          formats={formats}
          modules={modules}
          value={value}
          onChange={onChange}
        />
      </div>
      <div className="flex items-center gap-10 justify-end mt-6">
        <button
          onClick={onCancel}
          className={`w-[7.5rem] px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md border border-blue hover:opacity-80 transition ease-in-out duration-150
          ${isLoading ? "pointer-events-none opacity-40" : ""} `}
        >
          Cancel
        </button>
        {!isLoading ? (
          <button
            onClick={onSave}
            className="w-[7.5rem] flex justify-center items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed"
          >
            Save
          </button>
        ) : (
          <button
            disabled
            className="w-[7.5rem] flex justify-center items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed"
          >
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          </button>
        )}
      </div>
    </div>
  );
}
