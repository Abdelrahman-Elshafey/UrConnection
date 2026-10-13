import { Link, useNavigate, useParams } from "react-router";
import { useUser } from "../../auth/hooks/useUser";
import { useGroup } from "../hooks/useGroup";
import { useUpdateGroup } from "../hooks/useUpdateGroup";
import GroupForm from "./GroupForm";

/**
 * /groups/:groupId/edit. The route needs a session (requireAuth loader). Showing the form
 * only to the owner is a convenience: the API is what actually refuses everyone else.
 */
export default function EditGroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: group, isLoading, error: loadError } = useGroup(groupId);
  const { mutate, isPending, error } = useUpdateGroup();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-[#000000]">
        <div className="w-12 h-12 border-[3px] border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !group || group.user_id !== user?.id) {
    return (
      <div className="flex justify-center p-20 bg-white dark:bg-[#000000] h-screen">
        <div className="text-center">
          <h2 className="text-4xl font-black text-black dark:text-white mb-4 tracking-tighter">Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You can only edit groups you created.</p>
          <Link to="/" className="text-[#0071e3] font-bold uppercase tracking-widest text-xs">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <GroupForm
      mode="edit"
      group={group}
      cancelTo={`/groups/${group.id}`}
      isPending={isPending}
      error={error?.message}
      onSubmit={(values) => mutate({ id: group.id, ...values }, { onSuccess: () => navigate(`/groups/${group.id}`) })}
    />
  );
}
