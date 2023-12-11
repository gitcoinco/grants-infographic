import { Formik, Field, Form, FieldArray, getIn } from "formik";
import { twitterRegex } from "../api/utils";
import { useState } from "react";
import Button from "./button";

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
      <Button
        type="tertiary"
        size="lg"
        onClick={onCancel}
        isDisabled={isLoading}
      >
        Cancel
      </Button>

      <Button type="secondary" size="lg"  isSubmit={true} isLoading={isLoading}>
        Save
      </Button>
    </div>
  );
};
