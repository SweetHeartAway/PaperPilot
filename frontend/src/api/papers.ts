import client from './client';
import type { Paper, PaperListParams } from '../types/paper';

export function fetchPapers(params?: PaperListParams): Promise<Paper[]> {
  return client.get('/api/v1/papers/', { params }).then((res) => res.data);
}

export function fetchPaper(id: number): Promise<Paper> {
  return client.get(`/api/v1/papers/${id}`).then((res) => res.data);
}

export function createPaper(data: {
  title: string;
  abstract?: string;
  authors?: string;
  doi?: string;
  tag_ids?: number[];
}): Promise<Paper> {
  return client.post('/api/v1/papers/', data).then((res) => res.data);
}

export function updatePaper(
  id: number,
  data: Partial<{
    title: string;
    abstract: string;
    authors: string;
    doi: string;
    tag_ids: number[];
  }>,
): Promise<Paper> {
  return client.put(`/api/v1/papers/${id}`, data).then((res) => res.data);
}

export function deletePaper(id: number): Promise<void> {
  return client.delete(`/api/v1/papers/${id}`).then((res) => res.data);
}
