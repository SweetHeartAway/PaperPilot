import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addPapersToCollection,
  removePaperFromCollection,
  addPaperToCollection,
  removePaperFromCollectionSingle,
} from "../services/collectionService";
import { queryKeys } from "../utils/queryKeys";
import { getErrorMessage } from "../utils/error";
import { useToast } from "./useToast";
import type { CollectionCreate, CollectionUpdate } from "../types/collection";

export function useAllCollections() {
  return useQuery({
    queryKey: queryKeys.collections.all,
    queryFn: fetchCollections,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: CollectionCreate) => createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      toast.success("阅读列表已创建");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "创建阅读列表失败"));
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CollectionUpdate }) =>
      updateCollection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      toast.success("阅读列表已更新");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "更新阅读列表失败"));
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      toast.success("阅读列表已删除");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "删除阅读列表失败"));
    },
  });
}

export function useAddPapersToCollection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ collectionId, paperIds }: { collectionId: number; paperIds: number[] }) =>
      addPapersToCollection(collectionId, paperIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.details() });
      toast.success("论文已添加到阅读列表");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "添加论文到阅读列表失败"));
    },
  });
}

export function useRemovePaperFromCollection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ collectionId, paperId }: { collectionId: number; paperId: number }) =>
      removePaperFromCollection(collectionId, paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.details() });
      toast.success("论文已从阅读列表移除");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "从阅读列表移除论文失败"));
    },
  });
}

/** 将单篇论文加入阅读列表（返回更新后的 Paper） */
export function useAddPaperToCollection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ paperId, collectionId }: { paperId: number; collectionId: number }) =>
      addPaperToCollection(paperId, collectionId),
    onSuccess: (updatedPaper) => {
      queryClient.setQueryData(queryKeys.papers.detail(updatedPaper.id), updatedPaper);
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "添加到阅读列表失败"));
    },
  });
}

/** 将单篇论文从阅读列表移除（返回更新后的 Paper） */
export function useRemovePaperFromCollectionSingle() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ paperId, collectionId }: { paperId: number; collectionId: number }) =>
      removePaperFromCollectionSingle(paperId, collectionId),
    onSuccess: (updatedPaper) => {
      queryClient.setQueryData(queryKeys.papers.detail(updatedPaper.id), updatedPaper);
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "从阅读列表移除失败"));
    },
  });
}
