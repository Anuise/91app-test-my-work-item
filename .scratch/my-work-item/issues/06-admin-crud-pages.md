# 06 — 後台 admin 頁面（list / new / edit / delete）

**What to build:** 管理員透過 `/admin/work-items` 系列頁面維護 Work Item。列表頁列出項目並提供每列「編輯」「刪除」；`/admin/work-items/new` 新增（標題必填、描述選填），`/admin/work-items/{id}/edit` 預填當前內容編輯。刪除跳二次確認對話框，確定後軟刪除該列並提示成功。新增／編輯成功導回列表並提示，變更即時反映到前台使用者列表。僅 Admin 能進；一般 User 被擋。

**Blocked by:** 02（認證地基與 Admin 路由守衛）

**Status:** done

- [x] `/admin/work-items` 列表：呈現項目 + 每列「編輯」「刪除」
- [x] `/admin/work-items/new` 表單：標題必填（空白顯示欄位錯誤且禁止提交）、描述選填；成功導回列表 + 「工作項目新增成功。」，新項目依排序出現在最上方（後端 admin 列表 `createdAt` 降序）
- [x] `/admin/work-items/{id}/edit` 表單：預填當前標題／描述；同標題必填驗證；成功導回列表 + 「工作項目更新成功。」，該列顯示最新內容
- [x] 每列「刪除」跳「確定要刪除此項目嗎？」對話框；確定後該列移除 + 「刪除成功」；失敗顯示錯誤並保留該列
- [x] admin 變更即時反映到前台 `/work-items`（共用後端資料；後端 `Admin_can_create_work_item_visible_in_admin_and_user_lists`／`Admin_update_is_visible_in_admin_and_user_lists` 覆蓋）
- [x] RBAC：僅 Admin 可進 `/admin/*`；一般 User 被擋（`AuthGuard requireAdmin` + 後端 `[Authorize(Roles = "Admin")]` 403）
- [x] 前端測試：標題必填驗證、刪除二次確認、非 Admin 被擋、成功訊息

**實作位置：** `src/app/admin/layout.tsx`（守衛）、`src/app/admin/work-items/page.tsx` + `admin-work-items-list.tsx`（列表／刪除對話框）、`new/new-work-item-form.tsx`、`[id]/edit/{page,edit-work-item-form}.tsx`、BFF `src/app/api/admin/work-items/**`。
