import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { useNavigate, useParams } from "react-router";
import { BackLink } from "../../../components/ui/BackLink";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { NotFound } from "../../../components/ui/NotFound";
import { PlatformBadge } from "../../../components/ui/PlatformBadge";
import { PageSpinner } from "../../../components/ui/Spinner";
import { isNotFound } from "../../../lib/apiClient";
import { formatLocation, isOwner } from "../../../lib/format";
import { pageTitle } from "../../../lib/pageTitle";
import { getPlatform } from "../../../lib/platforms";
import { useUser } from "../../auth/hooks/useUser";
import { useGroup } from "../hooks/useGroup";
import DeleteGroupDialog from "./DeleteGroupDialog";

/** /groups/:groupId: everything about one group, and the link to join it. */
export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  // Hooks must run on every render, so they all come before the early returns below.
  const { data: group, isLoading, error } = useGroup(groupId);
  const { data: user } = useUser();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading) return <PageSpinner label="Loading Detail" />;
  // Any other error (server down, 500) isn't "not found": the route's error page offers a reload.
  if (error && !isNotFound(error)) throw error;
  if (!group) return <NotFound />;

  const { title, topic, description, meeting_link, platform } = group;

  return (
    <div className="w-full bg-white transition-colors duration-200 dark:bg-black">
      <title>{pageTitle(title)}</title>

      <section className="relative w-full overflow-hidden bg-surface px-6 py-10 dark:bg-surface-dark">
        <div className="relative z-10 mx-auto max-w-7xl">
          <BackLink to="/" className="mb-8">
            Back to Explore
          </BackLink>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-black">
              {topic}
            </span>
            <PlatformBadge platform={platform} size="md" />
          </div>
          <h1 className="max-w-5xl text-2xl font-black leading-[0.85] tracking-[-0.05em] text-black dark:text-white md:text-4xl lg:text-[5rem]">{title}</h1>
        </div>
        {/* Abstract glow */}
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[600px] w-[600px] rounded-full bg-accent opacity-10 blur-[150px] dark:opacity-5" />
      </section>

      <section className="w-full bg-white px-6 py-12 dark:bg-black">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-24 lg:grid-cols-2 lg:gap-44">
          <div className="space-y-10">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Description</h2>
            <p className="whitespace-pre-wrap wrap-break-word text-2xl font-medium leading-relaxed tracking-tight text-black dark:text-white md:text-3xl">
              {description}
            </p>
          </div>

          <div className="flex flex-col justify-between border-l border-gray-100 py-2 pl-12 dark:border-raised-dark lg:pl-20">
            <dl className="space-y-6">
              <div className="flex flex-col gap-1">
                <dt className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Location</dt>
                <dd className="text-xl font-bold text-black dark:text-white">{formatLocation(group) || "Global Network"}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Access Platform</dt>
                <dd className="text-xl font-bold text-black dark:text-white">{getPlatform(platform).label}</dd>
              </div>
            </dl>

            <div className="mt-20">
              <a
                href={meeting_link}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-6 rounded-full bg-accent px-12 py-6 text-lg font-bold text-white shadow-2xl shadow-accent/30 transition hover:brightness-110"
              >
                Connect now
                <FiArrowRight aria-hidden className="h-6 w-6 transition-transform group-hover:translate-x-2" />
              </a>
            </div>

            {isOwner(user, group) && (
              <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-100 pt-6 dark:border-raised-dark">
                <ButtonLink to={`/groups/${group.id}/edit`} variant="dark">
                  Edit Group
                </ButtonLink>
                <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                  Delete Group
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <DeleteGroupDialog group={confirmingDelete ? group : null} onClose={() => setConfirmingDelete(false)} onDeleted={() => navigate("/profile")} />
    </div>
  );
}
