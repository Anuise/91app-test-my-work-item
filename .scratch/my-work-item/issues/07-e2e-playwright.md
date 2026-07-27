# 07 — E2E Playwright 關鍵流程

**What to build:** 跨前後端的端到端測試，實際用瀏覽器走完 demo 主線，證明整條流程可用。涵蓋前台個人化確認/撤銷/持久化/詳情返回，與後台 CRUD 反映前台，以及跨使用者狀態隔離。

**Blocked by:** 04（確認/撤銷）、05（詳情）、06（admin CRUD）

**Status:** ready-for-agent

- [ ] 新增 Playwright 設定與可跑的 E2E 專案（沿用 seed 帳號 `user` / `user2` / `admin`）
- [ ] 前台主線：登入 → `/work-items` → 勾選並確認 → 重整後仍為已確認 → 撤銷回待確認 → 進詳情頁 → 返回列表保留排序/分頁
- [ ] 後台主線：admin 新增 → 前台可見 → 編輯 → 前台反映 → 刪除 → 前台消失
- [ ] 跨使用者隔離：`user` 確認某項目後，`user2` 登入該項目仍為待確認
- [ ] E2E 只覆蓋關鍵流程，不與 Seam 1/2 重複細節斷言
