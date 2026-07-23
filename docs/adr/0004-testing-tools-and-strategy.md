# 4. 後端與前端測試工具與策略選型

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

本專案「My Work Item」著重於商業邏輯正確性（如：個人化狀態切換、多選批量確認、撤銷確認）與系統可驗證性。需建立完善的後端與前端測試工具鏈，支援單元測試與整合測試。

## 決策 (Decision)

1. **後端測試框架與工具組合 (.NET)**：
   - **測試框架**：xUnit
   - **Mock 工具**：NSubstitute
   - **斷言庫**：FluentAssertions
   - **資料庫測試策略**：EF Core In-Memory Database（用於快速驗證 DbContext 與 Service 整合邏輯）
2. **前端測試框架與工具組合 (Next.js)**：
   - **單元/元件測試框架**：Vitest + React Testing Library

## 後果與權衡 (Consequences)

### 優點
- **測試執行速度快**：使用 EF Core In-Memory 與 Vitest 可以在極短時間內運行全套測試。
- **可讀性與維護性高**：NSubstitute 語法簡單自然，FluentAssertions 提高測試斷言的朗朗上口度。
- **強健的質量保證**：後端 Service 邏輯與前端元件互動均有單元/整合測試覆蓋。

### 缺點 / 考量
- EF Core In-Memory 不支援 PostgreSQL 獨有的原生 SQL / 特殊 Data Type，但對於標準 LINQ 查詢與 CRUD 測試已完全足夠。
