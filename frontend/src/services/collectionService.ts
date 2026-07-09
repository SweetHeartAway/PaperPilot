/** 集合（阅读列表）服务层 — 数据转换与 API 调用编排 */

import {
  fetchCollections as apiFetchCollections,
  fetchCollection as apiFetchCollection,
  createCollection as apiCreateCollection,
  updateCollection as apiUpdateCollection,
  deleteCollection as apiDeleteCollection,
  addPapersToCollection as apiAddPapersToCollection,
  removePaperFromCollection as apiRemovePaperFromCollection,
  addPaperToCollection as apiAddPaperToCollection,
  removePaperFromCollectionSingle as apiRemovePaperFromCollectionSingle,
} from "../api/collections";
import type { CollectionDetail, CollectionCreate, CollectionUpdate } from "../types/collection";
import type { Paper } from "../types/paper";

/** 获取所有阅读列表 */
export function fetchCollections(): Promise<CollectionDetail[]> {
  return apiFetchCollections();
}

/** 获取单个阅读列表详情 */
export function fetchCollection(id: number): Promise<CollectionDetail> {
  return apiFetchCollection(id);
}

/** 创建阅读列表 */
export function createCollection(data: CollectionCreate): Promise<CollectionDetail> {
  return apiCreateCollection(data);
}

/** 更新阅读列表 */
export function updateCollection(id: number, data: CollectionUpdate): Promise<CollectionDetail> {
  return apiUpdateCollection(id, data);
}

/** 删除阅读列表 */
export function deleteCollection(id: number): Promise<void> {
  return apiDeleteCollection(id);
}

/** 批量添加论文到阅读列表 */
export function addPapersToCollection(collectionId: number, paperIds: number[]): Promise<void> {
  return apiAddPapersToCollection(collectionId, paperIds);
}

/** 从阅读列表移除单篇论文 */
export function removePaperFromCollection(collectionId: number, paperId: number): Promise<void> {
  return apiRemovePaperFromCollection(collectionId, paperId);
}

/** 将单篇论文加入阅读列表 */
export function addPaperToCollection(paperId: number, collectionId: number): Promise<Paper> {
  return apiAddPaperToCollection(paperId, collectionId);
}

/** 将单篇论文从阅读列表移除 */
export function removePaperFromCollectionSingle(
  paperId: number,
  collectionId: number,
): Promise<Paper> {
  return apiRemovePaperFromCollectionSingle(paperId, collectionId);
}
