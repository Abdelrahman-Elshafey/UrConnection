import type { Group } from "@urconnections/shared";
import { FiEdit2, FiMapPin, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router";
import { PlatformBadge } from "../../../components/ui/PlatformBadge";
import { formatLocation, isOwner } from "../../../lib/format";
import { useUser } from "../../auth/hooks/useUser";

interface GroupCardProps {
  group: Group;
  /** Called when the owner clicks delete. The page owns the confirmation dialog and the request. */
  onDelete?: (group: Group) => void;
}

const cardLink =
  "mx-auto rounded-full px-6 py-2 text-center text-sm font-bold text-black transition-all duration-200 hover:bg-black hover:text-white hover:shadow-lg dark:text-gray-400 dark:hover:bg-white dark:hover:text-black md:text-base";

/** One group in a grid. The owner also sees Edit and Delete (the API refuses everyone else anyway). */
export default function GroupCard({ group, onDelete }: GroupCardProps) {
  const { id, title, description, topic, platform, meeting_link } = group;
  const { data: user } = useUser();
  const location = formatLocation(group);

  return (
    <article className="group relative flex min-w-70 max-w-70 flex-col overflow-hidden rounded-4xl border border-gray-200 bg-surface px-6 pb-3 pt-6 shadow-lg transition-all duration-200 hover:scale-105 hover:border-gray-300 hover:shadow-2xl dark:border-black dark:bg-surface-dark dark:hover:border-line-dark">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-gray-100 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-black dark:border-line-dark dark:bg-black dark:text-white">
            {topic}
          </span>
          <PlatformBadge platform={platform} />
        </div>

        {isOwner(user, group) && (
          <div className="flex items-center gap-1">
            <Link to={`/groups/${id}/edit`} aria-label={`Edit ${title}`} className="p-1 text-gray-400 transition-colors hover:text-accent">
              <FiEdit2 aria-hidden className="h-4 w-4" />
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(group)}
                aria-label={`Delete ${title}`}
                className="p-1 text-gray-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
              >
                <FiTrash2 aria-hidden className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-2 flex-1 border-b border-gray-400/50 pb-10 dark:border-line-dark/50">
        <h3 className="mb-3 text-base font-black leading-tight tracking-tighter text-black dark:text-white md:text-lg">{title}</h3>
        <p className="line-clamp-2 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400 md:text-sm">{description}</p>
      </div>

      <div className="grid grid-cols-1">
        <a href={meeting_link} target="_blank" rel="noreferrer" className={cardLink}>
          Connect now
        </a>
        <Link to={`/groups/${id}`} className={`mb-3 w-[70%] ${cardLink}`}>
          View Details
        </Link>
      </div>

      {location && (
        <p className="flex items-center gap-2 border-t border-gray-400/50 pb-0.5 pt-4 text-xs font-bold uppercase text-gray-400 dark:border-line-dark/50 dark:text-gray-500">
          <FiMapPin aria-hidden className="h-3 w-3 shrink-0 text-red-500/50" />
          <span className="truncate">{location}</span>
        </p>
      )}
    </article>
  );
}
