import client from "./client";
import type { CollectionDetail, CollectionCreate, CollectionUpdate } from "../types/collection";
import type { Paper } from "../types/paper";

export function fetchCollections(): Promise<CollectionDetail[]> {
  return client.get("/api/v1/collections/").then((r) => r.data);
}

export function fetchCollection(id: number): Promise<CollectionDetail> {
  return client.get(`/api/v1/collections/${id}`).then((r) => r.data);
}

export function createCollection(data: CollectionCreate): Promise<CollectionDetail> {
  return client.post("/api/v1/collections/", data).then((r) => r.data);
}

export function updateCollection(id: number, data: CollectionUpdate): Promise<CollectionDetail> {
  return client.put(`/api/v1/collections/${id}`, data).then((r) => r.data);
}

export function deleteCollection(id: number): Promise<void> {
  return client.delete(`/api/v1/collections/${id}`);
}

export function addPapersToCollection(collectionId: number, paperIds: number[]): Promise<void> {
  return client
    .post(`/api/v1/collections/${collectionId}/papers`, { paper_ids: paperIds })
    .then((r) => r.data);
}

export function removePaperFromCollection(collectionId: number, paperId: number): Promise<void> {
  return client.delete(`/api/v1/collections/${collectionId}/papers/${paperId}`);
}

/** 将单篇论文加入阅读列表 */
export function addPaperToCollection(paperId: number, collectionId: number): Promise<Paper> {
  return client.post(`/api/v1/papers/${paperId}/collections/${collectionId}`).then((r) => r.data);
}

/** 将单篇论文从阅读列表移除 */
export function removePaperFromCollectionSingle(
  paperId: number,
  collectionId: number,
): Promise<Paper> {
  return client.delete(`/api/v1/papers/${paperId}/collections/${collectionId}`).then((r) => r.data);
}
