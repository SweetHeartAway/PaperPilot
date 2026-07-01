import { useState, useRef } from "react";
import type { PromptTemplate } from "../../types/prompt";
import type {
  AIProviderOption,
  ChangePasswordData,
  UpdateProfileData,
  User,
} from "../../types/user";
import { AI_PROVIDERS } from "../../types/user";
import Spinner from "../ui/Spinner";

// ─── Props ───

export interface ProfileFormProps {
  user: User;

  // Profile update
  onUpdateProfile: (data: UpdateProfileData) => void;
  updatePending: boolean;

  // Password change
  onChangePassword: (data: ChangePasswordData) => void;
  changePasswordPending: boolean;
  changePasswordError: string | null;
  changePasswordSuccess: boolean;

  // Avatar
  onUploadAvatar: (file: File) => void;
  uploadAvatarPending: boolean;
  onRemoveAvatar: () => void;
  removeAvatarPending: boolean;

  // Prompt templates
  promptTemplates: PromptTemplate[];
  promptsLoading: boolean;
}

// ─── Helper ───

/** 根据 model + baseUrl 匹配 AIProviderOption */
function findProvider(model: string | null, baseUrl: string | null): AIProviderOption | undefined {
  if (!model) return undefined;
  return AI_PROVIDERS.find((p) => p.model === model && p.baseUrl === (baseUrl ?? ""));
}

// ─── Inline SVG Icons ───

const CameraIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

const KeyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
    />
  </svg>
);

const SparklesIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
    />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const LockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    className="h-5 w-5 text-green-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ExclamationIcon = () => (
  <svg
    className="h-5 w-5 text-red-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  </svg>
);

const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    {visible ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
    )}
  </svg>
);

// ─── Component ───

