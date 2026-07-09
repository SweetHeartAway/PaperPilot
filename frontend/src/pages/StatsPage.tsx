import { usePaperStats } from "../hooks/usePaperStats";
import Content from "../layout/Content";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import { getErrorMessage } from "../utils/error";

// ─── 数字卡片 ───

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: "blue" | "yellow" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50",
    yellow: "border-yellow-200 bg-yellow-50",
    green: "border-green-200 bg-green-50",
    purple: "border-purple-200 bg-purple-50",
  };
  const textColors = {
    blue: "text-blue-700",
    yellow: "text-yellow-700",
    green: "text-green-700",
    purple: "text-purple-700",
  };

  return (
    <div className={`rounded-xl border px-5 py-4 ${colorClasses[color]} flex flex-col`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`mt-1 text-2xl font-bold ${textColors[color]}`}>{value}</span>
      {sub && <span className="mt-0.5 text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

// ─── 进度条标签分布 ───

function TagBar({ name, count, max }: { name: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 truncate text-sm text-gray-700" title={name}>
        {name}
      </span>
      <div className="flex-1">
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-medium text-gray-500">{count}</span>
    </div>
  );
}

// ─── 月度柱状图 ───

function MonthBar({ month, count, max }: { month: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-gray-500">{count}</span>
      <div className="flex h-20 w-8 items-end justify-center">
        <div
          className="w-6 rounded-t-md bg-blue-500 transition-all duration-500"
          style={{ height: `${Math.max(pct, 4)}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400">{month.slice(5)}</span>
    </div>
  );
}

// ─── 主页面 ───

export default function StatsPage() {
  const { data, isLoading, isError, error, refetch } = usePaperStats();

  if (isLoading && !data) {
    return (
      <Content maxWidth="max-w-5xl">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">统计概览</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-5">
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Skeleton className="mb-4 h-5 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </Content>
    );
  }

  if (isError) {
    return (
      <Content maxWidth="max-w-5xl">
        <ErrorState
          title="加载统计失败"
          message={getErrorMessage(error, "请检查网络连接后重试")}
          onRetry={() => refetch()}
        />
      </Content>
    );
  }

  if (!data) return null;

  const maxTagCount =
    data.tag_distribution.length > 0
      ? Math.max(...data.tag_distribution.map((t) => t.paper_count))
      : 1;
  const maxMonthCount =
    data.papers_by_month.length > 0 ? Math.max(...data.papers_by_month.map((m) => m.count)) : 1;

  return (
    <Content maxWidth="max-w-5xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">统计概览</h1>

      {/* 数字卡片 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="论文总数"
          value={data.total_papers}
          sub={data.papers_with_files > 0 ? `${data.papers_with_files} 篇含文件` : undefined}
          color="blue"
        />
        <StatCard
          label="收藏论文"
          value={data.favorited_papers}
          sub={
            data.total_papers > 0
              ? `${Math.round((data.favorited_papers / data.total_papers) * 100)}%`
              : undefined
          }
          color="yellow"
        />
        <StatCard label="标签" value={data.total_tags} color="green" />
        <StatCard
          label="文件大小"
          value={
            data.average_file_size ? `${(data.average_file_size / 1024 / 1024).toFixed(1)} MB` : "-"
          }
          sub="平均每篇"
          color="purple"
        />
      </div>

      {/* AI 分析统计 */}
      {data.ai_analysis.total > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-gray-800">AI 分析</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="分析次数" value={data.ai_analysis.total} color="blue" />
            <StatCard label="已完成" value={data.ai_analysis.completed} color="green" />
            <StatCard label="失败" value={data.ai_analysis.failed} color="purple" />
            <StatCard
              label="Token 消耗"
              value={data.ai_analysis.total_tokens.toLocaleString()}
              color="yellow"
            />
          </div>
        </div>
      )}

      {/* 标签分布 */}
      {data.tag_distribution.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-gray-800">标签分布</h2>
          <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-5">
            {data.tag_distribution.map((tag) => (
              <TagBar key={tag.id} name={tag.name} count={tag.paper_count} max={maxTagCount} />
            ))}
          </div>
        </div>
      )}

      {/* 月度新增论文 */}
      {data.papers_by_month.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-gray-800">月度新增论文（近 12 个月）</h2>
          <div className="flex items-end justify-around rounded-xl border border-gray-200 bg-white px-4 py-6">
            {data.papers_by_month.map((m) => (
              <MonthBar key={m.month} month={m.month} count={m.count} max={maxMonthCount} />
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {data.total_papers === 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">
            还没有论文，上传第一篇论文后统计数据将在这里展示。
          </p>
        </div>
      )}
    </Content>
  );
}
