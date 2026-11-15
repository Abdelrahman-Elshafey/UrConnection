// Public API of @urconnections/shared: code shared by the web app and the API.
// Only what one of them imports is exported here; helpers used inside this package stay internal.
export { TOPICS, isTopic, type Topic } from "./topics";
export {
  PLATFORMS,
  PLATFORM_KEYS,
  isPlatformKey,
  type Platform,
  type PlatformKey,
} from "./platforms";
// Country names only. The city lists are a separate entry point, "@urconnections/shared/cities"
// (see cities.ts for why).
export { COUNTRY_LIST, isCountry, type Country } from "./countryNames";
export {
  createGroupSchema,
  updateGroupSchema,
  groupSchema,
  myGroupsResponseSchema,
  groupListQuerySchema,
  groupListResponseSchema,
  type CreateGroupInput,
  type UpdateGroupInput,
  type MyGroupsResponse,
  type Group,
  type GroupListQuery,
  type GroupListParams,
  type GroupFilters,
  type GroupListResponse,
} from "./schemas/group";
export {
  profileSchema,
  profileUpdateSchema,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  type ProfileUpdate,
} from "./schemas/profile";
export {
  loginSchema,
  registerSchema,
  signupSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  forgotPasswordResponseSchema,
  resetPasswordSchema,
  resetPasswordFormSchema,
  oauthErrorMessage,
  type OAuthErrorCode,
  type LoginInput,
  type ForgotPasswordResponse,
  type RegisterInput,
} from "./schemas/auth";
export { meResponseSchema, type User, type MeResponse } from "./schemas/user";
