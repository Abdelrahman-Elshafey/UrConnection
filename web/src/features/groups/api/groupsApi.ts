import type { CreateGroupInput, Group } from "@urconnections/shared";
import { supabase } from "../../../lib/supabase";

// Explicit column list instead of "*" (audit R2): only fetch what the UI uses.
const GROUP_COLUMNS = "id, user_id, date, title, description, topic, platform, meeting_link, country, city";

/** What the client sends when creating a group (owner + date added by the caller). */
export type NewGroup = CreateGroupInput & { user_id: string; date: string };

// The Supabase client has no generated database types, so `data` is untyped here
// and we state the row shape with `as Group[]`. Stage 5 replaces this file with
// calls to our own API, whose responses are validated with the shared schemas.

export const getGroups = async (): Promise<Group[]> => {
  const { data, error } = await supabase.from("groups").select(GROUP_COLUMNS);
  if (error) throw new Error(error.message);
  return data as Group[];
};

export const getGroupById = async (id: string): Promise<Group> => {
  const { data, error } = await supabase.from("groups").select(GROUP_COLUMNS).eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as Group;
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  const { data, error } = await supabase.from("groups").select(GROUP_COLUMNS).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data as Group[];
};

export const createGroup = async (newGroup: NewGroup): Promise<Group> => {
  const { data, error } = await supabase.from("groups").insert([newGroup]).select(GROUP_COLUMNS).single();
  if (error) throw new Error(error.message);
  return data as Group;
};

export const deleteGroup = async (id: string): Promise<void> => {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
};
