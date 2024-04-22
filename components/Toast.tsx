"use client";
import { Fragment, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { colors } from "../app/styles";

export default function Toast({
  children,
  show,
  error = false,
  fadeOut = false,
  onClose,
}: {
  children: JSX.Element;
  show: boolean;
  error?: boolean;
  fadeOut?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (fadeOut) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [fadeOut]);

  return (
    <div
      aria-live="assertive"
      className="fixed inset-x-0 bottom-0 flex items-center px-4 py-6 sm:p-6"
    >
      <div className="w-full flex flex-col items-center space-y-4">
        <Transition
          show={show}
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={`p-3 shadow-lg rounded flex ${
              error ? "bg-danger-text" : "bg-secondary-background"
            }`}
          >
            <div className="flex items-start">{children}</div>
            <button type="button" onClick={onClose} className="inline-flex">
              <Cross color={colors["quaternary-text"]} />
            </button>
          </div>
        </Transition>
      </div>
    </div>
  );
}

function Cross({ color, size = "12" }: { color: string; size?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        // eslint-disable-next-line max-len
        d="M0.292893 0.292893C0.683417 -0.0976311 1.31658 -0.0976311 1.70711 0.292893L6 4.58579L10.2929 0.292893C10.6834 -0.0976311 11.3166 -0.0976311 11.7071 0.292893C12.0976 0.683417 12.0976 1.31658 11.7071 1.70711L7.41421 6L11.7071 10.2929C12.0976 10.6834 12.0976 11.3166 11.7071 11.7071C11.3166 12.0976 10.6834 12.0976 10.2929 11.7071L6 7.41421L1.70711 11.7071C1.31658 12.0976 0.683417 12.0976 0.292893 11.7071C-0.0976311 11.3166 -0.0976311 10.6834 0.292893 10.2929L4.58579 6L0.292893 1.70711C-0.0976311 1.31658 -0.0976311 0.683417 0.292893 0.292893Z"
        fill={color}
      />
    </svg>
  );
}
