import { TOPICS } from "@urconnections/shared";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { CountryCityFields } from "../../../components/ui/CountryCityFields";
import { SelectField, TextAreaField, TextField } from "../../../components/ui/Field";

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

  return (
    <>
      <SelectField label="Field of Interest" error={errors.topic?.message} {...register("topic")}>
        <option value="" disabled>
          Select category
        </option>
        {TOPICS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </SelectField>
      <TextField label="Group Name" placeholder="e.g. Design Collective" error={errors.title?.message} {...register("title")} />

      {linkFields}

      <div className="md:col-span-2">
        <CountryCityFields countryLabel="Network Location" cityLabel="Specific City" />
      </div>
      <div className="md:col-span-2">
        <TextAreaField
          label="Group Description"
          placeholder="What is the objective of this connection?"
          hint="20 to 200 characters."
          error={errors.description?.message}
          {...register("description")}
        />
      </div>
    </>
  );
}
