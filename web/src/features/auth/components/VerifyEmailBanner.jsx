import { useResendVerification } from "../hooks/useEmailFlows";
import { useUser } from "../hooks/useUser";

/** A slim bar under the nav for signed-in users who haven't confirmed their email yet. */
export default function VerifyEmailBanner() {
  const { data: user } = useUser();
  const { mutate, isPending, isSuccess, error } = useResendVerification();

  if (!user || user.email_verified) return null;

  return (
    <div role="status" className="w-full bg-[#0071e3]/5 border-b border-[#0071e3]/20 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-black dark:text-white">
        <span>
          Please confirm your email (<span className="font-bold">{user.email}</span>) to create groups.
        </span>
        {isSuccess ? (
          <span className="font-bold text-[#0071e3]">New link sent. Check your inbox.</span>
        ) : (
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="font-bold text-[#0071e3] underline underline-offset-4 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Sending…" : "Resend email"}
          </button>
        )}
        {error && <span className="text-red-500 font-bold">{error.message}</span>}
      </div>
    </div>
  );
}
