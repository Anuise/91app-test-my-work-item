# 2. 前端 Next.js App Router 與 TanStack Query 狀態管理選型

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

前台「My Work Item」頁面需要支援高互動性的操作，如 Work Item 列表展現、多選 (Multi-select)、批量確認 (Bulk Confirm)、撤銷 confirmation Modal 彈窗、與狀態即時更新反饋。為確保良好的使用者體驗與代碼維護性，需訂定前端架構與狀態管理策略。

## 決策 (Decision)

1. **前端框架**：基於現有 Next.js (App Router) + React 19 + TypeScript + Tailwind CSS v4。
2. **狀態管理與 API 快取**：採用 **TanStack Query (React Query)** 配合 Axios / fetch API 進行 Server State 管理。
3. **通訊與 UI 更新**：使用 TanStack Query 處理 API response 快取、Mutation 與樂觀更新 (Optimistic Updates)，搭配獨立的 UI component (Modal, Checkbox, Table) 構建互動頁面。

## 後果與權衡 (Consequences)

### 優點
- **UX 流暢度**：樂觀更新與自動 Revalidation 使狀態切換流暢。
- **程式碼簡潔**：無需自行撰寫複雜的 `useEffect` 與 `useState` 處理 loading、error 與 re-fetching 狀態。
- **模組化**：API service 與 React Component 職責明確分離。

### 缺點 / 考量
- 需要安裝 `@tanstack/react-query` 依賴。
- Server Components 與 Client Components 之間的邊界需明確劃分（例如 QueryClientProvider 放在 Client ComponentWrapper 內）。
