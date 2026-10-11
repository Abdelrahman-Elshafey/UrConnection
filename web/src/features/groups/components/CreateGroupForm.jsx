import { useNavigate } from "react-router-dom";
import { useCreateGroup } from "../hooks/useCreateGroup";
import GroupForm from "./GroupForm";

/** /create: a new group, owned by whoever is signed in (the API decides that from the session). */
export default function CreateGroupForm() {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useCreateGroup();

  return (
    <GroupForm
      mode="create"
      cancelTo="/"
      isPending={isPending}
      error={error?.message}
      onSubmit={(values) => mutate(values, { onSuccess: (group) => navigate(`/groups/${group.id}`) })}
    />
  );
}
