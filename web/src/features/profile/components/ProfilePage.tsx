import type { Group } from "@urconnections/shared";
import { useState } from "react";
import { ButtonLink } from "../../../components/ui/Button";
import { PageHero } from "../../../components/ui/PageHero";
import { PageSpinner } from "../../../components/ui/Spinner";
import { pageTitle } from "../../../lib/pageTitle";
import { useUser } from "../../auth/hooks/useUser";
import DeleteGroupDialog from "../../groups/components/DeleteGroupDialog";
import GroupCard from "../../groups/components/GroupCard";
import { useMyGroups } from "../../groups/hooks/useMyGroups";
import ProfileAvatar from "./ProfileAvatar";
import ProfileDetails from "./ProfileDetails";

/** Small uppercase section label + description, left of each section's content. */
function SectionIntro({ title, children }: { title: string; children: string }) {
  return (
    <div className="lg:col-span-1">
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.5em] text-gray-400 dark:text-gray-500">{title}</h2>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{children}</p>
    </div>
  );
}

/** /profile: your account details and the groups you created. */
export default function ProfilePage() {
  const { data: user, isLoading } = useUser();
  const { data: groups, isLoading: isGroupsLoading } = useMyGroups(!!user);
  const [toDelete, setToDelete] = useState<Group | null>(null);

  // The route loader guarantees a session, so `user` is only missing while loading.
  if (isLoading || !user) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-white px-6 py-10 transition-colors duration-200 dark:bg-black">
      <title>{pageTitle("Your profile")}</title>
      <div className="mx-auto max-w-7xl">
        <PageHero lead="Your" accent="Profile." intro="Manage your account details and view the communities you've launched." className="mb-10" />

        <section className="mb-24 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <SectionIntro title="Account Information">Your personal details and contact information. Manage how you appear to others.</SectionIntro>
          <div className="space-y-10 rounded-[40px] bg-surface p-10 dark:bg-surface-dark md:p-16 lg:col-span-2">
            <div className="flex justify-center border-b border-gray-200 pb-6 dark:border-white/5">
              <ProfileAvatar user={user} />
            </div>
            <ProfileDetails user={user} />
          </div>
        </section>

        <section>
          <div className="mb-12">
            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.5em] text-gray-400 dark:text-gray-500">Your Groups</h2>
            <p className="text-4xl font-black tracking-tighter text-black dark:text-white md:text-5xl">Communities you lead.</p>
          </div>

          {isGroupsLoading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[400px] animate-pulse rounded-4xl bg-surface dark:bg-surface-dark" />
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="mx-4 grid grid-cols-1 justify-items-center gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3 xl:grid-cols-4">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} onDelete={setToDelete} />
              ))}
            </div>
          ) : (
            <div className="rounded-[40px] bg-surface p-20 text-center dark:bg-surface-dark">
              <p className="mb-8 text-2xl font-bold text-gray-400 dark:text-gray-600">You haven't created any groups yet.</p>
              <ButtonLink to="/create" size="lg">
                Launch your first channel
              </ButtonLink>
            </div>
          )}
        </section>
      </div>

      <DeleteGroupDialog group={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
