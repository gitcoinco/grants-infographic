import { Formik, Field, Form, FieldArray, getIn } from "formik";
import { twitterRegex } from "../api/utils";
import { useState } from "react";

export default function Editor({
  name,
  value,
  onCancel,
  onSave,
  isLoading,
  isTextarea,
}: {
  name: string;
  value: string;
  onCancel: () => void;
  onSave: (newVal: string) => void;
  isLoading: boolean;
  isTextarea: boolean;
}) {
  const [initialTweetsValues, setInitialTweetsValues] = useState({
    tweets: value?.length ? value.split(",") : [""],
  });

  const [initialTextareaValue, setInitialTextareaValue] = useState({
    [name]: value,
  });

  function validateTweet(value: string) {
    let error;
    if (!value) {
      error = "Required";
    } else if (!twitterRegex.test(value)) {
      error = "Invalid tweet URL";
    }
    return error;
  }

  return (
    <div
      className={`${isLoading ? "pointer-events-none opacity-50" : ""} w-full `}
    >
      <div>
        {isTextarea ? (
          <div>
            <Formik
              initialValues={initialTextareaValue}
              onSubmit={(values) => {
                onSave(values[name]);
              }}
            >
              <Form>
                <Field
                  name={name}
                  as="textarea"
                  className="w-full min-h-[10rem]"
                />
                <FormButtons onCancel={onCancel} isLoading={isLoading} />
              </Form>
            </Formik>
          </div>
        ) : (
          <div>
            <Formik
              initialValues={initialTweetsValues}
              onSubmit={(values) => {
                onSave(values.tweets.join(","));
              }}
            >
              {({ values, errors, touched, isValidating }) => (
                <Form>
                  <FieldArray name="tweets">
                    {({ insert, remove, push }) => (
                      <div>
                        {values.tweets?.length > 0 &&
                          values.tweets.map((tweetURL, index) => (
                            <div key={index}>
                              <div className="flex flex-col gap-2">
                                <label htmlFor={`tweets.${index}`}>
                                  Tweet URL
                                </label>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex gap-4 items-center justify-between">
                                    <Field
                                      className="w-full"
                                      name={`tweets.${index}`}
                                      placeholder="https://twitter.com/umarkhaneth/status/1718319104178753678"
                                      type="url"
                                      validate={validateTweet}
                                    />
                                    <div>
                                      <button
                                        type="button"
                                        className="text-3xl hover:opacity-75 transition-all"
                                        onClick={() => remove(index)}
                                      >
                                        &times;
                                      </button>
                                    </div>
                                  </div>
                                  {!!errors.tweets &&
                                    errors.tweets[index] &&
                                    touched.tweets !== undefined &&
                                    touched.tweets && (
                                      <div className="text-sm text-[#e5524d]">
                                        {errors.tweets[index]}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          ))}
                        <button
                          type="button"
                          className="mt-8 cursor-pointer hover:border-dark transition-all duration-300 rounded-[12px] h-fit w-fit border-2 border-green text-green py-1 px-4 flex items-center gap-2"
                          onClick={() => push("")}
                          disabled={
                            values.tweets?.length >= 6 || !values.tweets?.length
                          }
                        >
                          Add tweet
                        </button>
                      </div>
                    )}
                  </FieldArray>
                  <FormButtons onCancel={onCancel} isLoading={isLoading} />
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>
    </div>
  );
}

const FormButtons = ({
  onCancel,
  isLoading,
}: {
  onCancel: () => void;
  isLoading: boolean;
}) => {
  return (
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
          type="submit"
          className="w-[7.5rem] flex justify-center items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue hover:bg-indigo-400 transition ease-in-out duration-150 cursor-pointer"
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
  );
};
