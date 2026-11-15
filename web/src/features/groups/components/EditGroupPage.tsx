import { zodResolver } from "@hookform/resolvers/zod";
import { updateGroupSchema, type Group } from "@urconnections/shared";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { ReadOnlyField } from "../../../components/ui/Field";
import { NotFound } from "../../../components/ui/NotFound";
import { PageSpinner } from "../../../components/ui/Spinner";
import { useT } from "../../../i18n/i18n";
import { isNotFound } from "../../../lib/apiClient";
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
  const { t } = useT();

  if (isLoading) return <PageSpinner />;
  if (error && !isNotFound(error)) throw error; // server trouble: the route's error page
  if (!group || !isOwner(user, group)) return <NotFound message={t("groups.edit.notOwner")} />;
  // A separate component, so the form starts with the loaded group as its default values.
  return <EditGroupForm group={group} />;
}

function EditGroupForm({ group }: { group: Group }) {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useUpdateGroup();
  const { title, topic, description, country, city } = group;
  const form = useForm({ resolver: zodResolver(editFormSchema), defaultValues: { title, topic, description, country, city } });
  const backTo = `/groups/${group.id}`;
  const { t } = useT();

  return (
    <FormProvider {...form}>
      <GroupFormFrame
        tabTitle={t("groups.edit.tabTitle")}
        heroLead={t("groups.edit.heroLead")}
        intro={t("groups.edit.intro")}
        cancelTo={backTo}
        submitLabel={t("groups.edit.submit")}
        isPending={isPending}
        error={error?.message}
        onSubmit={form.handleSubmit((values) => mutate({ id: group.id, ...values }, { onSuccess: () => navigate(backTo) }))}
      >
        <GroupFormFields
          linkFields={
            <>
              <ReadOnlyField label={t("groups.form.platform")} value={getPlatform(group.platform).label} />
              <ReadOnlyField
                label={t("groups.form.link")}
                value={group.meeting_link}
                hint={t("groups.edit.linkHint")}
              />
            </>
          }
        />
      </GroupFormFrame>
    </FormProvider>
  );
}
