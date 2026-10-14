import type { User } from "@urconnections/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { login, register } from "../../../services/auth.service";
import { clearSavedSearch } from "../../groups/utils/savedSearch";
import { useSetUser } from "./useUser";

/** What happens after any successful sign-in (login or sign-up). */
function useAfterSignIn() {
  const setUser = useSetUser();
  const navigate = useNavigate();
  return (user: User) => {
    setUser(user); // the navbar and route guards know at once
    clearSavedSearch(); // drop filters saved by a previous visitor of this tab
    navigate("/");
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
