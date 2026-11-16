import type { Group } from "@urconnections/shared";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/toast/useToast";
import { useErrorText } from "../../../i18n/errors";
import { useT } from "../../../i18n/i18n";
import { useDeleteGroup } from "../hooks/useDeleteGroup";

interface DeleteGroupDialogProps {
  /** The group to delete; null = dialog closed. */
  group: Group | null;
  onClose: () => void;
  /** Runs after a successful delete (e.g. leave the deleted group's page). */
  onDeleted?: () => void;
}

/**
 * "Delete this group?" confirmation + the delete itself, with a toast for the result.
 * Pages render one of these and open it with a group (audit O9: one delete mutation per
 * page, not one per card).
 */
export default function DeleteGroupDialog({ group, onClose, onDeleted }: DeleteGroupDialogProps) {
  const { mutate: deleteGroup, isPending } = useDeleteGroup();
  const toast = useToast();
  const { t } = useT();
  const { errorMessage } = useErrorText();

  const confirm = () => {
    if (!group) return;
    deleteGroup(group.id, {
      onSuccess: () => {
        toast(t("groups.deleteDialog.deleted", { title: group.title }));
        onClose();
        onDeleted?.();
      },
      onError: (err) => toast(errorMessage(err), "error"),
    });
  };

  return (
    <ConfirmDialog
      open={group !== null}
      title={t("groups.deleteDialog.title")}
      confirmLabel={t("groups.deleteDialog.confirm")}
      busy={isPending}
      onConfirm={confirm}
      onCancel={onClose}
    >
      <strong className="text-black dark:text-white">{group?.title}</strong> {t("groups.deleteDialog.body")}
    </ConfirmDialog>
  );
}
