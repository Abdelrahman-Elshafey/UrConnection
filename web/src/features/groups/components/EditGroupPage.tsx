import { zodResolver } from "@hookform/resolvers/zod";
import { updateGroupSchema, type Group } from "@urconnections/shared";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { ReadOnlyField } from "../../../components/ui/Field";
import { NotFound } from "../../../components/ui/NotFound";
import { PageSpinner } from "../../../components/ui/Spinner";
import { isOwner } from "../../../lib/format";
import { getPlatform } from "../../../lib/platforms";
import { useUser } from "../../auth/hooks/useUser";
import { useGroup } from "../hooks/useGroup";
import { useUpdateGroup } from "../hooks/useUpdateGroup";
import GroupFormFields from "./GroupFormFields";
import GroupFormFrame from "./GroupFormFrame";

// The form always sends all five editable fields, so each is required here.
const editFormSchema = updateGroupSchema.required();

/**
 * /groups/:groupId/edit. The route needs a session (requireAuth loader). Showing the form
 * only to the owner is a convenience: the API is what actually refuses everyone else.
 */
export default function EditGroupPage() {
  const { groupId } = useParams();
  const { data: user } = useUser();
  const { data: group, isLoading, error } = useGroup(groupId);

  if (isLoading) return <PageSpinner />;
  if (error || !group || !isOwner(user, group)) return <NotFound message="You can only edit groups you created." />;
  // A separate component, so the form starts with the loaded group as its default values.
  return <EditGroupForm group={group} />;
}

function EditGroupForm({ group }: { group: Group }) {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useUpdateGroup();
  const { title, topic, description, country, city } = group;
  const form = useForm({ resolver: zodResolver(editFormSchema), defaultValues: { title, topic, description, country, city } });
  const backTo = `/groups/${group.id}`;

  return (
    <FormProvider {...form}>
      <GroupFormFrame
        tabTitle="Edit group"
        heroLead="Edit your"
        intro="Update how your group is described. The platform and link stay as they are."
        cancelTo={backTo}
        submitLabel="Save Changes"
        isPending={isPending}
        error={error?.message}
        onSubmit={form.handleSubmit((values) => mutate({ id: group.id, ...values }, { onSuccess: () => navigate(backTo) }))}
      >
        <GroupFormFields
          linkFields={
            <>
              <ReadOnlyField label="Meeting Platform" value={getPlatform(group.platform).label} />
              <ReadOnlyField
                label="Group Link"
                value={group.meeting_link}
                hint="The link and platform can't be changed. To use another link, create a new group."
              />
            </>
          }
        />
      </GroupFormFrame>
    </FormProvider>
  );
}
