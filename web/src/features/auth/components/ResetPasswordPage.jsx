import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema } from "@urconnections/shared";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { useResetPassword } from "../hooks/useEmailFlows";
import AuthCard, { buttonClass, inputClass, Notice } from "./AuthCard";

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
      <AuthCard title="Password changed." subtitle="For your safety you've been signed out everywhere. Sign in with your new password.">
        <Link to="/login" className={`${buttonClass} block text-center`}>Sign in</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password." subtitle="At least 8 characters, with upper and lower case, a number and a symbol.">
      {!token && <Notice tone="error">This link is incomplete. Open the link from the email again.</Notice>}
      {error && (
        <Notice tone="error">
          {error.message} <Link to="/forgot-password" className="underline">Request a new link</Link>
        </Notice>
      )}
      <form onSubmit={handleSubmit(({ password }) => mutate({ token, password }))} className="space-y-6">
        {[
          ["password", "New Password"],
          ["confirmPassword", "Confirm New Password"],
        ].map(([name, label]) => (
          <div key={name} className="space-y-2">
            <label htmlFor={`reset-${name}`} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              {label}
            </label>
            <input id={`reset-${name}`} type="password" autoComplete="new-password" {...register(name)} className={inputClass} />
            {errors[name] && <p className="text-red-500 text-xs font-bold ml-1">{errors[name].message}</p>}
          </div>
        ))}
        <button type="submit" disabled={!token || isPending} className={buttonClass}>
          {isPending ? "Saving…" : "Set new password"}
        </button>
      </form>
    </AuthCard>
  );
}
