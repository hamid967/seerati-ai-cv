import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export function SortableList({
  ids,
  onReorder,
  children,
  className,
}: {
  ids: string[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  children: ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = ids.indexOf(String(active.id));
    const toIndex = ids.indexOf(String(over.id));
    if (fromIndex === -1 || toIndex === -1) return;
    onReorder(fromIndex, toIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

/** Utility to reorder an array by moving one item from one index to another. */
export function reorderArray<T>(arr: T[], fromIndex: number, toIndex: number) {
  const next = arrayMove(arr, fromIndex, toIndex);
  arr.length = 0;
  arr.push(...next);
}

export function SortableItem({
  id,
  children,
  className,
  handleClassName,
  ar,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  handleClassName?: string;
  ar: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <button
        type="button"
        className={
          handleClassName ??
          "me-1 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        }
        aria-label={ar ? "اسحب لإعادة الترتيب" : "Drag to reorder"}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      {children}
    </div>
  );
}
