import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, oauthErrorMessage } from "@urconnections/shared";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../../components/ui/Button";
import { PasswordField, TextField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { withNext } from "../../../lib/nextPath";
import { useLogin } from "../hooks/useSignIn";
import AuthLayout from "./AuthLayout";
import GoogleSignIn from "./GoogleSignIn";

/** /login. A failed Google sign-in also lands here, as /login?error=<code>. */
export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const googleError = oauthErrorMessage(searchParams.get("error"));
  const { mutate: login, isPending, error } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  return (
    <AuthLayout title="Welcome back." subtitle="Sign in to access your connections." tabTitle="Sign in">
      {(error || googleError) && (
        <Notice tone="error" className="mb-8">
          {error?.message ?? googleError}
        </Notice>
      )}

      <form onSubmit={handleSubmit((values) => login(values))} className="space-y-6" noValidate>
        <TextField label="Email Address" type="email" autoComplete="email" placeholder="name@example.com" error={errors.email?.message} {...register("email")} />
        <div>
          <PasswordField label="Password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs font-bold text-gray-500 transition-colors hover:text-accent">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" block loading={isPending}>
          Sign In
        </Button>
      </form>

      <GoogleSignIn />

      <p className="mt-12 text-center text-xs font-bold text-gray-500 dark:text-gray-400">
        Don't have an account?{" "}
        <Link to={withNext("/signup", searchParams.get("next"))} className="ml-1 border-b border-current text-black hover:text-accent dark:text-white">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
