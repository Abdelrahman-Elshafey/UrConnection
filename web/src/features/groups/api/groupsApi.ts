import {
  groupListResponseSchema,
  groupSchema,
  type CreateGroupInput,
  type Group,
  type GroupListParams,
  type GroupListResponse,
} from "@urconnections/shared";
import { apiGet } from "../../../lib/apiClient";
import { supabase } from "../../../lib/supabase";

// ── Reads: our own API (Stage 5) ────────────────────────────────────────────

/** One page of groups matching the filters. Pass the previous page's nextCursor to get the next one. */
export const getGroups = (params: GroupListParams): Promise<GroupListResponse> =>
  apiGet("/api/groups", groupListResponseSchema, params);

export const getGroupById = (id: string): Promise<Group> => apiGet(`/api/groups/${encodeURIComponent(id)}`, groupSchema);

// ── Still on Supabase until Stage 7 (they need our own login, Stage 6) ──────
// The v1 table calls the timestamp `date`; "created_at:date" renames it in the
// response so these rows have the same shape as the API's.
const V1_COLUMNS = "id, user_id, created_at:date, title, description, topic, platform, meeting_link, country, city";

/** What the client sends when creating a group (owner + date added by the caller). */
export type NewGroup = CreateGroupInput & { user_id: string; date: string };

// The Supabase client has no generated database types, so these rows are cast
// to Group. Stage 7 replaces these functions with calls to our API.

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  const { data, error } = await supabase.from("groups").select(V1_COLUMNS).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data as unknown as Group[];
};

export const createGroup = async (newGroup: NewGroup): Promise<Group> => {
  const { data, error } = await supabase.from("groups").insert([newGroup]).select(V1_COLUMNS).single();
  if (error) throw new Error(error.message);
  return data as unknown as Group;
};

export const deleteGroup = async (id: string): Promise<void> => {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
};
