import { useErrorText } from "../../../i18n/errors";
import { useT } from "../../../i18n/i18n";
import { useResendVerification } from "../hooks/useEmailFlows";
import { useUser } from "../hooks/useUser";

/** A slim bar under the nav for signed-in users who haven't confirmed their email yet. */
export default function VerifyEmailBanner() {
  const { data: user } = useUser();
  const { mutate, isPending, isSuccess, error } = useResendVerification();
  const { t } = useT();
  const { errorMessage } = useErrorText();

  if (!user || user.email_verified) return null;

  // The address is bold, so split the sentence around its {email} slot: each language can
  // put the address wherever its grammar wants it.
  const [before = "", after = ""] = t("auth.banner.text").split("{email}");

  return (
    <div role="status" className="w-full border-b border-accent/20 bg-accent/5 px-6 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-black dark:text-white">
        <span>
          {before}
          <span className="font-bold">{user.email}</span>
          {after}
        </span>
        {isSuccess ? (
          <span className="font-bold text-accent">{t("auth.banner.sent")}</span>
        ) : (
          <button onClick={() => mutate()} disabled={isPending} className="font-bold text-accent underline underline-offset-4 disabled:opacity-50">
            {t(isPending ? "auth.banner.sending" : "auth.banner.resend")}
          </button>
        )}
        {error && <span className="font-bold text-red-500">{errorMessage(error)}</span>}
      </div>
    </div>
  );
}
