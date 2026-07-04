'use client';

import { Tags } from 'lucide-react';

import { SimpleReferenceManager } from '@/components/reference/simple-reference-manager';
import { useCreateTag, useTags } from '@/lib/use-expenses';

export default function TagsPage() {
  const tagsQuery = useTags();
  const createMutation = useCreateTag();

  return (
    <SimpleReferenceManager
      title="Tags"
      formHeading="Nuevo tag"
      fieldLabel="Nombre"
      placeholder="Ej. comida"
      addLabel="Agregar tag"
      emptyLabel="Aún no tenés tags."
      successMessage="Tag creado"
      errorMessage="No se pudo crear el tag."
      icon={<Tags className="size-6" />}
      items={tagsQuery.data ?? []}
      isPending={createMutation.isPending}
      onCreate={(name) => createMutation.mutateAsync({ name })}
    />
  );
}
