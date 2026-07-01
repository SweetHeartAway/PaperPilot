import type { AxiosProgressEvent } from "axios";
import client from "./client";
import type { Paper, PaperListResponse } from "../types/paper";

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

/** 为论文添加标签（标签已存在则自动关联） */
export function addPaperTag(paperId: number, name: string): Promise<Paper> {
  return client.post(`/api/v1/papers/${paperId}/tags`, { name }).then((res) => res.data);
}

/** 从论文移除标签 */
export function removePaperTag(paperId: number, tagId: number): Promise<void> {
  return client.delete(`/api/v1/papers/${paperId}/tags/${tagId}`);
}

/** 获取论文文件下载 URL */
export function getPaperDownloadUrl(paperId: number): string {
  return (client.defaults.baseURL as string) + `/api/v1/papers/${paperId}/download`;
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
