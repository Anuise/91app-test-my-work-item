# 03 — 前台列表頁 `/work-items`（讀取路徑）

**What to build:** 前台使用者登入後在 `/work-items` 看到共用的 Work Item 列表並能瀏覽。呈現編號／標題／狀態三欄；無資料時顯示「目前無待辦項目」空狀態；可切換排序（`createdAt` 與 `title` 升／降，預設建立時間新→舊）；可用關鍵字搜尋（300ms debounce）與 All／Pending／Confirmed 過濾；可翻頁（每頁 20）。此票只做讀取與瀏覽，不含勾選確認。

**Blocked by:** 01（列表契約）、02（認證地基）

**Status:** ready-for-agent

- [ ] `/work-items` 渲染表格：編號、標題、狀態三欄；狀態反映呼叫者個人化狀態
- [ ] 無項目時顯示「目前無待辦項目」提示
- [ ] 排序切換 UI：`createdAt`／`title` × 升／降，預設 `createdAt` desc
- [ ] 關鍵字搜尋（標題／描述）帶 300ms debounce；狀態過濾 All／Pending／Confirmed
- [ ] 分頁控制（每頁 20），讀取 `totalCount` 渲染頁數與翻頁
- [ ] TanStack Query key 併入 `{ search, statusFilter, sortBy, sortOrder, page }`
- [ ] 列表查詢參數（含 page）反映在 URL query，供詳情頁返回時還原
- [ ] Soft Glassmorphism 樣式 + lucide-react（ADR 0009）
- [ ] 前端測試：空狀態、排序切換、分頁翻頁、搜尋 debounce、狀態過濾