export default function ProfileForm({
  user,
  onUpdateProfile,
  updatePending,
  onChangePassword,
  changePasswordPending,
  changePasswordError,
  changePasswordSuccess,
  onUploadAvatar,
  uploadAvatarPending,
  onRemoveAvatar,
  removeAvatarPending,
  promptTemplates,
  promptsLoading,
}: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Main form state ───
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [aiApiKey, setAiApiKey] = useState(user.ai_api_key ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>(
    () => findProvider(user.ai_model, user.ai_base_url)?.label ?? "__custom__",
  );
  const [customModel, setCustomModel] = useState(() =>
    selectedProvider === "__custom__" ? (user.ai_model ?? "") : "",
  );
  const [defaultPromptId, setDefaultPromptId] = useState<number | null>(
    user.default_prompt_template_id,
  );

  // ─── Password state ───
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ─── AI model helpers ───

  const currentProvider =
    selectedProvider !== "__custom__"
      ? AI_PROVIDERS.find((p) => p.label === selectedProvider)
      : undefined;

  // ─── Avatar handlers ───

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("仅支持 JPG、PNG、GIF、WebP 格式的头像");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("头像文件不能超过 2MB");
      return;
    }
    onUploadAvatar(file);
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    if (window.confirm("确定要删除头像吗？")) {
      onRemoveAvatar();
    }
  };

  // ─── Save profile ───

  const handleSave = () => {
    const data: UpdateProfileData = {};

    if (username !== user.username) data.username = username;
    if (email !== user.email) data.email = email;

    const providerModel =
      currentProvider?.model ?? (selectedProvider === "__custom__" ? customModel : null);
    const providerBaseUrl = currentProvider?.baseUrl ?? null;
    const currentModel = user.ai_model ?? "";
    const currentBaseUrl = user.ai_base_url ?? "";
    const keyChanged = aiApiKey !== (user.ai_api_key ?? "");
    const modelChanged = (providerModel ?? "") !== currentModel;
    const baseUrlChanged = (providerBaseUrl ?? "") !== currentBaseUrl;

    if (keyChanged) data.ai_api_key = aiApiKey || undefined;
    if (modelChanged) data.ai_model = (providerModel || undefined) as string | undefined;
    if (baseUrlChanged) data.ai_base_url = (providerBaseUrl || undefined) as string | undefined;
    if (defaultPromptId !== user.default_prompt_template_id) {
      data.default_prompt_template_id = defaultPromptId;
    }

    if (Object.keys(data).length === 0) return;
    onUpdateProfile(data);
  };

  // ─── Change password ───

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert("两次密码输入不一致");
      return;
    }
    if (newPassword.length < 8) {
      alert("新密码长度不能少于 8 位");
      return;
    }
    onChangePassword({ current_password: currentPassword, new_password: newPassword });
  };

  const handleCancelPassword = () => {
    setShowPasswordSection(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // ─── Has changes? ───
  const hasChanges =
    username !== user.username ||
    email !== user.email ||
    aiApiKey !== (user.ai_api_key ?? "") ||
    (currentProvider?.model ?? (selectedProvider === "__custom__" ? customModel : null)) !==
      (user.ai_model ?? "") ||
    (currentProvider?.baseUrl ?? null) !== (user.ai_base_url ?? "") ||
    defaultPromptId !== user.default_prompt_template_id;

  // ─── Avatar preview URL ───
  const avatarSrc = user.avatar_url
    ? user.avatar_url.startsWith("http")
      ? user.avatar_url
      : (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000") + user.avatar_url
    : null;

  // ─── Styled input class ───
  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all duration-150 placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  const selectClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all duration-150 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer";

  // ─── Render ───

  return (
    <div className="space-y-8">
      {/* ═══ Avatar Section ═══ */}
      <SectionCard>
        <SectionHeader icon={<CameraIcon />} title="头像" />

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Avatar preview */}
          <div className="group relative">
            {uploadAvatarPending || removeAvatarPending ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 ring-2 ring-gray-200">
                <Spinner size="md" variant="blue" />
              </div>
            ) : (
              <div
                onClick={handleAvatarClick}
                className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full ring-2 ring-gray-200 transition-all duration-200 hover:ring-blue-400"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="头像"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement)
                        .parentElement!.querySelector(".initials")
                        ?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-2xl font-bold text-blue-600 ${avatarSrc ? "hidden" : ""} initials`}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
                  <div className="scale-0 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                    <CameraIcon />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buttons + hint */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
              aria-label="选择头像文件"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploadAvatarPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 shadow-sm transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 active:scale-[0.97] disabled:opacity-50"
              >
                {uploadAvatarPending ? (
                  <>
                    <Spinner size="sm" variant="blue" />
                    上传中...
                  </>
                ) : (
                  <>
                    <CameraIcon />
                    上传头像
                  </>
                )}
              </button>
              {user.avatar_uuid && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={removeAvatarPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-500 shadow-sm transition-all duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-[0.97] disabled:opacity-50"
                >
                  {removeAvatarPending ? "删除中..." : "删除"}
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400">支持 JPG、PNG、GIF、WebP，最大 2MB</p>
          </div>
        </div>
      </SectionCard>

      {/* ═══ Basic Info ═══ */}
      <SectionCard>
        <SectionHeader icon={<UserIcon />} title="基本信息" />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-username" className="mb-1.5 block text-xs font-medium text-gray-600">
              用户名
            </label>
            <input
              id="pf-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="pf-email" className="mb-1.5 block text-xs font-medium text-gray-600">
              邮箱
            </label>
            <input
              id="pf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </SectionCard>

      {/* ═══ AI Preferences ═══ */}
      <SectionCard>
        <SectionHeader icon={<SparklesIcon />} title="AI 偏好设置" />

        <div className="grid gap-5 sm:grid-cols-2">
          {/* API Key */}
          <div>
            <label
              htmlFor="pf-ai-key"
              className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-600"
            >
              <KeyIcon />
              API Key
            </label>
            <div className="relative">
              <input
                id="pf-ai-key"
                type={showApiKey ? "text" : "password"}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="留空则使用系统全局配置"
                className={`${inputClass} pr-9`}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                tabIndex={-1}
                aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
              >
                <EyeIcon visible={showApiKey} />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">如不填写，使用系统全局 API Key</p>
          </div>

          {/* AI Model Provider */}
          <div>
            <label htmlFor="pf-ai-model" className="mb-1.5 block text-xs font-medium text-gray-600">
              默认 AI 模型
            </label>
            <div className="relative">
              <select
                id="pf-ai-model"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className={selectClass}
              >
                <option value="">— 使用系统默认 —</option>
                {AI_PROVIDERS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
                <option value="__custom__">自定义</option>
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
            {selectedProvider === "__custom__" && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="输入模型名称，如 gpt-4o-mini"
                className={`${inputClass} mt-2`}
              />
            )}
          </div>

          {/* Default Prompt Template */}
          <div className="sm:col-span-2">
            <label
              htmlFor="pf-default-prompt"
              className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-600"
            >
              <DocumentIcon />
              默认 Prompt 模板
            </label>
            <div className="relative">
              <select
                id="pf-default-prompt"
                value={defaultPromptId ?? ""}
                onChange={(e) => setDefaultPromptId(e.target.value ? Number(e.target.value) : null)}
                disabled={promptsLoading}
                className={selectClass}
              >
                <option value="">— 无默认模板 —</option>
                {promptTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    <span className="text-gray-400">（{t.analysis_type}）</span>
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
            {promptsLoading && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                <Spinner size="sm" variant="blue" />
                加载模板列表...
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ═══ Save Button ═══ */}
      <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {hasChanges ? "您有未保存的更改" : "当前信息已是最新"}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || updatePending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-700 hover:shadow active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {updatePending ? (
            <>
              <Spinner size="sm" variant="white" />
              保存中...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              保存更改
            </>
          )}
        </button>
      </div>

      {/* ═══ Password Section ═══ */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200">
        <button
          type="button"
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <LockIcon />
            修改密码
          </span>
          <ChevronDownIcon open={showPasswordSection} />
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showPasswordSection ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-gray-100 px-5 pb-5 pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="pf-current-pwd"
                  className="mb-1.5 block text-xs font-medium text-gray-600"
                >
                  当前密码
                </label>
                <input
                  id="pf-current-pwd"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="输入当前密码"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="pf-new-pwd"
                  className="mb-1.5 block text-xs font-medium text-gray-600"
                >
                  新密码
                </label>
                <div className="relative">
                  <input
                    id="pf-new-pwd"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 8 位"
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "隐藏密码" : "显示密码"}
                  >
                    <EyeIcon visible={showNewPassword} />
                  </button>
                </div>
                {newPassword && newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-500">
                    <ExclamationIcon />
                    密码长度至少 8 位
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="pf-confirm-pwd"
                  className="mb-1.5 block text-xs font-medium text-gray-600"
                >
                  确认新密码
                </label>
                <input
                  id="pf-confirm-pwd"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className={inputClass}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                    <ExclamationIcon />
                    两次密码不一致
                  </p>
                )}
              </div>
            </div>

            {/* Feedback */}
            {changePasswordError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                <ExclamationIcon />
                {changePasswordError}
              </div>
            )}
            {changePasswordSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-700">
                <CheckCircleIcon />
                密码修改成功
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={
                  !currentPassword || !newPassword || !confirmPassword || changePasswordPending
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {changePasswordPending ? (
                  <>
                    <Spinner size="sm" variant="white" />
                    修改中...
                  </>
                ) : (
                  "确认修改"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelPassword}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 active:scale-[0.97]"
              >
                取消
              </button>
            </div>

            {/* Registration date & status (read-only) */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">注册时间</label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-700">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                  {new Date(user.created_at).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">账户状态</label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-700">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"}`}
                  />
                  {user.is_active ? "正常" : "已禁用"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow">
      {children}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  );
}
