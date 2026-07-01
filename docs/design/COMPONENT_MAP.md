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
  Component: PaperList -> PaperCard (memo) -> formatDate()
  UI: PaperCardSkeleton -> Skeleton
  UI: EmptyState, ErrorState -> WarningIcon
  UI: Pagination
  UI: XIcon (搜索清除按钮)
  Util: getErrorMessage()
```

### PaperCreatePage

```
PaperCreatePage -> useCreatePaper() -> createPaper() -> POST /api/v1/papers/
                -> uploadPaperFile() -> POST /api/v1/papers/:id/upload (multipart)
  Hook: useToast()
  Component: FileUploadArea -> UploadArrowIcon, XCircleIcon, formatFileSize()
  UI: UploadProgress
  Util: getErrorMessage()
```

### PaperDetailPage

```
PaperDetailPage -> usePaper() -> fetchPaper() -> GET /api/v1/papers/:id
                -> usePaperAISummary() -> fetchPaperAISummary() -> GET /api/v1/papers/:id/ai-summary
                -> useTriggerAIAnalysis() -> POST /api/v1/papers/:id/ai-summary
                -> useAddPaperTag() -> addPaperTag() -> POST /api/v1/papers/:id/tags
                -> useRemovePaperTag() -> removePaperTag() -> DELETE /api/v1/papers/:id/tags/:tagId
  Component: PaperInfo -> formatDate(), formatFileSize()
  Component: AISummaryPanel -> Skeleton, Spinner, TabBar
  Component: TagManager -> Spinner, XIcon
  UI: PaperDetailSkeleton -> Skeleton
  UI: EmptyState, ErrorState -> WarningIcon
  Util: getErrorMessage()
```

### TagsPage

```
TagsPage -> useAllTags() -> tagService.fetchTags() -> fetchTags() -> GET /api/v1/tags/
         -> useUpdateTag() -> tagService.updateTag() -> updateTag() -> PUT /api/v1/tags/:id
         -> useDeleteTag() -> tagService.deleteTag() -> deleteTag() -> DELETE /api/v1/tags/:id
  Hook: useToast()
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
| types/paper.ts | PaperCard, PaperInfo, PaperList, usePapers |
| types/ai.ts | AISummaryPanel, usePaperAISummary |
| types/tag.ts | TagManager, PaperCard, PaperInfo |
| types/user.ts | ProfileForm, ProfilePage |
| types/auth.ts | useAuth, api/auth |
