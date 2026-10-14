import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema } from "@urconnections/shared";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { PasswordField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { useResetPassword } from "../hooks/useEmailFlows";
import AuthLayout from "./AuthLayout";

/** /reset-password?token=… (the link from the reset email): choose a new password. */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { mutate, isPending, isSuccess, error } = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetPasswordFormSchema), defaultValues: { password: "", confirmPassword: "" } });

  if (isSuccess) {
    return (
      <AuthLayout title="Password changed." subtitle="For your safety you've been signed out everywhere. Sign in with your new password.">
        <ButtonLink to="/login" size="lg" block>
          Sign in
        </ButtonLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password." subtitle="At least 8 characters, with upper and lower case, a number and a symbol.">
      {!token && (
        <Notice tone="error" className="mb-8">
          This link is incomplete. Open the link from the email again.
        </Notice>
      )}
      {error && (
        <Notice tone="error" className="mb-8">
          {error.message}{" "}
          <Link to="/forgot-password" className="underline">
            Request a new link
          </Link>
        </Notice>
      )}
      <form onSubmit={handleSubmit(({ password }) => mutate({ token, password }))} className="space-y-6" noValidate>
        <PasswordField label="New Password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <PasswordField label="Confirm New Password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Button type="submit" size="lg" block disabled={!token} loading={isPending}>
          Set new password
        </Button>
      </form>
    </AuthLayout>
  );
}
