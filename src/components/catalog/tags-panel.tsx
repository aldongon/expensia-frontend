'use client';

import { Plus, X } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { NameDialog } from '@/components/catalog/name-dialog';
import { createTag, deleteTag } from '@/lib/api/tags';
import { ApiProblemError } from '@/lib/problem';
import { queryKeys } from '@/lib/query-keys';
import { currentMonth } from '@/lib/month';
import type { TagResponse } from '@/types/api';

export function TagsPanel({ tags }: { tags: TagResponse[] }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete(tag: TagResponse) {
    try {
      await deleteTag(tag.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tags() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses(currentMonth()) }),
      ]);
      toast.success('Tag eliminado');
    } catch (error) {
      toast.error(error instanceof ApiProblemError ? error.message : 'No se pudo eliminar el tag.');
    }
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-lg p-6"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <h4>Tags</h4>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag.id} className="tag tag-accent gap-1.5 pr-1">
            {tag.name}
            <button
              type="button"
              title="Eliminar"
              className="flex cursor-pointer border-0 bg-transparent p-0 px-0.5 text-inherit"
              onClick={() => handleDelete(tag)}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <p className="text-xs opacity-50">
        Borrar un tag nunca falla: se desasocia de los gastos y estos se conservan.
      </p>

      <button
        type="button"
        className="btn btn-ghost self-start"
        onClick={() => setDialogOpen(true)}
      >
        <Plus size={16} />
        Nuevo tag
      </button>

      <NameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Nuevo tag"
        label="Nombre"
        maxLength={64}
        onSubmit={async (name) => {
          await createTag({ name });
          await queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
          toast.success('Tag creado');
        }}
      />
    </section>
  );
}
