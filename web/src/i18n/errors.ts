import { VALIDATION_MESSAGES, type ValidationMessageKey } from "@urconnections/shared";
import { ApiError, NetworkError } from "../lib/apiClient";
import { useT } from "./i18n";
import { en } from "./messages/en";

/*
 * Error messages in the visitor's language. Two sources, two ways:
 *
 * 1. Form checks (zod, shared schemas) produce an English sentence from VALIDATION_MESSAGES.
 *    We look the sentence up in that table to find its key, and translate the key.
 * 2. API errors arrive as ApiError with a stable `code` ("invalid_credentials"). We translate
 *    the code. English keeps the API's own message, except for "no connection" and "no JSON
 *    answer", which get a clear sentence in every language.
 *
 * Anything we don't know (a new message, an unexpected error) is shown as it is: never an
 * empty box, and never a raw key.
 */

// "Password is too long." → "passwordMax". Built once from the shared table.
const validationKeyByText = new Map(
  Object.entries(VALIDATION_MESSAGES).map(([key, text]) => [text as string, key as ValidationMessageKey]),
);

type ApiErrorCode = keyof typeof en.apiErrors;
const isKnownCode = (code: string): code is ApiErrorCode => Object.hasOwn(en.apiErrors, code);

export interface ErrorText {
  /** A form field's error (errors.email?.message): translated, or as it is. */
  fieldError: (message: string | undefined) => string | undefined;
  /** An error thrown by a request (React Query's `error`), for a Notice or a toast. */
  errorMessage: (error: Error) => string;
}

export function useErrorText(): ErrorText {
  const { t, locale } = useT();

  const fieldError: ErrorText["fieldError"] = (message) => {
    if (!message) return message;
    const key = validationKeyByText.get(message);
    return key ? t(`validation.${key}`) : message;
  };

  // The translated messages of an API error's details, one sentence each (duplicates once).
  // Only messages from our shared table: anything else (zod's own technical wording) is left
  // out, and an error with none of ours keeps its generic text.
  const fieldMessages = (error: ApiError): string | undefined => {
    const keys = new Set(error.details.flatMap(({ message }) => validationKeyByText.get(message) ?? []));
    return keys.size > 0 ? [...keys].map((key) => t(`validation.${key}`)).join(" ") : undefined;
  };

  const errorMessage: ErrorText["errorMessage"] = (error) => {
    // No connection at all (offline, DNS, server unreachable): apiClient throws NetworkError
    // instead of the browser's own wording ("Failed to fetch"), so every language gets our sentence.
    if (error instanceof NetworkError) return t("apiErrors.network");
    if (error instanceof ApiError) {
      // No JSON answer (API down, proxy error): apiClient's "Request failed (502)" isn't for people.
      if (error.code === "http_error") return t("apiErrors.http_error");
      // A field the API rejected (e.g. a city that isn't in its country's list) says *what* is
      // wrong in `details`; that beats the generic "The request is invalid", in every language.
      const fieldProblems = fieldMessages(error);
      if (fieldProblems) return fieldProblems;
      // English: the API's own words (they can be more specific than our per-code text).
      if (locale === "en") return error.message;
      return isKnownCode(error.code) ? t(`apiErrors.${error.code}`) : error.message;
    }
    // Our own errors (e.g. the avatar's file checks) are already translated.
    return error.message;
  };

  return { fieldError, errorMessage };
}
