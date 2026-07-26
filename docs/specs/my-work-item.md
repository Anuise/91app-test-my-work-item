# My Work Item 規格

## Problem Statement

前台使用者需要在登入後查看管理者維護的 Work Item，依自己的進度勾選並確認或撤銷確認。每位使用者的狀態必須彼此隔離，且在重新整理或稍後再次登入時仍可還原。管理者則需要一個受權限保護的管理介面，維護 Work Item 的標題與描述。系統必須具備可操作的 Web UI、持久化資料、清楚的錯誤回饋，以及可在面試中展示的分層架構與測試策略。

## Solution

提供 Next.js Web UI 與 .NET 10 Web API 組成的全棧應用，使用 PostgreSQL 16 持久化 Users、WorkItems 與 UserWorkItemStatuses。登入後的 User 可瀏覽排序後的列表、查看詳情、批量確認及逐筆撤銷；Admin 可在受 RBAC 保護的管理區新增、編輯、刪除 Work Item。API 統一以 JSON envelope 回應，前端以成功 Toast、錯誤訊息與確認對話框回饋操作結果。

## User Stories

1. As a User, I want to sign in, so that the system can isolate my Work Item status from other users.
2. As a User, I want to open `/work-items`, so that I can see all active Work Items.
3. As a User, I want each row to show an identifier, title, and my current status, so that I can understand my outstanding work.
4. As a User, I want an empty-state message when no Work Items exist, so that an empty list is understandable.
5. As a User, I want the list sorted by creation time descending by default, so that the newest work is easiest to find.
6. As a User, I want to switch ascending and descending sort order, so that I can review work in the order I need.
7. As a User, I want to select one or more rows with checkboxes, so that I can prepare a batch confirmation.
8. As a User, I want a select-all checkbox for the visible rows, so that I can select or clear the current list efficiently.
9. As a User, I want the Confirm action disabled when nothing is selected, so that accidental empty submissions are prevented.
10. As a User, I want Confirm to persist only my selected items as Confirmed, so that another user's status is unaffected.
11. As a User, I want the selection cleared after a successful confirmation, so that the UI reflects a completed batch.
12. As a User, I want successful confirmation feedback including the count, so that I know what was changed.
13. As a User, I want failed confirmation to show an error and retain the previous state, so that I can retry safely.
14. As a User, I want a Revoke action only for Confirmed items, so that invalid state transitions are not offered.
15. As a User, I want a confirmation dialog before revoking, so that an accidental revoke can be cancelled.
16. As a User, I want Cancel in the revoke dialog to leave the item unchanged, so that I retain control.
17. As a User, I want a confirmed revoke to persist my item as Pending, so that I can correct my progress.
18. As a User, I want revoke success feedback, so that I know the operation completed.
19. As a User, I want my status to survive refresh, browser close, and later login, so that progress is durable.
20. As a User, I want to open `/work-items/{id}`, so that I can inspect a Work Item's full details.
21. As a User, I want details to include id, title, description, creation time, my status, and last update time, so that the item has sufficient context.
22. As a User, I want to return to the list while preserving sort and pagination context, so that navigation does not lose my place.
23. As an Admin, I want an admin-only Work Item list, so that I can maintain the source data.
24. As an Admin, I want to create a Work Item with a required title and optional description, so that new work can be published.
25. As an Admin, I want blank titles rejected inline, so that invalid records cannot be submitted.
26. As an Admin, I want successful creation to return to the list with a success message, so that I can verify the new item.
27. As an Admin, I want to edit an existing Work Item with prefilled fields, so that corrections are efficient.
28. As an Admin, I want blank titles rejected during editing, so that updates preserve data quality.
29. As an Admin, I want successful edits reflected in the list with feedback, so that I can verify the update.
30. As an Admin, I want a delete confirmation dialog, so that destructive actions require intent.
31. As an Admin, I want successful deletion to remove the row and show feedback, so that the list stays accurate.
32. As an Admin, I want failed deletion to show an error and retain the row, so that no silent data loss occurs.
33. As a User, I want admin navigation hidden when I lack the Admin role, so that unavailable actions are not confusing.
34. As a non-admin, I want direct access to admin routes denied and redirected, so that privilege escalation is prevented.
35. As a client operator, I want API errors to include a trace id, so that failures can be diagnosed across frontend and backend.

## Implementation Decisions

- Use Next.js 16, React 19, TypeScript, and Tailwind CSS for the interactive frontend; use .NET 10 Web API with a classic API/service/data-access three-tier structure.
- Use PostgreSQL 16 with EF Core Code First migrations.
- Model `UserWorkItemStatus` with composite key `(UserId, WorkItemId)`, `Pending` and `Confirmed` states, timestamps, and implicit Pending when no row exists.
- Query a user's list through a left join so status is personalized without pre-populating rows for every user.
- Expose `/api/v1/work-items` for authenticated user reads and status operations, and `/api/v1/admin/work-items` for Admin-only CRUD.
- Support `sortBy` and `sortOrder` on list reads; default to creation time descending.
- Implement bulk confirmation as an idempotent upsert and revoke as a single-item transition to Pending.
- Require `[Authorize]` for user endpoints and `[Authorize(Roles = "Admin")]` for admin endpoints; return 401 for unauthenticated requests and 403 for insufficient roles.
- Use JWT authentication, frontend route guards, and role-aware navigation as established by the authorization ADR.
- Return a consistent API envelope for success and errors, including validation details and trace id where applicable.
- Keep active Work Items visible to users; deletion behavior follows the existing soft-delete and idempotency ADR where persistence semantics are finalized.
- Test the highest practical seam: API integration tests against a disposable PostgreSQL-compatible database for authorization, CRUD, personalized status, sorting, and error contracts; supplement with focused service tests for transition rules and frontend interaction tests for disabled actions, dialogs, feedback, and route guards.

## Testing Decisions

- Tests assert observable HTTP responses, persisted state, authorization outcomes, and rendered user behavior rather than private implementation details.
- Backend integration coverage includes empty and populated lists, sort directions, cross-user isolation, bulk confirm, revoke, missing item, validation failures, 401, and 403 responses.
- Admin CRUD tests verify required-title validation, create/update/delete success, and failure preservation.
- Service-level tests cover implicit Pending, idempotent Confirmed upsert, and revoke transitions.
- Frontend tests cover selection and select-all behavior, Confirm disabled state, success/error feedback, revoke confirmation/cancel, detail navigation, context preservation, and admin route protection.
- Manual smoke path for the interview: sign in as two users, confirm the same item as one user, verify isolation as the other, then create/edit/delete as Admin and inspect the UI feedback.

## Out of Scope

- Self-service user registration, password reset, social login, and multi-factor authentication.
- Work Item assignment, due dates, priorities, comments, attachments, notifications, and audit-report screens.
- Real-time updates, offline mode, bulk admin import/export, and advanced search beyond the agreed sorting behavior.
- A separate mobile application or a Swagger-only experience.
- Changing the accepted architecture, API route vocabulary, or database engine without a new ADR.

## Further Notes

- The repository currently contains a runnable frontend/backend skeleton; implementation should preserve the existing ADR decisions and update README, architecture diagrams, API documentation, and database documentation as features land.
- AI-generated code must be reviewed against the API envelope, RBAC, personalized-status, and error-handling decisions before acceptance.
