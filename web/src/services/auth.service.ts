import type { AuthChangeEvent, Provider, Session } from "@supabase/supabase-js";
import type { ProfileInput } from "@urconnections/shared";
import { supabase } from "../lib/supabase";
import { clearSavedSearch } from "../features/groups/utils/savedSearch";

const AUTH_REDIRECT_URL = import.meta.env.VITE_AUTH_REDIRECT_URL;

/** Profile values as stored: empty fields are saved as null. */
export type ProfileUpdate = { [K in keyof ProfileInput]: string | null };

export const signUp = async (email: string, password: string, metadata: Partial<ProfileInput> = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: metadata.displayName,
        phone_number: metadata.phoneNumber,
        country: metadata.country,
        city: metadata.city,
      },
    },
  });
  if (error) throw error;
  return data; // { user, session }; session is null when email confirmation is required
};

export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signInWithOAuth = async (provider: Provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: AUTH_REDIRECT_URL,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  // Supabase removes its own session key; only drop app state that is user-specific.
  clearSavedSearch();
};

/** Subscribes to auth events. Returns an unsubscribe function. */
export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): (() => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
};

export const getSession = async (): Promise<Session | null> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Updates the signed-in user's profile metadata.
 * Supabase scopes this call to the user's own JWT.
 */
export const updateProfile = async ({ displayName, phoneNumber, country, city }: ProfileUpdate) => {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      phone_number: phoneNumber,
      country,
      city,
    },
  });
  if (error) throw error;
  return data;
};
