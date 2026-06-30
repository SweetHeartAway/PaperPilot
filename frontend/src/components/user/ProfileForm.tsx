import type { User } from "../../types/user";

export interface ProfileFormProps {
  /** 当前用户数据 */
  user: User;
}

/** 个人信息表单（展示用户详情，暂为只读） */
export default function ProfileForm({ user }: ProfileFormProps) {
  return (
    <div className="space-y-6">
      {/* Username */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">用户名</label>
        <input
          type="text"
          value={user.username}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900"
        />
      </div>

      {/* Email */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">邮箱</label>
        <input
          type="email"
          value={user.email}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900"
        />
      </div>

      {/* Registration date */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">注册时间</label>
        <input
          type="text"
          value={new Date(user.created_at).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900"
        />
      </div>

      {/* Account status */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">账户状态</label>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm">
          <span
            className={`inline-block h-2 w-2 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-gray-900">{user.is_active ? "正常" : "已禁用"}</span>
        </div>
      </div>
    </div>
  );
}
