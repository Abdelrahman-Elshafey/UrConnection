import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema } from "@urconnections/shared";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { PasswordField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { useT } from "../../../i18n/i18n";
import { useResetPassword } from "../hooks/useEmailFlows";
import AuthLayout from "./AuthLayout";

/** /reset-password?token=… (the link from the reset email): choose a new password. */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { mutate, isPending, isSuccess, error } = useResetPassword();
  const { t } = useT();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetPasswordFormSchema), defaultValues: { password: "", confirmPassword: "" } });

  if (isSuccess) {
    return (
      <AuthLayout title={t("auth.reset.doneTitle")} subtitle={t("auth.reset.doneSubtitle")}>
        <ButtonLink to="/login" size="lg" block>
          {t("auth.reset.signIn")}
        </ButtonLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.reset.title")} subtitle={t("auth.reset.subtitle")}>
      {!token && (
        <Notice tone="error" className="mb-8">
          {t("auth.linkIncomplete")}
        </Notice>
      )}
      {error && (
        <Notice tone="error" className="mb-8">
          {error.message}{" "}
          <Link to="/forgot-password" className="underline">
            {t("auth.reset.requestNew")}
          </Link>
        </Notice>
      )}
      <form onSubmit={handleSubmit(({ password }) => mutate({ token, password }))} className="space-y-6" noValidate>
        <PasswordField label={t("auth.reset.newPassword")} autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <PasswordField label={t("auth.reset.confirmNew")} autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Button type="submit" size="lg" block disabled={!token} loading={isPending}>
          {t("auth.reset.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
