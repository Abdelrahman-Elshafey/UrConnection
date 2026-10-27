import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@urconnections/shared";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "../../../components/ui/Button";
import { TextField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { useForgotPassword } from "../hooks/useEmailFlows";
import AuthLayout from "./AuthLayout";

/** /forgot-password: ask for a reset link. The answer never reveals whether the email has an account. */
export default function ForgotPasswordPage() {
  const { mutate, isPending, data: message, error } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      {message && <Notice className="mb-8">{message}</Notice>}
      {error && (
        <Notice tone="error" className="mb-8">
          {error.message}
        </Notice>
      )}
      <form onSubmit={handleSubmit(({ email }) => mutate(email))} className="mb-10 space-y-6" noValidate>
        <TextField label="Email Address" type="email" autoComplete="email" placeholder="name@example.com" error={errors.email?.message} {...register("email")} />
        <Button type="submit" size="lg" block loading={isPending}>
          Send reset link
        </Button>
      </form>
      <Link to="/login" className="text-xs font-bold text-gray-500 hover:text-accent">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
