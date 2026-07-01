/** 提示词模板 */
export interface PromptTemplate {
  id: number;
  name: string;
  description?: string | null;
  analysis_type: string;
  system_prompt: string;
  user_prompt_template?: string | null;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/** 创建提示词模板请求 */
export interface PromptTemplateCreateData {
  name: string;
  description?: string;
  analysis_type: string;
  system_prompt: string;
  user_prompt_template?: string;
  is_default?: boolean;
}

/** 更新提示词模板请求 */
export interface PromptTemplateUpdateData {
  name?: string;
  description?: string;
  analysis_type?: string;
  system_prompt?: string;
  user_prompt_template?: string;
  is_default?: boolean;
}
