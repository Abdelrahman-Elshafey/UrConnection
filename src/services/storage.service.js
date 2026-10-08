import { supabase } from "../lib/supabase";
import imageCompression from "browser-image-compression";

const BUCKET = "Users-Pics";

/**
 * Allowed avatar types → storage file extension. Keep in sync with the
 * bucket's "allowed MIME types" (supabase/migrations) and ProfileAvatar's `accept`.
 * SVG/GIF/HEIC are rejected: SVG can carry script, and the bucket is public.
 */
export const AVATAR_MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Compression options targeting ≤1MB output and max 512px dimensions
 * to keep storage usage minimal while retaining visual quality for avatars.
 * useWebWorker is off: the library's worker downloads its own code from
 * cdn.jsdelivr.net at runtime (third-party script, blocked by our CSP).
 * A 512px avatar compresses fast enough on the main thread.
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 512,
  useWebWorker: false,
};

/**
 * Validates and compresses an avatar image.
 * Single source of truth for avatar validation (the UI just shows the error).
 * @param {File} file - The raw image file from an <input>.
 * @returns {Promise<File>} - The compressed file.
 */
const compressImage = async (file) => {
  if (!AVATAR_MIME_TYPES[file.type]) {
    throw new Error("Please select a JPEG, PNG or WebP image.");
  }
  return imageCompression(file, { ...COMPRESSION_OPTIONS, fileType: file.type });
};

/**
 * Builds the storage path for a user's avatar. The extension comes from the
 * validated MIME type, never from the user-controlled file name.
 */
const getAvatarPath = (userId, file) => `${userId}/avatar.${AVATAR_MIME_TYPES[file.type]}`;

/**
 * Uploads (or replaces) the user's profile picture.
 */
export const uploadAvatar = async (userId, file) => {
  const compressed = await compressImage(file);
  const filePath = getAvatarPath(userId, file);

  // Upload first so a failed upload never leaves the user without an avatar.
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, compressed, {
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  // Then remove previous avatars saved under a different extension.
  const { data: existingFiles } = await supabase.storage.from(BUCKET).list(userId);
  const stalePaths = (existingFiles || [])
    .map((f) => `${userId}/${f.name}`)
    .filter((path) => path !== filePath);
  if (stalePaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(stalePaths);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  // Bust browser cache by appending a timestamp
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  if (updateError) throw new Error(updateError.message);

  return avatarUrl;
};

/**
 * Removes the user's profile picture from storage and clears the metadata.
 */
export const removeAvatar = async (userId) => {
  // Since we don't know the extension of the current avatar, 
  // we list all files in the user's folder and remove them.
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);
  
  if (files && files.length > 0) {
    const pathsToDelete = files.map((f) => `${userId}/${f.name}`);
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove(pathsToDelete);
    
    if (removeError) throw new Error(removeError.message);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: null },
  });

  if (updateError) throw new Error(updateError.message);
};
