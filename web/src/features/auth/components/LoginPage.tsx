import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, oauthErrorMessage, type OAuthErrorCode } from "@urconnections/shared";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../../components/ui/Button";
import { PasswordField, TextField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { useErrorText } from "../../../i18n/errors";
import { useT } from "../../../i18n/i18n";
import { withNext } from "../../../lib/nextPath";
import { useLogin } from "../hooks/useSignIn";
import AuthLayout from "./AuthLayout";
import GoogleSignIn from "./GoogleSignIn";

/** /login. A failed Google sign-in also lands here, as /login?error=<code>. */
export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const { t } = useT();
  const { errorMessage } = useErrorText();
  // Only codes the API really sends get a message (oauthErrorMessage knows them); anything
  // else in the URL is ignored, so a crafted link can't put its own text on the page.
  const errorCode = searchParams.get("error");
  const googleError = oauthErrorMessage(errorCode) === undefined ? undefined : t(`auth.oauth.${errorCode as OAuthErrorCode}`);
  const { mutate: login, isPending, error } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  return (
    <AuthLayout title={t("auth.login.title")} subtitle={t("auth.login.subtitle")} tabTitle={t("auth.login.tabTitle")}>
      {(error || googleError) && (
        <Notice tone="error" className="mb-8">
          {error ? errorMessage(error) : googleError}
        </Notice>
      )}

      <form onSubmit={handleSubmit((values) => login(values))} className="space-y-6" noValidate>
        <TextField
          label={t("fields.email")}
          type="email"
          autoComplete="email"
          placeholder={t("fields.emailPlaceholder")}
          error={errors.email?.message}
          {...register("email")}
        />
        <div>
          <PasswordField label={t("fields.password")} autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs font-bold text-gray-500 transition-colors hover:text-accent">
              {t("auth.login.forgot")}
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" block loading={isPending}>
          {t("auth.login.submit")}
        </Button>
      </form>

      <GoogleSignIn />

      <p className="mt-12 text-center text-xs font-bold text-gray-500 dark:text-gray-400">
        {t("auth.login.noAccount")}{" "}
        <Link to={withNext("/signup", searchParams.get("next"))} className="ml-1 border-b border-current text-black hover:text-accent dark:text-white">
          {t("auth.login.signUp")}
        </Link>
      </p>
    </AuthLayout>
  );
}
