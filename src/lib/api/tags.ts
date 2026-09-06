import { apiFetch, ensureOk } from '@/lib/api-fetch';
import type { NameRequest, TagResponse } from '@/types/api';

export async function fetchTags(): Promise<TagResponse[]> {
  const response = await apiFetch('/api/tags');

  await ensureOk(response, 'No se pudieron cargar los tags.');

  return response.json() as Promise<TagResponse[]>;
}

export async function createTag(payload: NameRequest): Promise<TagResponse> {
  const response = await apiFetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await ensureOk(response, 'No se pudo crear el tag.');

  return response.json() as Promise<TagResponse>;
}

export async function deleteTag(id: number): Promise<void> {
  const response = await apiFetch(`/api/tags/${id}`, { method: 'DELETE' });

  await ensureOk(response, 'No se pudo eliminar el tag.');
}
