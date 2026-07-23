# 8. 結構化日誌架構與 Trace ID 請求追蹤設計

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

為利於問題診斷、排查除錯與展現系統的可觀察性 (Observability)，需建立後端結構化日誌 (Structured Logging) 機制，並能在前端與後端之間全歷程追蹤請求。

## 決策 (Decision)

1. **後端 Logging 框架與結構化日誌**：
   - 採用 **Serilog** 整合 .NET `ILogger`，提供結構化 JSON Log（開發環境提供彩色的 Console 控制台輸出）。
   - 在關鍵業務（如批量確認、撤銷確認、CRUD）紀錄結構化欄位：`UserId`, `WorkItemId`, `Action`, `StatusCode`, `ExecutionTimeMs`。
2. **Trace ID 全歷程追蹤 (`X-Trace-ID`)**：
   - 建立 `TraceIdMiddleware`：每次 HTTP 請求從 Header 讀取或自動生成 `X-Trace-ID`（若無傳入則生成新的 Guid/ActivityTraceId）。
   - 將 `X-Trace-ID` 綁定至 Serilog `LogContext`，使該 Request 下的所有日誌皆含有 `TraceId` 欄位。
   - API 回應 Header 亦帶回 `X-Trace-ID`。
3. **12-Factor App 日誌輸出**：
   - Log 統一輸出至 `stdout` (Console)，完全相容 Docker 容器層級日誌收集 (`docker compose logs -f`)。

## 後果與權衡 (Consequences)

### 優點
- **強大診斷能力**：可透過 `X-Trace-ID` 快速鎖定特定 HTTP 請求的所有 Log 上下文。
- **雲原生友善**：遵循 12-Factor App 輸出至 `stdout`，極易與 Docker / K8s 連動。
