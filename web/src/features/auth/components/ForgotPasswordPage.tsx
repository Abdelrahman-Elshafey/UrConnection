import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@urconnections/shared";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "../../../components/ui/Button";
import { TextField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { useT } from "../../../i18n/i18n";
import { useForgotPassword } from "../hooks/useEmailFlows";
import AuthLayout from "./AuthLayout";

/** /forgot-password: ask for a reset link. The answer never reveals whether the email has an account. */
export default function ForgotPasswordPage() {
  const { mutate, isPending, isSuccess, error } = useForgotPassword();
  const { t } = useT();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  return (
    <AuthLayout title={t("auth.forgot.title")} subtitle={t("auth.forgot.subtitle")}>
      {/* The API always answers with the same sentence (so it never reveals which emails have an
          account); we show our own translation of it. */}
      {isSuccess && <Notice className="mb-8">{t("auth.forgot.sent")}</Notice>}
      {error && (
        <Notice tone="error" className="mb-8">
          {error.message}
        </Notice>
      )}
      <form onSubmit={handleSubmit(({ email }) => mutate(email))} className="mb-10 space-y-6" noValidate>
        <TextField
          label={t("fields.email")}
          type="email"
          autoComplete="email"
          placeholder={t("fields.emailPlaceholder")}
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" size="lg" block loading={isPending}>
          {t("auth.forgot.submit")}
        </Button>
      </form>
      <Link to="/login" className="text-xs font-bold text-gray-500 hover:text-accent">
        {t("auth.forgot.back")}
      </Link>
    </AuthLayout>
  );
}
