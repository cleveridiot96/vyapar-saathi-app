"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableDashboardTileProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
}

export function SortableDashboardTile({ id, children, isEditMode }: SortableDashboardTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {children}
      {isEditMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute inset-0 bg-black/30 rounded-xl cursor-grab active:cursor-grabbing flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="h-8 w-8 text-white/70" />
          </div>
        </>
      )}
    </div>
  );
}
