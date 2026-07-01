export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  avatar_uuid: string | null;
  avatar_url: string | null;
  ai_api_key: string | null;
  ai_base_url: string | null;
  ai_model: string | null;
  default_prompt_template_id: number | null;
  created_at: string;
  updated_at: string;
}

/** 更新用户资料请求（所有字段可选） */
export interface UpdateProfileData {
  username?: string;
  email?: string;
  ai_api_key?: string;
  ai_base_url?: string;
  ai_model?: string;
  default_prompt_template_id?: number | null;
}

/** 修改密码请求 */
export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

// ─── AI 模型预置选项 ───

export interface AIProviderOption {
  label: string;
  model: string;
  baseUrl: string;
}

export const AI_PROVIDERS: AIProviderOption[] = [
  { label: "OpenAI GPT-4o mini", model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1" },
  { label: "OpenAI GPT-4o", model: "gpt-4o", baseUrl: "https://api.openai.com/v1" },
  { label: "DeepSeek Chat", model: "deepseek-chat", baseUrl: "https://api.deepseek.com" },
  { label: "DeepSeek Reasoner", model: "deepseek-reasoner", baseUrl: "https://api.deepseek.com" },
  { label: "GLM-4", model: "glm-4", baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  { label: "GLM-4-Plus", model: "glm-4-plus", baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  {
    label: "Qwen Max",
    model: "qwen-max",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  {
    label: "Qwen Plus",
    model: "qwen-plus",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  { label: "Ollama 本地", model: "llama3", baseUrl: "http://localhost:11434/v1" },
];
