# 6. API 路由與 RESTful 端點設計

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

系統包含前台使用者操作（列表、排序、個人化批量確認、撤銷確認、詳情）與後台管理者操作（新增、編輯、刪除）。需要規範 RESTful API 路由與傳遞參數結構。

## 決策 (Decision)

1. **前台端點 (`/api/v1/work-items`)**：
   - `GET /api/v1/work-items`：取得 Work Item 列表（含個人化狀態），支援 `sortBy` 與 `sortOrder`。
   - `GET /api/v1/work-items/{id}`：取得特定 Work Item 詳情。
   - `POST /api/v1/work-items/bulk-confirm`：批量將多筆 Work Item 狀態改為 `Confirmed`。
   - `POST /api/v1/work-items/{id}/revoke`：將單筆已確認的 Work Item 狀態恢復為 `Pending`。
2. **後台管理端點 (`/api/v1/admin/work-items`)**：
   - `POST /api/v1/admin/work-items`：新增 Work Item (驗證標題必填)。
   - `PUT /api/v1/admin/work-items/{id}`：編輯 Work Item (驗證標題必填)。
   - `DELETE /api/v1/admin/work-items/{id}`：刪除 Work Item。

## 後果與權衡 (Consequences)

### 優點
- **語意明確**：前台與後端管理端點獨立拆開，有利於未來角色權限 (RBAC / Policy) 擴充與維護。
- **一致性**：遵照標準 RESTful HTTP Verbs (GET, POST, PUT, DELETE)。
