# PaperPilot 前端组件关系图

> 生成日期：2026-07-01

## 路由树

```
<App>
  <ErrorBoundary FallbackComponent={ErrorPage}>    <- 全局错误捕获
    <Suspense fallback={<Spinner />}>               <- 懒加载 Loading
      <Routes>
        /login             -> LoginPage        (静态导入)
        /register          -> RegisterPage     (静态导入)
        <ProtectedRoute>    <- 守卫: authStore.isAuthenticated
          <MainLayout>
            /               -> Navigate -> /papers
            /papers         -> PaperListPage           (静态导入)
            /papers/create  -> PaperCreatePage         (懒加载)
            /papers/:id     -> PaperDetailPage         (懒加载)
            /tags           -> TagsPage                (懒加载)
            /prompts        -> PromptsPage             (懒加载)
            /profile        -> ProfilePage             (懒加载)
        * -> NotFoundPage    (懒加载)
      </Routes>
    </Suspense>
  </ErrorBoundary>
  <ToastContainer />
</App>
```

## 页面 -> Hooks -> API 完整调用链

### LoginPage

```
LoginPage -> useLogin() -> loginApi() -> POST /api/v1/auth/login
                        -> authStore.setAuth() + prefetch /users/me
  Layout: AuthLayout
  UI: Spinner
  Util: getErrorMessage()
```

### RegisterPage

```
RegisterPage -> useRegister() -> registerApi() -> POST /api/v1/auth/register
  Layout: AuthLayout
  UI: Spinner
  Util: getErrorMessage()
```

### PaperListPage

```
PaperListPage -> usePaperList() -> paperService.getPaperList() -> fetchPaperList() -> GET /api/v1/papers/
             -> useDeletePaper() -> deletePaper() -> DELETE /api/v1/papers/:id
             -> useBatchAIAnalysis() -> batchTriggerAIAnalysis() -> POST /api/v1/papers/batch/ai-summary
  State: batchMode, selectedIds (Set)
  Component: PaperList -> PaperCard (memo) -> formatDate(), renderTopRight slot (删除复选框)
  UI: PaperCardSkeleton -> Skeleton
  UI: EmptyState, ErrorState -> WarningIcon
  UI: Pagination
  UI: XIcon (搜索清除按钮)
  Util: getErrorMessage()
```

### PaperCreatePage

```
PaperCreatePage -> useCreatePaper() -> createPaper() -> POST /api/v1/papers/ (含 publication_date + tag_ids)
                -> uploadPaperFile() -> POST /api/v1/papers/:id/upload (multipart)
                -> useAllTags() -> tagService.fetchTags() -> fetchTags() -> GET /api/v1/tags/
  State: publicationDate, selectedTagIds
  Hook: useToast()
  Component: FileUploadArea -> UploadArrowIcon, XCircleIcon, formatFileSize()
  UI: UploadProgress
  UI: Tag pill selector (多选按钮组)
  Util: getErrorMessage()
```

### PaperDetailPage

```
PaperDetailPage -> usePaper() -> fetchPaper() -> GET /api/v1/papers/:id
                -> usePaperAISummary() -> fetchPaperAISummary() -> GET /api/v1/papers/:id/ai-summary
                -> useTriggerAIAnalysis() -> POST /api/v1/papers/:id/ai-summary (含 forceRegenerate)
                -> useUpdatePaper() -> updatePaper() -> PUT /api/v1/papers/:id
                -> useDeletePaper() -> deletePaper() -> DELETE /api/v1/papers/:id
                -> useDeletePaperFile() -> deletePaperFile() -> DELETE /api/v1/papers/:id/file
                -> usePaperAISummaryVersions() -> GET /api/v1/papers/:id/ai-summary/versions
                -> usePaperAISummaryDiff() -> GET /api/v1/papers/:id/ai-summary/versions/diff?v1=&v2=
                -> useAddPaperTag() -> addPaperTag() -> POST /api/v1/papers/:id/tags
                -> useRemovePaperTag() -> removePaperTag() -> DELETE /api/v1/papers/:id/tags/:tagId
  State: isEditing, editForm, showHistory, selectedVersion, diffVersions
  Component: PaperInfo -> formatDate(), formatFileSize() + 编辑模式/删除按钮/文件删除
  Component: AISummaryPanel -> Skeleton, Spinner, TabBar, TabBar/TriggerButton/VersionHistory/DiffView
  Component: TagManager -> Spinner, XIcon
  UI: PaperDetailSkeleton -> Skeleton
  UI: EmptyState, ErrorState -> WarningIcon
  Util: getErrorMessage()
```

