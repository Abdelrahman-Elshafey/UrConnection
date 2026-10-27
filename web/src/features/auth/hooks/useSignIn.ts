import type { User } from "@urconnections/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { login, register } from "../../../services/auth.service";
import { clearSavedSearch } from "../../groups/utils/savedSearch";
import { safeNextPath } from "../../../lib/nextPath";
import { switchUser } from "./useUser";

/** What happens after any successful sign-in (login or sign-up). */
function useAfterSignIn() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return (user: User) => {
    switchUser(queryClient, user); // the navbar and route guards know at once
    clearSavedSearch(); // drop filters saved by a previous visitor of this tab
    navigate(safeNextPath(searchParams.get("next"))); // back to the page that asked for sign-in
  };
}

/** Email + password sign-in. The API sets the session cookie and answers with the user. */
export function useLogin() {
  return useMutation({ mutationFn: login, onSuccess: useAfterSignIn() });
}

/** Create an account (and sign in). */
export function useRegister() {
  return useMutation({ mutationFn: register, onSuccess: useAfterSignIn() });
}
