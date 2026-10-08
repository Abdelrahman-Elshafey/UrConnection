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
  groupSchema,
  type CreateGroupInput,
  type Group,
} from "./schemas/group";
export { profileSchema, type ProfileInput } from "./schemas/profile";
export {
  loginSchema,
  signupSchema,
  passwordSchema,
  type LoginInput,
  type SignupInput,
} from "./schemas/auth";
