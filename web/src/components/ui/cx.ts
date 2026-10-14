/**
 * Joins class names, skipping empty ones: cx("a", isOn && "b", undefined) → "a b".
 * Lets components add conditional classes without template-string gymnastics.
 */
export const cx = (...classes: (string | false | null | undefined)[]): string => classes.filter(Boolean).join(" ");
