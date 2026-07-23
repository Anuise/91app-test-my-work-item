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
