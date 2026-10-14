// Public API of @urconnections/shared: code shared by web (and later api).
export { TOPICS, isTopic, type Topic } from "./topics";
export {
  PLATFORMS,
  PLATFORM_KEYS,
  PLATFORM_MAP,
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
  EDITABLE_GROUP_FIELDS,
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
  type ProfileInput,
  type ProfileUpdate,
} from "./schemas/profile";
export {
  loginSchema,
  registerSchema,
  signupSchema,
  passwordSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  forgotPasswordResponseSchema,
  resetPasswordSchema,
  resetPasswordFormSchema,
  OAUTH_ERROR_MESSAGES,
  oauthErrorMessage,
  type OAuthErrorCode,
  type LoginInput,
  type ForgotPasswordInput,
  type ForgotPasswordResponse,
  type ResetPasswordInput,
  type RegisterInput,
  type SignupInput,
} from "./schemas/auth";
export { userSchema, meResponseSchema, type User, type MeResponse } from "./schemas/user";
