import { createGroupSchema } from "@urconnections/shared";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { SelectField, TextField } from "../../../components/ui/Field";
import { formResolver } from "../../../lib/formResolver";
import { getPlatform, PLATFORMS } from "../../../lib/platforms";
import { useUser } from "../../auth/hooks/useUser";
import { useCreateGroup } from "../hooks/useCreateGroup";
import GroupFormFields from "./GroupFormFields";
import GroupFormFrame from "./GroupFormFrame";

// `as const` keeps topic and platform as the literal "" (not just string), which the form type allows.
const EMPTY = { title: "", topic: "", platform: "", description: "", meeting_link: "", country: "", city: "" } as const;

// The API refuses groups from unconfirmed addresses (403): say so before the form is filled in.
// "Resend email" is in the banner under the navbar (VerifyEmailBanner).
const UNVERIFIED = "Please confirm your email address first: open the link we emailed you (or use \"Resend email\" above), then come back.";

/** /create: a new group, owned by whoever is signed in (the API takes that from the session). */
export default function CreateGroupPage() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { mutate, isPending, error } = useCreateGroup();
  // The form's types come from the schema: what the fields hold (plus "" before a choice,
  // see formResolver) and what onSubmit receives (already validated, topic is a real Topic).
  const form = useForm({ resolver: formResolver(createGroupSchema), defaultValues: EMPTY });
  const {
    register,
    setValue,
    control,
    handleSubmit,
    formState: { errors },
  } = form;
  const platform = useWatch({ control, name: "platform" });

  return (
    <FormProvider {...form}>
      <GroupFormFrame
        tabTitle="Create a group"
        heroLead="Launch your"
        intro="Design a premium environment for focused growth and meaningful connections."
        cancelTo="/"
        submitLabel="Launch Channel"
        isPending={isPending}
        error={error?.message}
        blockedMessage={user && !user.email_verified ? UNVERIFIED : undefined}
        onSubmit={handleSubmit((values) => mutate(values, { onSuccess: (group) => navigate(`/groups/${group.id}`) }))}
      >
        <GroupFormFields
          linkFields={
            <>
              {/* A link only fits one platform, so changing the platform clears the link. */}
              <SelectField label="Meeting Platform" error={errors.platform?.message} {...register("platform", { onChange: () => setValue("meeting_link", "") })}>
                <option value="" disabled>
                  Select platform
                </option>
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Group Link"
                type="url"
                placeholder={platform ? getPlatform(platform).placeholder : "Select a platform first"}
                disabled={!platform}
                error={errors.meeting_link?.message}
                {...register("meeting_link")}
              />
            </>
          }
        />
      </GroupFormFrame>
    </FormProvider>
  );
}
