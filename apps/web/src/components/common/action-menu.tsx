import { useEffect, useRef, useState } from "react";
import { Edit3, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@scp/ui";

export function ActionMenu({
  canDelete,
  canEdit,
  deleteLabel = "Delete",
  editLabel = "Edit",
  onDelete,
  onEdit,
}: {
  canDelete?: boolean;
  canEdit?: boolean;
  deleteLabel?: string;
  editLabel?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <div className="action-menu" ref={ref}>
      <Button aria-label="Record actions" onClick={() => setOpen((value) => !value)} size="icon">
        <MoreHorizontal size={15} />
      </Button>
      {open && (
        <div className="action-menu-popover" role="menu">
          {canEdit && (
            <button
              onClick={() => {
                setOpen(false);
                onEdit?.();
              }}
              role="menuitem"
              type="button"
            >
              <Edit3 size={13} />
              {editLabel}
            </button>
          )}
          {canDelete && (
            <button
              className="danger"
              onClick={() => {
                setOpen(false);
                onDelete?.();
              }}
              role="menuitem"
              type="button"
            >
              <Trash2 size={13} />
              {deleteLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
