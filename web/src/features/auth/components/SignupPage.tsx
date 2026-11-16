import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@urconnections/shared";
import { FormProvider, useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../../components/ui/Button";
import { CountryCityFields } from "../../../components/ui/CountryCityFields";
import { PasswordField, TextField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { useErrorText } from "../../../i18n/errors";
import { useT } from "../../../i18n/i18n";
import { withNext } from "../../../lib/nextPath";
import { useRegister } from "../hooks/useSignIn";
import AuthLayout from "./AuthLayout";
import GoogleSignIn from "./GoogleSignIn";

const EMPTY = { email: "", password: "", confirmPassword: "", display_name: "", phone: "", country: "", city: "" };

/** /signup: create an account. Only email and password are required. */
export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const { mutate: registerAccount, isPending, error } = useRegister();
  const { t } = useT();
  const { errorMessage } = useErrorText();
  const optional = (label: string) => t("fields.optional", { label });
  const form = useForm({ resolver: zodResolver(signupSchema), defaultValues: EMPTY });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <AuthLayout title={t("auth.signup.title")} subtitle={t("auth.signup.subtitle")} tabTitle={t("auth.signup.tabTitle")}>
      {error && (
        <Notice tone="error" className="mb-8">
          {errorMessage(error)}
        </Notice>
      )}

      {/* FormProvider lets CountryCityFields find this form (it reads it from context). */}
      <FormProvider {...form}>
        <form
          // confirmPassword is only for this form; the API never sees it.
          onSubmit={handleSubmit(({ confirmPassword: _confirm, ...account }) => registerAccount(account))}
          className="space-y-6"
          noValidate
        >
          <TextField
            label={t("fields.email")}
            type="email"
            autoComplete="email"
            placeholder={t("fields.emailPlaceholder")}
            error={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label={optional(t("fields.displayName"))}
            autoComplete="name"
            placeholder={t("fields.displayNamePlaceholder")}
            error={errors.display_name?.message}
            {...register("display_name")}
          />
          <TextField
            label={optional(t("fields.phone"))}
            type="tel"
            autoComplete="tel"
            placeholder={t("fields.phonePlaceholder")}
            error={errors.phone?.message}
            {...register("phone")}
          />
          <CountryCityFields optional />
          <PasswordField label={t("fields.password")} autoComplete="new-password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
          <PasswordField
            label={t("fields.confirmPassword")}
            autoComplete="new-password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <Button type="submit" size="lg" block loading={isPending}>
            {t("auth.signup.submit")}
          </Button>
        </form>
      </FormProvider>

      <GoogleSignIn />

      <p className="mt-12 text-center text-xs font-bold text-gray-500 dark:text-gray-400">
        {t("auth.signup.haveAccount")}{" "}
        <Link to={withNext("/login", searchParams.get("next"))} className="ml-1 border-b border-current text-black hover:text-accent dark:text-white">
          {t("auth.signup.signIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
