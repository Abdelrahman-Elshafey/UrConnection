import { z } from "zod";
import { PLATFORMS, PLATFORM_MAP } from "./platforms";

// Build the list of valid platform keys for the enum
const platformKeys = PLATFORMS.map((p) => p.key);

export const groupSchema = z
  .object({
    topic: z.string().min(1, "Interest is required"),

    title: z
      .string()
      .min(1, "Title is required")
      .max(20, "Title is too long (max 20)"),

    platform: z
      .string()
      .min(1, "Platform is required")
      .refine((val) => platformKeys.includes(val), {
        message: "Please select a valid platform",
      }),

    meeting_link: z.url({ message: "Please enter a valid URL" }),

    country: z.string().min(1, "Country is required"),

    city: z.string().min(1, "City is required"),

    description: z
      .string()
      .min(1, "Description is required")
      .min(20, "Description too short (min 50)")
      .max(200, "Description too long (max 500)"),
  })
  .refine(
    (data) => {
      if (!data.platform || !data.meeting_link) return true;
      const platform = PLATFORM_MAP[data.platform];
      if (!platform?.domains) return true;
      return platform.domains.test(data.meeting_link);
    },
    {
      message: "Link does not match the selected platform",
      path: ["meeting_link"],
    },
  );
