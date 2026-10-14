import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import type { z } from "zod";

/** Every string field may also be "" (an empty <select> before the user picks). */
type AllowEmpty<T> = { [K in keyof T]: T[K] extends string ? T[K] | "" : T[K] };

/**
 * zodResolver for forms whose selects start empty.
 *
 * The problem: in createGroupSchema, `topic` is z.enum(TOPICS), so its type is
 * "Programming" | "Math" | ..., and a form that starts at topic: "" doesn't type-check,
 * although "" is exactly right for "nothing chosen yet".
 *
 * This keeps the schema strict (it still rejects "" with "Interest is required") and only
 * widens the type of the *form values* to allow "". What onSubmit receives is unchanged:
 * the schema's output, where topic is a real Topic. The cast is safe because zod checks
 * every value at runtime anyway; it only tells TypeScript what the form may hold.
 */
export function formResolver<S extends z.ZodType<Record<string, unknown>, Record<string, unknown>>>(schema: S) {
  return zodResolver(schema) as unknown as Resolver<AllowEmpty<z.input<S>>, unknown, z.output<S>>;
}
