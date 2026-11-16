/**
 * Every validation message of the shared schemas, in one table.
 *
 * Why a table instead of writing each sentence inline: the website shows these messages in
 * four languages. The schemas (and so the API's responses) keep the English sentence, and
 * the web looks it up here to find its key ("passwordMin"), then shows the translation of
 * that key (web/src/i18n/messages/*.ts, `validation`). One English source, no drift.
 *
 * Adding a rule: add its message here, use VALIDATION_MESSAGES.x in the schema, then
 * translate x in the web's message files (TypeScript fails the build until you do).
 */
export const VALIDATION_MESSAGES = {
  emailInvalid: "Please enter a valid email address.",
  passwordMin: "Password must be at least 8 characters.",
  passwordMax: "Password is too long.",
  passwordLower: "Password must contain at least one lowercase (a-z).",
  passwordUpper: "Password must contain at least one uppercase (A-Z).",
  passwordNumber: "Password must contain at least one number.",
  passwordSymbol: "Password must contain a special character.",
  passwordRequired: "Password is required.",
  passwordsMismatch: "Passwords do not match.",
  linkInvalid: "This link is invalid.",
  topicRequired: "Interest is required",
  titleRequired: "Title is required",
  titleMax: "Title is too long (max 20 characters)",
  platformRequired: "Platform is required",
  linkUrl: "Please enter a valid http(s) URL",
  linkMax: "Link is too long (max 500 characters)",
  linkPlatform: "Link does not match the selected platform",
  countryRequired: "Country is required",
  countryFromList: "Please choose a country from the list",
  cityRequired: "City is required",
  cityMax: "City name is too long",
  // Checked by the API only (api/src/lib/places.ts): the web loads city lists on demand.
  cityFromList: "Please choose a city from the list",
  descriptionMin: "Description is too short (min 20 characters)",
  descriptionMax: "Description is too long (max 200 characters)",
  nameMax: "Name is too long.",
  phoneMax: "Phone number is too long.",
} as const;

export type ValidationMessageKey = keyof typeof VALIDATION_MESSAGES;
