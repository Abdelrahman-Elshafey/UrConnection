import { TOPICS } from "@urconnections/shared";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { CountryCityFields } from "../../../components/ui/CountryCityFields";
import { SelectField, TextAreaField, TextField } from "../../../components/ui/Field";
import { useT } from "../../../i18n/i18n";

/** The fields both the create and the edit form have. */
interface SharedGroupFields {
  topic: string;
  title: string;
  description: string;
  country: string;
  city: string;
}

/**
 * The fields shared by create and edit, read from the surrounding <FormProvider>.
 * `linkFields` fills the platform + link row: editable selects on create, read-only on edit.
 */
export default function GroupFormFields({ linkFields }: { linkFields: ReactNode }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SharedGroupFields>();
  const { t } = useT();

  return (
    <>
      <SelectField label={t("groups.form.topic")} error={errors.topic?.message} {...register("topic")}>
        <option value="" disabled>
          {t("groups.form.selectTopic")}
        </option>
        {TOPICS.map((topic) => (
          <option key={topic} value={topic}>
            {t(`topics.${topic}`)}
          </option>
        ))}
      </SelectField>
      <TextField label={t("groups.form.title")} placeholder={t("groups.form.titlePlaceholder")} error={errors.title?.message} {...register("title")} />

      {linkFields}

      <div className="md:col-span-2">
        <CountryCityFields countryLabel={t("groups.form.country")} cityLabel={t("groups.form.city")} />
      </div>
      <div className="md:col-span-2">
        <TextAreaField
          label={t("groups.form.description")}
          placeholder={t("groups.form.descriptionPlaceholder")}
          hint={t("groups.form.descriptionHint")}
          error={errors.description?.message}
          {...register("description")}
        />
      </div>
    </>
  );
}
