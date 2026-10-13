import type { ComponentProps } from "react";
import { Link } from "react-router";
import { buttonClass, type ButtonStyle } from "./buttonClass";
import { Spinner } from "./Spinner";

type ButtonProps = ComponentProps<"button"> & ButtonStyle & { loading?: boolean };

/**
 * A button (audit D10). It also takes every normal <button> prop: ComponentProps<"button">
 * means "whatever <button> accepts", so onClick, disabled, aria-* are typed for free.
 * `loading` shows a spinner and disables it. `type` defaults to "button" (HTML's default
 * is "submit"), so a button inside a form never submits it by accident.
 */
export function Button({ variant, size, block, loading = false, className, type = "button", disabled, children, ...rest }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClass({ variant, size, block }, className)} {...rest}>
      {loading && <Spinner size="sm" tone="current" />}
      {children}
    </button>
  );
}

/**
 * A link that looks like a button. A separate component rather than <Button as={Link}>:
 * a link navigates and a button acts, and keeping them apart keeps both prop types simple
 * (a "polymorphic" component needs much more complicated generic types).
 */
export function ButtonLink({ variant, size, block, className, ...rest }: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={buttonClass({ variant, size, block }, className)} {...rest} />;
}
