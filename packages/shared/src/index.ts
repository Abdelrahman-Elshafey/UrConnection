// Public API of @urconnections/shared: code shared by web (and later api).
export { TOPICS, type Topic } from "./topics";
export {
  PLATFORMS,
  PLATFORM_KEYS,
  PLATFORM_MAP,
  isPlatformKey,
  type Platform,
  type PlatformKey,
} from "./platforms";
export { COUNTRIES_CITIES, COUNTRY_LIST, getCities, isCountry, type Country } from "./countries";
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
  type GroupListResponse,
} from "./schemas/group";
export {
  profileSchema,
  profileUpdateSchema,
  type ProfileInput,
  type ProfileUpdate,
} from "./schemas/profile";
export {
  loginSchema,
  registerSchema,
  signupSchema,
  passwordSchema,
  type LoginInput,
  type RegisterInput,
  type SignupInput,
} from "./schemas/auth";
export { userSchema, meResponseSchema, type User, type MeResponse } from "./schemas/user";
