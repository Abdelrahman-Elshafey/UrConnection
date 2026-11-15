import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type User } from "@urconnections/shared";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FiEdit2 } from "react-icons/fi";
import { Button } from "../../../components/ui/Button";
import { CountryCityFields } from "../../../components/ui/CountryCityFields";
import { ReadOnlyField, TextField } from "../../../components/ui/Field";
import { Notice } from "../../../components/ui/Notice";
import { useToast } from "../../../components/ui/toast/useToast";
import { useCountryName } from "../../../i18n/countries";
import { useT } from "../../../i18n/i18n";
import { formatLocation } from "../../../lib/format";
import { useSignOut } from "../../auth/hooks/useUser";
import { useUpdateProfile } from "../hooks/useUpdateProfile";

const formValues = (user: User) => ({ display_name: user.display_name, phone: user.phone, country: user.country, city: user.city });

/** Name, email, phone, location: shown read-only, editable after "Edit Profile". */
export default function ProfileDetails({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateProfile, isPending, error, reset: clearError } = useUpdateProfile();
  const { mutate: signOut } = useSignOut();
  const toast = useToast();
  const { t } = useT();
  const countryName = useCountryName();
  const form = useForm({ resolver: zodResolver(profileSchema), defaultValues: formValues(user) });
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = form;

  // Fill the form only when editing starts, so later cache updates never overwrite
  // unsaved edits (audit B22).
  const startEditing = () => {
    form.reset(formValues(user));
    clearError();
    setIsEditing(true);
  };

  if (!isEditing) {
    return (
      <div className="animate-fade-in">
        <dl className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {[
            [t("profile.details.displayName"), user.display_name || t("profile.details.notSet")],
            [t("profile.details.email"), user.email],
            [t("profile.details.phone"), user.phone || t("profile.details.notSet")],
            [t("profile.details.location"), formatLocation({ city: user.city, country: countryName(user.country) }) || t("profile.details.notSet")],
          ].map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</dt>
              <dd className="break-words text-xl font-bold text-black dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-200 pt-6 dark:border-white/5">
          <Button onClick={startEditing}>
            <FiEdit2 aria-hidden /> {t("profile.details.edit")}
          </Button>
          <Button variant="dark" onClick={() => signOut()}>
            {t("nav.signOut")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={handleSubmit((values) =>
          updateProfile(values, {
            onSuccess: () => {
              setIsEditing(false);
              toast(t("profile.details.updated"));
            },
          }),
        )}
        className="animate-fade-in space-y-8"
      >
        {error && <Notice tone="error">{error.message}</Notice>}
        <ReadOnlyField label={t("profile.details.email")} value={user.email} hint={t("profile.details.emailHint")} />
        <TextField
          label={t("profile.details.displayName")}
          placeholder={t("profile.details.displayNamePlaceholder")}
          onSurface
          error={errors.display_name?.message}
          {...register("display_name")}
        />
        <TextField
          label={t("profile.details.phone")}
          type="tel"
          placeholder={t("profile.details.phonePlaceholder")}
          onSurface
          error={errors.phone?.message}
          {...register("phone")}
        />
        <CountryCityFields optional onSurface />
        <div className="flex flex-wrap gap-4 border-t border-gray-200 pt-6 dark:border-white/5">
          <Button type="submit" loading={isPending} disabled={!isDirty}>
            {t(isPending ? "profile.details.saving" : "profile.details.save")}
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
