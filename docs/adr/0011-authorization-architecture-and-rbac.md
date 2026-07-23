# 11. RBAC 角色授權架構與前後端權限防護

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

系統區分為一般使用者 (`User`) 與管理者 (`Admin`)。為確保資料安全性與操作邊界，需防止非管理者越權存取管理端點 (Vertical Privilege Escalation)，並提供良好的前端導覽體驗。

## 決策 (Decision)

1. **後端角色授權 (Role-Based Access Control - RBAC)**：
   - 使用 ASP.NET Core 原生角色授權機制。
   - 前台 API `/api/v1/work-items/*`：掛載 `[Authorize]`（包含 `User` 與 `Admin` 角色）。
   - 後台管理 API `/api/v1/admin/work-items/*`：掛載 `[Authorize(Roles = "Admin")]`。
   - 未通過驗證者傳回 HTTP 401 (`Authentication required`)，權限不足者傳回 HTTP 403 (`Permission Denied: Admin role required`)，皆以 API Envelope 封裝。
2. **前端路由與 UI 防護 (Frontend Guard & Navigation)**：
   - 頂部導覽列依據 JWT 解碼之 Claims 動態控制選單顯示，僅 `Admin` 顯示「後台管理」入口。
   - 當 `User` 直接存取 `/admin/*` 路由時，前端路由守衛自動攔截並導回 `/work-items` 並觸發權限不足 Toast 提醒。

## 後果與權衡 (Consequences)

### 優點
- **安全無死角**：後端 API 縱深防禦，防止攻擊者直接呼叫 Endpoint。
- **使用者體驗良好**：前端選單與路由防護避免一般使用者進入無權限頁面造成困惑。
