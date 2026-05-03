import { useRef, useState } from "react";
import { useUploadAvatar, useRemoveAvatar } from "../hooks/useAvatar";

/**
 * ProfileAvatar — A premium, interactive avatar component.
 *
 * Supports:
 * - Displaying the current avatar or a generated initial fallback.
 * - Uploading / replacing via a hidden file input.
 * - Removing the current avatar.
 * - Visual feedback for loading & error states.
 */
export default function ProfileAvatar({ user }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  const { mutate: upload, isPending: isUploading } = useUploadAvatar();
  const { mutate: remove, isPending: isRemoving } = useRemoveAvatar();

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.display_name || user?.email || "?";
  const initials = displayName.charAt(0).toUpperCase();
  const isBusy = isUploading || isRemoving;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client-side guard
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setError(null);
    upload(
      { userId: user.id, file },
      {
        onError: (err) => setError(err.message),
      },
    );

    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = () => {
    setError(null);
    remove(user.id, {
      onError: (err) => setError(err.message),
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Avatar Circle */}
      <div className="relative group">
        <div
          className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-200 dark:border-[#222222] transition-all duration-300 ${
            isBusy ? "opacity-50" : ""
          }`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#0071e3] flex items-center justify-center">
              <span className="text-white text-5xl md:text-6xl font-black select-none">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Loading spinner overlay */}
        {isBusy && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin" />
          </div>
        )}

        {/* Hover overlay — only when idle */}
        {!isBusy && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
            aria-label="Change profile picture"
          >
            <svg
              className="w-8 h-8 text-white drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {avatarUrl && (
        <>
          <button
            onClick={handleRemove}
            disabled={isBusy}
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-500 hover:text-red-400 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Remove
          </button>
        </>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs font-medium ">
          {error}
        </p>
      )}
    </div>
  );
}
