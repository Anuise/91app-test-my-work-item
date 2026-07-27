# 領域模型與統一語言 (Domain Model & Ubiquitous Language)

## 領域詞彙表 (Glossary)

### 1. Work Item (工作項目)
管理者在系統後台建立與維護的核心待辦實體。
- **欄位**：
  - `Id`: 項目唯一識別碼 (Guid)。
  - `Title`: 項目標題（必填）。
  - `Description`: 項目詳細說明（選填）。
  - `CreatedAt`: 建立時間。
  - `UpdatedAt`: 最後更新時間。

### 2. User (使用者)
系統前台的作業人員。每位使用者登入後擁有獨立的 Work Item 狀態記錄。

### 3. User Work Item Status (個人化工作項目狀態)
特定 `User` 對於特定 `Work Item` 的個人化操作狀態。不同使用者之間的狀態互不影響。
- **狀態枚舉 (Status Enum)**：
  - `Pending` (待確認)：預設狀態。使用者尚未勾選確認該項目。
  - `Confirmed` (已確認)：使用者勾選並提交確認後的狀態。

### 4. Admin (管理者)
具備後台管理權限的角色，可執行 Work Item 的 CRUD（新增、讀取、修改、刪除）操作。

### 5. Bulk Confirmation (批量確認)
前台使用者在 Work Item 列表中勾選一至多個 `Pending` 狀態的項目，按下「確認」後，批量將這些項目對應該使用者的狀態更新為 `Confirmed`。

### 6. Revoke Confirmation (撤銷確認)
前台使用者針對自己處於 `Confirmed` 狀態的項目，點擊「撤銷確認」並在跳出的二次確認對話框同意後，將狀態恢復為 `Pending`。

### 7. Client-side Password Pre-hashing (前端密碼預雜湊)
前端嚴禁發送原始明文密碼，必須於提交前以 `SHA256(RawPassword + SystemSalt)` 運算產生雜湊值再行發送。

### 8. JWT Authentication (JWT 身份驗證Token)
後端驗證 `ClientHash` 與 BCrypt 儲存之 `DBStoredHash` 成功後核發的加密 Authorization Token，包含 `UserId` 與 `Role` (Admin / User)。

### 9. RBAC Authorization (角色授權與路由防護)
基於角色的權限存取控制 (Role-Based Access Control)。後端使用 `[Authorize(Roles = "Admin")]` 防禦後台 API；前端透過 Claims 動態控管導覽選單與 `/admin/*` 路由攔截。

### 10. Search & Status Filter (關鍵字搜尋與狀態過濾)
前台列表支援 `Title`/`Description` 關鍵字搜尋與 `All`/`Pending`/`Confirmed` 狀態篩選，具備 300ms Debounce 防抖。

### 11. Soft Delete & Idempotency (軟刪除與冪等防護)
`WorkItem` 使用 `IsDeleted` 軟刪除標記。批量確認傳送不存在或已刪除項目時自動忽略並傳回優雅提示，保持 API 操作之冪等性。

### 12. Health Check & Seed Data Reset (健康檢查與資料重置)
提供 `/healthz` 健康檢查與 `POST /api/v1/admin/reset-seed-data` 展示用測試資料一鍵重置機制。