### TagsPage

```
TagsPage -> useAllTags() -> tagService.fetchTags() -> fetchTags() -> GET /api/v1/tags/
         -> useCreateTag() -> tagService.createTag() -> createTag() -> POST /api/v1/tags/
         -> useUpdateTag() -> tagService.updateTag() -> updateTag() -> PUT /api/v1/tags/:id
         -> useDeleteTag() -> tagService.deleteTag() -> deleteTag() -> DELETE /api/v1/tags/:id
  State: showCreate, newTagName
  Hook: useToast()
  UI: Skeleton, EmptyState, ErrorState -> WarningIcon
  Util: getErrorMessage()
```

### PromptsPage

```
PromptsPage -> usePromptTemplates() -> fetchPromptTemplates() -> GET /api/v1/prompts/
            -> useCreatePromptTemplate() -> createPromptTemplate() -> POST /api/v1/prompts/
            -> useUpdatePromptTemplate() -> updatePromptTemplate() -> PUT /api/v1/prompts/:id
            -> useDeletePromptTemplate() -> deletePromptTemplate() -> DELETE /api/v1/prompts/:id
            -> useSetDefaultPromptTemplate() -> setDefaultPromptTemplate() -> POST /api/v1/prompts/:id/set-default
  State: showCreate, createForm, editingId, editForm, deletingId
  Component: PromptForm (内联表单, 含 system_prompt 文本域)
  UI: Skeleton, EmptyState, ErrorState -> WarningIcon
  Util: getErrorMessage()
```

### ProfilePage

```
ProfilePage -> useCurrentUser() -> userService.fetchCurrentUser() -> getCurrentUser() -> GET /api/v1/users/me
            <- authStore: enabled: !!token
  Component: ProfileForm
  UI: ProfileSkeleton -> Skeleton
  UI: ErrorState -> WarningIcon
  Util: getErrorMessage()
```

## 全局共享组件

| 组件 | 作用 | 依赖 |
|------|------|------|
| ProtectedRoute | 路由守卫，未登录重定向到 /login | authStore |
| ToastContainer | 全局通知，浮动在页面之上 | toastStore, Spinner, XCircleIcon |
| ErrorBoundary | 捕获渲染错误，显示 ErrorPage | react-error-boundary |
| Suspense | 懒加载组件 loading 状态 | Spinner |

## 纯 UI 基件依赖图

```
无外部依赖:
  Skeleton, Spinner, Pagination, EmptyState, Icons (XIcon, XCircleIcon, WarningIcon, UploadArrowIcon), TabBar<T> (泛型)

依赖 Icons:
  ErrorState -> WarningIcon
  FileUploadArea -> UploadArrowIcon, XCircleIcon

依赖 Skeleton:
  PaperCardSkeleton, PaperDetailSkeleton, ProfileSkeleton

依赖工具函数:
  PaperCard -> formatDate()
  PaperInfo -> formatDate(), formatFileSize()
  FileUploadArea -> formatFileSize()
```

## 分层数据流

```
                    pages/ (编排层: 组合 hooks + 组件)
                       |
                    hooks/ (React Query: useQuery/useMutation)
                       |
                    services/ (数据转换: skip/limit <-> page/pageSize)
                       |
                    api/ (纯 HTTP: axios + 401 拦截器)
                       |
                    后端 API (FastAPI)
```

## 类型依赖

| 类型文件 | 被使用方 |
|---------|---------|
| types/paper.ts | PaperCard, PaperInfo, PaperList, usePapers, PaperCreatePage |
| types/ai.ts | AISummaryPanel, usePaperAISummary, api/ai |
| types/tag.ts | TagManager, PaperCard, PaperInfo, PaperCreatePage |
| types/user.ts | ProfileForm, ProfilePage |
| types/auth.ts | useAuth, api/auth |
| types/prompt.ts | PromptsPage, usePrompts, api/prompts |
