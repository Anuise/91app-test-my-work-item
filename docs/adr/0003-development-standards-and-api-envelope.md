# 3. API 回應格式 (Envelope) 與全域例外處理規範

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

為使前後端 API 通訊結構一致，方便前端進行統一的 Error Toast 提示、Loading 處理與類型推導，並防止後端未預期的 Exception 洩漏敏感資訊，需制定 API Envelope 回應結構與例外處理規範。

## 決策 (Decision)

1. **API 回應格式 (API Envelope)**：所有 API 回應一律封裝成以下結構：
   - 成功 (`success: true`, `data: T`, `message: string`)
   - 失敗 (`success: false`, `data: null`, `message: string`, `errors: string[]`)
2. **全域例外處理 (Global Exception Middleware)**：後端實作 `GlobalExceptionHandlerMiddleware`，將所有未捕獲的例外統一封裝為 HTTP Status 500 與 API Envelope 失敗格式。
3. **命名規範**：
   - C# 後端遵循 PascalCase 命名規範。
   - TypeScript 前端遵循 camelCase / PascalCase 規範。
   - API JSON 傳輸一律以 camelCase 進行序列化。

## 後果與權衡 (Consequences)

### 優點
- **前後端高對齊**：前端可撰寫統一的 Axios / Fetch Interceptor 攔截 `success === false` 並顯示視窗提醒。
- **安全性與強健性**：例外處理確保所有未預期錯誤皆有優雅降級 (Graceful Degradation)。

### 缺點 / 考量
- 所有的 API 傳回值需統一透過 `ApiResponse<T>.Ok(...)` 或 `ApiResponse<T>.Fail(...)` 工廠方法包裝。
