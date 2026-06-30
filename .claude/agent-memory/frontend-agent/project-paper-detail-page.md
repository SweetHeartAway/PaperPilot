---
name: project-paper-detail-page
description: Paper Detail page implemented with PaperInfo, AISummaryPanel, TagManager
metadata:
  type: project
---

Paper Detail page (PaperDetailPage.tsx) implemented — 2026-06-30.

**Layout:** Two-column top (PaperInfo left, AISummaryPanel right, stacked on mobile), full-width TagManager below.

**Components:**
- PaperInfo: title, authors, date, DOI (clickable), abstract, download button (conditional on file_uuid)
- AISummaryPanel: handles all 6 states (loading, no analysis, pending, processing, completed, failed + query error)
- TagManager: inline add-on-enter input, remove with X button, spinner during mutation

**Key decisions:**
- `usePaperAISummary` polling via `refetchInterval` callback — must read `query.state.data` not the query object itself (TanStack v5 API)
- `ToastContainer.tsx` had a pre-existing `noUnusedParameters` error (unused `id` prop) — fixed to unblock build
- TypeScript `noUnusedParameters: true` in tsconfig.app.json — underscore prefix does NOT suppress this (unlike ESLint), unused params must be removed or used

**Pending:**
- Profile page, Tags page, Login/Register pages still use PlaceholderPage
