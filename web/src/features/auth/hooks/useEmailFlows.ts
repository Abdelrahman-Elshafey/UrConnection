import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  forgotPassword,
  requestVerificationEmail,
  resetPassword,
  verifyEmail,
} from "../../../services/auth.service";
import { SESSION_QUERY_KEY, switchUser } from "./useUser";

/** Confirm the email; then refresh "who am I" so email_verified updates everywhere. */
export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  });
}

export function useResendVerification() {
  return useMutation({ mutationFn: requestVerificationEmail });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword });
}

/** After a reset every session is gone (including this one), so forget the cached user. */
export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => resetPassword(token, password),
    onSuccess: () => switchUser(queryClient, null),
  });
}
