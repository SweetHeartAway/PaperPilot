import client from "./client";
import type {
  PromptTemplate,
  PromptTemplateCreateData,
  PromptTemplateUpdateData,
} from "../types/prompt";

export function fetchPromptTemplates(analysisType?: string): Promise<PromptTemplate[]> {
  const params: Record<string, string> = {};
  if (analysisType) params.analysis_type = analysisType;
  return client.get("/api/v1/prompts/", { params }).then((res) => res.data);
}

export function fetchPromptTemplate(id: number): Promise<PromptTemplate> {
  return client.get(`/api/v1/prompts/${id}`).then((res) => res.data);
}

export function createPromptTemplate(data: PromptTemplateCreateData): Promise<PromptTemplate> {
  return client.post("/api/v1/prompts/", data).then((res) => res.data);
}

export function updatePromptTemplate(
  id: number,
  data: PromptTemplateUpdateData,
): Promise<PromptTemplate> {
  return client.put(`/api/v1/prompts/${id}`, data).then((res) => res.data);
}

export function deletePromptTemplate(id: number): Promise<void> {
  return client.delete(`/api/v1/prompts/${id}`).then((res) => res.data);
}

export function setDefaultPromptTemplate(id: number): Promise<PromptTemplate> {
  return client.post(`/api/v1/prompts/${id}/set-default`).then((res) => res.data);
}
