import { supabase } from "../../../lib/supabase";

export const getGroups = async () => {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
   

  if (error) throw new Error(error.message);

  return data;
};

export const createGroup = async (newGroup) => {


  const { data, error } = await supabase
    .from("groups")
    .insert([newGroup])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

export const deleteGroup = async (id) => {
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
};

export const getUserGroups = async (userId) => {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return data;
};