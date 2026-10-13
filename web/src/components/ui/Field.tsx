import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { FiChevronDown, FiEye, FiEyeOff } from "react-icons/fi";
import { cx } from "./cx";

/*
 * Form fields (audits D3 and A1). Each one is a label + control + optional hint/error,
 * wired together for screen readers:
 *   - useId() makes a unique id per field, so <label htmlFor> points at the right input
 *     (clicking the label focuses it, and a screen reader announces the label);
 *   - aria-invalid marks a field with an error;
 *   - aria-describedby links the field to its hint and error text, which are read out too.
 *
 * They take every normal input/select/textarea prop (ComponentProps<"input">, ...), so
 * react-hook-form's {...register("email")} spreads straight in. That includes its `ref`:
 * since React 19, `ref` is a normal prop of function components, so no forwardRef (audit M7).
 */

interface FieldOwnProps {
  label: string;
  /** Error text (e.g. errors.email?.message). Shown in red, read out by screen readers. */
  error?: string;
  /** Small grey help text under the field. */
  hint?: ReactNode;
  /** The field sits on a grey card: use a white background instead of grey. */
  onSurface?: boolean;
}

const controlClass = (invalid: boolean, onSurface = false) =>
  cx(
    "w-full rounded-2xl border-2 px-6 py-4 text-lg font-bold text-black outline-none transition-all dark:text-white",
    "placeholder:text-gray-300 dark:placeholder:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50",
    onSurface ? "bg-white dark:bg-black" : "bg-surface dark:bg-surface-dark",
    invalid ? "border-red-500/50" : "border-transparent focus:border-accent",
  );

/** Label + slot + hint + error, and the ids that connect them. */
function FieldShell({ id, label, error, hint, children }: Omit<FieldOwnProps, "onSurface"> & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="ml-1 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="ml-1 text-xs font-bold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

/** The aria attributes every control gets. */
function a11y(id: string, { error, hint }: Pick<FieldOwnProps, "error" | "hint">) {
  const describedBy = cx(hint ? `${id}-hint` : null, error ? `${id}-error` : null);
  return { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy || undefined };
}

export function TextField({ label, error, hint, onSurface, className, ...input }: ComponentProps<"input"> & FieldOwnProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <input {...input} {...a11y(id, { error, hint })} className={cx(controlClass(!!error, onSurface), className)} />
    </FieldShell>
  );
}

/** A password input with a show/hide toggle (the toggle has an aria-label, audit A2). */
export function PasswordField({ label, error, hint, onSurface, className, ...input }: Omit<ComponentProps<"input">, "type"> & FieldOwnProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? FiEyeOff : FiEye;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          {...input}
          {...a11y(id, { error, hint })}
          type={visible ? "text" : "password"}
          className={cx(controlClass(!!error, onSurface), "pr-14", className)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 transition-colors hover:text-black dark:hover:text-white"
        >
          <Icon aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </FieldShell>
  );
}

export function SelectField({ label, error, hint, onSurface, className, children, ...select }: ComponentProps<"select"> & FieldOwnProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <select {...select} {...a11y(id, { error, hint })} className={cx(controlClass(!!error, onSurface), "appearance-none pr-12", className)}>
          {children}
        </select>
        <FiChevronDown aria-hidden className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </FieldShell>
  );
}

export function TextAreaField({ label, error, hint, onSurface, className, ...textarea }: ComponentProps<"textarea"> & FieldOwnProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea {...textarea} {...a11y(id, { error, hint })} className={cx(controlClass(!!error, onSurface), "min-h-60 resize-none", className)} />
    </FieldShell>
  );
}

/** A value shown like a field but not editable (e.g. the email on the profile form). */
export function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      {/* An <output>-like read-only input: focusable and announced with its label, but not editable. */}
      <input
        id={id}
        readOnly
        value={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="w-full cursor-not-allowed truncate rounded-2xl bg-gray-200/60 px-6 py-4 text-lg font-bold text-gray-500 outline-none dark:bg-white/5 dark:text-gray-500"
      />
    </FieldShell>
  );
}
