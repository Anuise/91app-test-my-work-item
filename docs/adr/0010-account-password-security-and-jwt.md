# 10. 帳號密碼安全規範、前端密碼預雜湊與 JWT 身份驗證機制

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

系統需支援使用者與管理者身份登入。基於資訊安全合規性，嚴禁在網路傳輸層、HTTP Request Payload 或日誌中出現使用者的原始明文密碼 (Plaintext Password)。

## 決策 (Decision)

1. **前端密碼傳輸安全 (Client-side Pre-hashing)**：
   - 嚴禁傳送原始明文密碼。
   - 前端發送登入請求前，必須先以 `SHA-256` 搭配系統級固定 Salt 進行摘要運算：
     `ClientHash = SHA256(RawPassword + SystemSalt)`
   - 傳輸 Payload 中僅包含計算後之 `ClientHash`。
2. **後端密碼儲存安全 (Backend Password Hashing)**：
   - 後端接收到 `ClientHash` 後，採用 **BCrypt** (或 ASP.NET Core `IPasswordHasher`) 進行二次隨機加鹽與慢速雜湊處理：
     `DBStoredHash = BCrypt.HashPassword(ClientHash)`
   - 資料庫僅儲存 `DBStoredHash`，完全隔離原始密碼。
3. **身份驗證與憑證 (JWT Authentication)**：
   - 登入成功後，後端核發 **JWT (JSON Web Token)**。
   - Payload 包含 Claims: `sub` (UserId), `name`, `role` (Admin / User), `exp` (24小時過期)。
   - 前端請求時於 Header 攜帶 `Authorization: Bearer <token>`。

## 後果與權衡 (Consequences)

### 優點
- **極高安全性**：防止網絡拆包、DevTools Payload 洩漏與後端 Log 意外印出明文密碼。
- **抗彩虹表攻擊**：雙重雜湊與加鹽機制防範資料庫外洩後的暴力破解。

### 缺點 / 考量
- 前端與後端需共享 `SystemSalt` 常數設定。

## 補註 (Addendum)

- **日期**：2026-07-27
- **來源**：設計 grill 定案。

### 補註 A：前端預雜湊的安全定位（澄清，非傳輸安全）

- 固定 `SystemSalt` 的 `ClientHash` 為**確定性、可重放**值；TLS 已負責傳輸機密性，預雜湊**不**額外提供防嗅探效果。
- 其唯一實質效益（窄）：**原始明文密碼永不離開瀏覽器**，即使後端誤記 request body 或遭入侵，外洩者為站內 hash，而非使用者跨站重用的原始密碼。
- `SystemSalt` 共享對象僅為「前端登入計算」與「後端 seed 帳號」時；一般驗證流程後端不重算 `ClientHash`，直接以 `BCrypt` 比對既存 `DBStoredHash`。
- 決策：**保留**預雜湊，但依上述定位理解，不宣稱其為傳輸/防嗅探安全。

### 補註 B：JWT 前端儲存

- Token 存於 **localStorage**，請求時以 `Authorization: Bearer <token>` 攜帶（貼合前後端分離）。
- 已知取捨：localStorage 可被 XSS 讀取；靠「無第三方 script + React 預設輸出跳脫」降風險。正式環境如需升級，改走 httpOnly cookie（連帶改為 cookie 驗證模型、跨 origin CORS credentials 與 CSRF 防護），不在本 demo 範圍。
