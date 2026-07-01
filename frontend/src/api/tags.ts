import client from "./client";
import type { Tag } from "../types/tag";

export function fetchTags(): Promise<Tag[]> {
  return client.get("/api/v1/tags/").then((res) => res.data);
}

export function updateTag(id: number, data: { name?: string; color?: string }): Promise<Tag> {
  return client.put(`/api/v1/tags/${id}`, data).then((res) => res.data);
}

export function deleteTag(id: number): Promise<void> {
  return client.delete(`/api/v1/tags/${id}`).then((res) => res.data);
}
