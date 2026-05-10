import { supabase } from "../lib/supabase";
import imageCompression from "browser-image-compression";

const BUCKET = "Users-Pics";

/**
 * Compression options targeting ≤200KB output and max 512px dimensions
 * to keep storage usage minimal while retaining visual quality for avatars.
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 512,
  useWebWorker: true,
};

/**
 * Compresses an image file using browser-image-compression.
 * @param {File} file - The raw image file from an <input>.
 * @returns {Promise<File>} - The compressed file.
 */
const compressImage = async (file) => {
  // If it's not an image that browser-image-compression can handle, skip it.
  if (!file.type.startsWith("image/")) return file;
  return imageCompression(file, { ...COMPRESSION_OPTIONS, fileType: file.type });
};

/**
 * Builds the storage path for a user's avatar.
 * We now use the original file extension to support any image type.
 */
const getAvatarPath = (userId, file) => {
  const extension = file.name.split(".").pop();
  return `${userId}/avatar.${extension}`;
};

/**
 * Uploads (or replaces) the user's profile picture.
 */
export const uploadAvatar = async (userId, file) => {
  const compressed = await compressImage(file);
  const filePath = getAvatarPath(userId, file);

  // Before uploading a new one with a potentially different extension,
  // we should clean up any existing avatar files in that folder.
  const { data: existingFiles } = await supabase.storage.from(BUCKET).list(userId);
  if (existingFiles && existingFiles.length > 0) {
    const pathsToDelete = existingFiles.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(pathsToDelete);
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, compressed, {
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

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
