import { supabase } from "../lib/supabase";
import { clearFilterCache } from "../features/groups/hooks/useFilterCache";

const AUTH_REDIRECT_URL = import.meta.env.VITE_AUTH_REDIRECT_URL;

export const signUp = async (email, password, metadata = {}) => {
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
  return data;
};

export const signInWithPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signInWithOAuth = async (provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: AUTH_REDIRECT_URL,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  // Supabase removes its own session key; only drop app state that is user-specific.
  clearFilterCache();
};

/**
 * Subscribes to auth events. Returns an unsubscribe function.
 */
export const onAuthStateChange = (callback) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
};

export const getSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Updates the currently authenticated user's profile metadata.
 * Supabase scopes this call to the user's JWT — no other user
 * can modify someone else's profile.
 */
export const updateProfile = async ({ displayName, phoneNumber, country, city }) => {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
      phone_number: phoneNumber,
      country: country,
      city: city,
    },
  });
  if (error) throw error;
  return data;
};

