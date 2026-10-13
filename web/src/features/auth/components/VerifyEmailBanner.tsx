import { useResendVerification } from "../hooks/useEmailFlows";
import { useUser } from "../hooks/useUser";

/** A slim bar under the nav for signed-in users who haven't confirmed their email yet. */
export default function VerifyEmailBanner() {
  const { data: user } = useUser();
  const { mutate, isPending, isSuccess, error } = useResendVerification();

  if (!user || user.email_verified) return null;

  return (
    <div role="status" className="w-full border-b border-accent/20 bg-accent/5 px-6 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-black dark:text-white">
        <span>
          Please confirm your email (<span className="font-bold">{user.email}</span>) to create groups.
        </span>
        {isSuccess ? (
          <span className="font-bold text-accent">New link sent. Check your inbox.</span>
        ) : (
          <button onClick={() => mutate()} disabled={isPending} className="font-bold text-accent underline underline-offset-4 disabled:opacity-50">
            {isPending ? "Sending…" : "Resend email"}
          </button>
        )}
        {error && <span className="font-bold text-red-500">{error.message}</span>}
      </div>
    </div>
  );
}
