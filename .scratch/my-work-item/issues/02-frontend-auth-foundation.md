# 02 — 前端認證地基 + API client

**What to build:** 前端的共用認證與資料存取地基。收斂 token 儲存策略為 localStorage + `Authorization: Bearer`（去除現有 BFF 走 cookie 的不一致），建立一層帶 token 的 fetch、TanStack Query provider，以及對 `/work-items` 與 `/admin/*` 的路由守衛。完成後：已登入使用者能落到受保護的頁面殼層，未登入被導回登入頁，一般 User 進 `/admin/*` 被擋。

**Blocked by:** None — can start immediately.

**Status:** done

- [x] token 儲存與攜帶全站統一為 localStorage + `Authorization: Bearer <token>`（ADR 0010 補註 B）；移除或改寫 cookie 讀取路徑使全站一致
- [x] 建立帶 token 的 authed fetch 封裝，統一解讀 API envelope 與錯誤（含 traceId）
- [x] 設定 TanStack Query provider（ADR 0002）
- [x] 路由守衛：未登入存取 `/work-items`／`/admin/*` 導回登入頁；已登入但非 Admin 存取 `/admin/*` 被擋（前端依 Claims，後端仍以 401/403 為準）
- [x] 登入成功後可導向並停留在受保護殼層
- [x] 前端測試（Testing Library + mock fetch）：未授權導回、Admin 守衛、authed fetch 帶上 Bearer
