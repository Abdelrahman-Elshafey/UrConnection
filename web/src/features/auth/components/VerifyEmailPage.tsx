import { useSearchParams } from "react-router";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { Notice } from "../../../components/ui/Notice";
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

  if (isSuccess) {
    return (
      <AuthLayout title="Email confirmed." subtitle="Thanks! You can now create groups.">
        <ButtonLink to="/" size="lg" block>
          Explore groups
        </ButtonLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Confirm your email." subtitle="One click and your address is verified.">
      {!token && (
        <Notice tone="error" className="mb-8">
          This link is incomplete. Open the link from the email again.
        </Notice>
      )}
      {error && (
        <Notice tone="error" className="mb-8">
          {error.message}
        </Notice>
      )}
      <Button onClick={() => mutate(token)} size="lg" block disabled={!token} loading={isPending}>
        Confirm my email
      </Button>
    </AuthLayout>
  );
}
