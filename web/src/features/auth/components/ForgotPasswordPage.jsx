import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@urconnections/shared";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { useForgotPassword } from "../hooks/useEmailFlows";
import AuthCard, { buttonClass, inputClass, Notice } from "./AuthCard";

/** /forgot-password: ask for a reset link. The answer never reveals whether the email has an account. */
export default function ForgotPasswordPage() {
  const { mutate, isPending, data: message, error } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      {message && <Notice>{message}</Notice>}
      {error && <Notice tone="error">{error.message}</Notice>}
      <form onSubmit={handleSubmit(({ email }) => mutate(email))} className="space-y-6 mb-10">
        <div className="space-y-2">
          <label htmlFor="forgot-email" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
            Email Address
          </label>
          <input id="forgot-email" type="email" placeholder="name@example.com" {...register("email")} className={inputClass} />
          {errors.email && <p className="text-red-500 text-xs font-bold ml-1">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={isPending} className={buttonClass}>
          {isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <Link to="/login" className="text-xs font-bold text-gray-500 hover:text-[#0071e3]">Back to sign in</Link>
    </AuthCard>
  );
}
