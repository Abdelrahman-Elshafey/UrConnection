import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@urconnections/shared";
import { FormProvider, useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "../../../components/ui/Button";
import { CountryCityFields } from "../../../components/ui/CountryCityFields";
import { PasswordField, TextField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { useRegister } from "../hooks/useSignIn";
import AuthLayout from "./AuthLayout";
import GoogleSignIn from "./GoogleSignIn";

const EMPTY = { email: "", password: "", confirmPassword: "", display_name: "", phone: "", country: "", city: "" };

/** /signup: create an account. Only email and password are required. */
export default function SignupPage() {
  const { mutate: registerAccount, isPending, error } = useRegister();
  const form = useForm({ resolver: zodResolver(signupSchema), defaultValues: EMPTY });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <AuthLayout title="Join us." subtitle="Create an account to build your network." tabTitle="Create account">
      {error && (
        <Notice tone="error" className="mb-8">
          {error.message}
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
          <TextField label="Email Address" type="email" autoComplete="email" placeholder="name@example.com" error={errors.email?.message} {...register("email")} />
          <TextField label="Display Name (optional)" autoComplete="name" placeholder="Jane Doe" error={errors.display_name?.message} {...register("display_name")} />
          <TextField label="Phone Number (optional)" type="tel" autoComplete="tel" placeholder="+1 234 567 8900" error={errors.phone?.message} {...register("phone")} />
          <CountryCityFields optional />
          <PasswordField label="Password" autoComplete="new-password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
          <PasswordField label="Confirm Password" autoComplete="new-password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <Button type="submit" size="lg" block loading={isPending}>
            Create Account
          </Button>
        </form>
      </FormProvider>

      <GoogleSignIn />

      <p className="mt-12 text-center text-xs font-bold text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="ml-1 border-b border-current text-black hover:text-accent dark:text-white">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
