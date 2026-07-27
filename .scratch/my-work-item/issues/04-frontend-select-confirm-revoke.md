# 04 — 前台勾選 + 批量確認 + 撤銷

**What to build:** 前台使用者在 `/work-items` 列表對項目做屬於自己的批量確認與撤銷。每列有 checkbox、表頭「全選」只作用於當前頁；至少勾一項「確認」鈕才可按。按確認後把勾選項目（僅自己）標為 Confirmed、清空勾選、更新列狀態並提示成功；失敗顯示錯誤且保留原狀態。Confirmed 列顯示「撤銷確認」鈕，點擊經二次確認對話框才回 Pending。重整瀏覽器後我的狀態仍在。

**Blocked by:** 03（列表頁）

**Status:** done

- [x] 每列 checkbox；勾選後該列有「已選中」視覺回饋
- [x] 表頭「全選」只選取／取消**當前頁**項目；不實作跨頁全選
- [x] 無勾選時「確認」鈕 disabled
- [x] 確認送出當前頁被勾選的明確 ID 清單到 `bulk-confirm`；成功後清空勾選、列狀態更新為 Confirmed、顯示「已成功確認 X 項目」
- [x] `bulk-confirm` 回含已移除項目的優雅訊息時如實呈現；失敗顯示錯誤並保留原狀態
- [x] 僅 Confirmed 列顯示「撤銷確認」鈕；點擊跳二次確認對話框（確定／取消），取消不變更
- [x] 確定撤銷後該列回 Pending、隱藏撤銷鈕、顯示提示訊息
- [x] 重整後（重新查詢）我的 Confirmed 狀態仍在、checkbox 為未勾選
- [x] 個人化隔離：我的操作不影響其他使用者（由後端保證，前端不誤送）
- [x] 前端測試：全選限當前頁、確認鈕 disabled 條件、確認/撤銷成功與失敗訊息、二次確認對話框取消路徑

## Comments

### 2026-07-27 — 實作收尾

主體（checkbox、全選、批量確認、撤銷二次確認、成功／失敗回饋）在 03 的分支已一併落地。本輪補上剩餘缺口：

- `WorkItemsList.tsx`：勾選列加 `aria-selected` 與淡藍底，補上「已選中」視覺回饋（spec 使用者故事 11）。
- `WorkItemsList.tsx`：撤銷鈕文字與 aria-label 由「撤銷」對齊 spec 用語「撤銷確認」（故事 17）。
- `WorkItemsList.test.tsx`：新增三個測試 — 勾選列視覺回饋、全選限當前頁（翻頁後 `bulk-confirm` 只送當前頁明確 ID）、重整（重新掛載重新查詢）後 Confirmed 仍在且 checkbox 未勾選。

驗證：`vitest run` 15 檔 74 測試全綠、`tsc --noEmit` 無誤、`eslint` 無誤。瀏覽器實測未做 — 登入需 seed 帳號明文密碼（ADR 0010 前端預雜湊），repo 未記錄，留待 07 的 Playwright E2E。
