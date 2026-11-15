import { useSearchParams } from "react-router";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { Notice } from "../../../components/ui/Notice";
import { useT } from "../../../i18n/i18n";
import { useVerifyEmail } from "../hooks/useEmailFlows";
import AuthLayout from "./AuthLayout";

/**
 * /verify-email?token=… (the link from the verification email).
 *
 * Why a button instead of verifying as soon as the page opens:
 *  - Mail security scanners (e.g. Outlook "Safe Links") open links before you do.
 *    A link that verified on open would be used up by the scanner.
 *  - React's StrictMode runs effects twice in development, which would send the
 *    one-time token twice and show an error.
 * A click is a deliberate POST: only a real person triggers it, exactly once.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { mutate, isPending, isSuccess, error } = useVerifyEmail();
  const { t } = useT();

  if (isSuccess) {
    return (
      <AuthLayout title={t("auth.verify.doneTitle")} subtitle={t("auth.verify.doneSubtitle")}>
        <ButtonLink to="/" size="lg" block>
          {t("auth.verify.explore")}
        </ButtonLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.verify.title")} subtitle={t("auth.verify.subtitle")}>
      {!token && (
        <Notice tone="error" className="mb-8">
          {t("auth.linkIncomplete")}
        </Notice>
      )}
      {error && (
        <Notice tone="error" className="mb-8">
          {error.message}
        </Notice>
      )}
      <Button onClick={() => mutate(token)} size="lg" block disabled={!token} loading={isPending}>
        {t("auth.verify.submit")}
      </Button>
    </AuthLayout>
  );
}
