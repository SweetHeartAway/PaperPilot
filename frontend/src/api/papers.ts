import type { AxiosProgressEvent } from "axios";
import client from "./client";
import type { Paper, PaperListParams, PaperListResponse } from "../types/paper";

export function fetchPapers(params?: PaperListParams): Promise<Paper[]> {
  return client.get("/api/v1/papers/", { params }).then((res) => res.data.items);
}

export function fetchPaperList(params: {
  skip: number;
  limit: number;
  search?: string;
}): Promise<PaperListResponse> {
  return client.get("/api/v1/papers/", { params }).then((res) => res.data);
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
  return client.post("/api/v1/papers/", data).then((res) => res.data);
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

export function uploadPaperFile(
  paperId: number,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Paper> {
  const formData = new FormData();
  formData.append("file", file);
  return client
    .post(`/api/v1/papers/${paperId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    })
    .then((res) => res.data);
}
