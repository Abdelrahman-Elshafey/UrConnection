import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FaGoogle, FaApple, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithPassword,
  signUp,
  signInWithOAuth,
} from "../../../services/auth.service";




const authSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  confirmPassword: z.string().optional(),
  displayName: z.string().optional(),
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  isLogin: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (!data.isLogin) {
    if (data.password.length < 8) {
      ctx.addIssue({ path: ["password"], code: z.ZodIssueCode.custom, message: "Password must be at least 8 characters." });
    } else if (!/[a-z]/.test(data.password)) {
      ctx.addIssue({ path: ["password"], code: z.ZodIssueCode.custom, message: "Password must contain at least one lowercase (a-z)." });
    } else if (!/[A-Z]/.test(data.password)) {
      ctx.addIssue({ path: ["password"], code: z.ZodIssueCode.custom, message: "Password must contain at least one uppercase (A-Z)." });
    } else if (!/[0-9]/.test(data.password)) {
      ctx.addIssue({ path: ["password"], code: z.ZodIssueCode.custom, message: "Password must contain at least one number." });
    } else if (!/[^a-zA-Z0-9]/.test(data.password)) {
      ctx.addIssue({ path: ["password"], code: z.ZodIssueCode.custom, message: "Password must contain a special character." });
    }
    
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ path: ["confirmPassword"], code: z.ZodIssueCode.custom, message: "Passwords do not match." });
    }
  }
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", displayName: "", phoneNumber: "", country: "", city: "", isLogin: true },
  });

  const toggleMode = () => {
    setIsLogin((prev) => {
      const newMode = !prev;
      setAuthError("");
      reset({ email: "", password: "", confirmPassword: "", displayName: "", phoneNumber: "", country: "", city: "", isLogin: newMode });
      return newMode;
    });
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError("");
    try {
      if (data.isLogin) {
        await signInWithPassword(data.email, data.password);
      } else {
        await signUp(data.email, data.password, {
          displayName: data.displayName,
          phoneNumber: data.phoneNumber,
          country: data.country,
          city: data.city,
        });
      }
      navigate("/");
    } catch (error) {
      setAuthError(error.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      await signInWithOAuth(provider);
    } catch (error) {
      setAuthError(error.message || `Failed to sign in with ${provider}.`);
    }
  };

  return (

    <div className="min-h-screen bg-white dark:bg-[#000000] flex flex-col justify-center py-20 px-6 transition-colors duration-200">
      <div className="absolute top-10 left-6 lg:left-20">
        <Link
          to="/"
          className="flex items-center gap-2 group text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
            Return to Explore
          </span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-black dark:text-white tracking-tighter leading-[0.9] mb-4">
            {isLogin ? "Welcome back." : "Join us."}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
            {isLogin
              ? "Sign in to access your connections."
              : "Create an account to build your network."}
          </p>
        </div>

        {authError && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl text-center">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 tracking-wide">
              {authError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              className={`w-full bg-[#f5f5f7] dark:bg-[#111111] px-6 py-5 rounded-2xl outline-none text-lg font-bold transition-all border-2 ${errors.email ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"} text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs font-bold ml-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  {...register("displayName")}
                  className="w-full bg-[#f5f5f7] dark:bg-[#111111] px-6 py-5 rounded-2xl outline-none text-lg font-bold transition-all border-2 border-transparent focus:border-[#0071e3] text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  {...register("phoneNumber")}
                  className="w-full bg-[#f5f5f7] dark:bg-[#111111] px-6 py-5 rounded-2xl outline-none text-lg font-bold transition-all border-2 border-transparent focus:border-[#0071e3] text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Country (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Country"
                    {...register("country")}
                    className="w-full bg-[#f5f5f7] dark:bg-[#111111] px-6 py-5 rounded-2xl outline-none text-lg font-bold transition-all border-2 border-transparent focus:border-[#0071e3] text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    City (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    {...register("city")}
                    className="w-full bg-[#f5f5f7] dark:bg-[#111111] px-6 py-5 rounded-2xl outline-none text-lg font-bold transition-all border-2 border-transparent focus:border-[#0071e3] text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className={`w-full bg-[#f5f5f7] dark:bg-[#111111] px-6 py-5 rounded-2xl outline-none text-lg font-bold transition-all border-2 ${errors.password ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"} text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700 pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs font-bold ml-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`w-full bg-[#f5f5f7] dark:bg-[#111111] px-6 py-5 rounded-2xl outline-none text-lg font-bold transition-all border-2 ${errors.confirmPassword ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"} text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700 pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs font-bold ml-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0071e3] text-white font-bold py-5 rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-3 cursor-pointer"
          >
            {isLoading && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative mb-10 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-[#1d1d1f]"></div>
          </div>
          <div className="relative bg-white dark:bg-[#000000] px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Or continue with
          </div>
        </div>

        <div className="flex items-center justify-center ">
          <button
            onClick={() => handleOAuth("google")}
            className="flex items-center justify-center gap-3 text-xl px-20 bg-[#f5f5f7] dark:bg-[#111111] hover:bg-gray-200 dark:hover:bg-[#1d1d1f] text-black dark:text-white py-6 rounded-full font-bold transition-colors cursor-pointer"
          >
            <FaGoogle className="text-xl" /> Google
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={toggleMode}
              className="ml-2 cursor-pointer text-black dark:text-white hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors border-b border-black dark:border-white hover:border-[#0071e3]"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
