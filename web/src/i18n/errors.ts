import { VALIDATION_MESSAGES, type ValidationMessageKey } from "@urconnections/shared";
import { ApiError } from "../lib/apiClient";
import { useT } from "./i18n";
import { en } from "./messages/en";

/*
 * Error messages in the visitor's language. Two sources, two ways:
 *
 * 1. Form checks (zod, shared schemas) produce an English sentence from VALIDATION_MESSAGES.
 *    We look the sentence up in that table to find its key, and translate the key.
 * 2. API errors arrive as ApiError with a stable `code` ("invalid_credentials"). We translate
 *    the code. English keeps the API's own message, exactly as before.
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

  const errorMessage: ErrorText["errorMessage"] = (error) => {
    // English: the API's own words (they can be more specific than our per-code text).
    if (locale === "en") return error.message;
    if (error instanceof ApiError) return isKnownCode(error.code) ? t(`apiErrors.${error.code}`) : error.message;
    // fetch() itself failed (offline, DNS, server unreachable): the browser throws a TypeError.
    if (error instanceof TypeError) return t("apiErrors.network");
    // Our own errors (e.g. the avatar's file checks) are already translated.
    return error.message;
  };

  return { fieldError, errorMessage };
}
