import type { FormEventHandler, ReactNode } from "react";
import { BackLink } from "../../../components/ui/BackLink";
import { Button } from "../../../components/ui/Button";
import { Notice } from "../../../components/ui/Notice";
import { PageHero } from "../../../components/ui/PageHero";
import { pageTitle } from "../../../lib/pageTitle";

interface GroupFormFrameProps {
  tabTitle: string;
  heroLead: string;
  intro: string;
  /** Where "Cancel and Return" goes. */
  cancelTo: string;
  submitLabel: string;
  isPending: boolean;
  error?: string;
  /** Why the form can't be sent yet (e.g. unconfirmed email): shown on top, and submit is disabled. */
  blockedMessage?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}

/** The page around the create and edit forms: headline, back link, error, the form grid, submit. */
export default function GroupFormFrame({ tabTitle, heroLead, intro, cancelTo, submitLabel, isPending, error, blockedMessage, onSubmit, children }: GroupFormFrameProps) {
  return (
    <div className="min-h-screen w-full bg-white px-4 pb-25 pt-12 transition-colors duration-200 dark:bg-black">
      <title>{pageTitle(tabTitle)}</title>
      <div className="mx-auto flex max-w-7xl flex-col items-center">
        <BackLink to={cancelTo} className="mb-10 self-start lg:ml-20">
          Cancel and Return
        </BackLink>
        <PageHero lead={heroLead} accent="Community." intro={intro} className="mb-20 w-full max-w-5xl" />

        {blockedMessage && <Notice className="mb-10 w-full max-w-5xl">{blockedMessage}</Notice>}
        {error && (
          <Notice tone="error" className="mb-10 w-full max-w-5xl">
            {error}
          </Notice>
        )}

        <form onSubmit={onSubmit} noValidate className="grid w-full max-w-5xl grid-cols-1 gap-x-20 gap-y-12 md:grid-cols-2">
          {children}
          <div className="pt-10 md:col-span-2">
            <Button type="submit" size="xl" block disabled={!!blockedMessage} loading={isPending}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
