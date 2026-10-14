import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES, type User } from "@urconnections/shared";
import { useRef, type ChangeEvent } from "react";
import { FiCamera } from "react-icons/fi";
import { Avatar } from "../../../components/ui/Avatar";
import { cx } from "../../../components/ui/cx";
import { Spinner } from "../../../components/ui/Spinner";
import { useToast } from "../../../components/ui/toast/useToast";
import { useRemoveAvatar, useUploadAvatar } from "../hooks/useAvatar";

const ALLOWED: readonly string[] = AVATAR_MIME_TYPES;

/** The profile picture: shows it, uploads a new one (click it), removes it. */
export default function ProfileAvatar({ user }: { user: User }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const isBusy = upload.isPending || remove.isPending;
  const onError = (err: Error) => toast(err.message, "error");

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // so choosing the same file again still fires onChange
    if (!file) return;

    // Quick checks for a friendly message without a round trip. They're only UX:
    // the API checks the real contents of the file, whatever the browser says.
    if (!ALLOWED.includes(file.type)) return onError(new Error("Please choose a JPEG, PNG or WebP image."));
    if (file.size > AVATAR_MAX_BYTES) return onError(new Error("That image is too large. The maximum is 5 MB."));

    upload.mutate(file, { onSuccess: () => toast("Picture updated."), onError });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Avatar user={user} size="lg" className={cx("border-4 border-gray-200 transition-opacity dark:border-line-dark", isBusy && "opacity-50")} />
        {isBusy ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" />
          </span>
        ) : (
          <button
            onClick={() => fileInput.current?.click()}
            aria-label="Change profile picture"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition duration-300 hover:bg-black/40 hover:opacity-100 focus-visible:bg-black/40 focus-visible:opacity-100"
          >
            <FiCamera aria-hidden className="h-8 w-8 text-white drop-shadow-lg" />
          </button>
        )}
      </div>

      <input ref={fileInput} type="file" accept={AVATAR_MIME_TYPES.join(",")} onChange={handleFile} className="hidden" />

      {user.avatar_url && (
        <button
          onClick={() => remove.mutate(undefined, { onSuccess: () => toast("Picture removed."), onError })}
          disabled={isBusy}
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-500 transition-colors hover:text-red-400 disabled:opacity-40"
        >
          Remove
        </button>
      )}
    </div>
  );
}
