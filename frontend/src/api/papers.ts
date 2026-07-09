import type { AxiosProgressEvent } from "axios";
import client from "./client";
import type {
  Paper,
  PaperListResponse,
  BatchActionResponse,
  DOILookupResponse,
  PaperStats,
} from "../types/paper";

export function fetchPaperList(params: {
  skip: number;
  limit: number;
  search?: string;
  favorite_only?: boolean;
  sort_by?: string;
  sort_order?: string;
  tag_ids?: string;
  collection_id?: number;
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
  publication_date?: string;
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
    publication_date: string;
    tag_ids: number[];
  }>,
): Promise<Paper> {
  return client.put(`/api/v1/papers/${id}`, data).then((res) => res.data);
}

export function deletePaper(id: number): Promise<void> {
  return client.delete(`/api/v1/papers/${id}`).then((res) => res.data);
}

export function deletePaperFile(paperId: number): Promise<Paper> {
  return client.delete(`/api/v1/papers/${paperId}/file`).then((res) => res.data);
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

/** 获取论文 PDF 文件二进制数据（用于内联查看） */
export function fetchPaperFileBlob(paperId: number): Promise<Blob> {
  return client
    .get(`/api/v1/papers/${paperId}/download`, { responseType: "blob" })
    .then((res) => res.data);
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

/** 切换论文收藏状态 */
export function toggleFavorite(paperId: number): Promise<Paper> {
  return client.post(`/api/v1/papers/${paperId}/favorite/toggle`).then((res) => res.data);
}

/** 获取论文引用导出 URL（BibTeX/RIS） */
export function getPaperExportUrl(paperId: number, format: "bibtex" | "ris"): string {
  return (client.defaults.baseURL as string) + `/api/v1/papers/${paperId}/export?format=${format}`;
}

/** 批量删除论文 */
export async function batchDeletePapers(paperIds: number[]): Promise<BatchActionResponse> {
  const { data } = await client.post<BatchActionResponse>("/api/v1/papers/batch/delete", {
    paper_ids: paperIds,
  });
  return data;
}

/** 批量给论文添加标签 */
export async function batchAddTag(
  paperIds: number[],
  tagName: string,
): Promise<BatchActionResponse> {
  const { data } = await client.post<BatchActionResponse>("/api/v1/papers/batch/tags", {
    paper_ids: paperIds,
    tag_name: tagName,
  });
  return data;
}

/** 通过 DOI 自动补全论文元数据 */
export async function lookupDOI(doi: string): Promise<DOILookupResponse> {
  const { data } = await client.post<DOILookupResponse>("/api/v1/papers/doi-lookup", { doi });
  return data;
}

/** 获取论文库统计概览 */
export async function fetchPaperStats(): Promise<PaperStats> {
  const { data } = await client.get<PaperStats>("/api/v1/papers/stats");
  return data;
}
