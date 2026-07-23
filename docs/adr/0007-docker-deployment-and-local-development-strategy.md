# 7. 全容器化 Docker Compose 部署與雙軌開發策略

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

評估重點包含面試官可啟動環境與成果展示（一鍵啟動），以及 Pair Programming 現場開發流暢度（HMR 熱重載與 F5 斷點除錯）。

## 決策 (Decision)

1. **全容器化架構**：
   - 為 `.NET` 後端 (`backend/Dockerfile`) 與 `Next.js` 前端 (`frontend/Dockerfile`) 撰寫多階段構建 (Multi-stage build) Dockerfile。
   - 提供完整的 `docker-compose.yml`（包含 `db` PostgreSQL、`backend` API、`frontend` Next.js 服務與 bridge network 設定）。
2. **開發與展現雙軌策略 (Dual-track Strategy)**：
   - **一鍵展示 (Demo Mode)**：執行 `docker compose up --build -d` 即可在容器化環境跑起完整全棧系統。
   - **極速開發 (Dev Mode)**：執行 `docker compose up db -d` 啟動資料庫容器，後端與前端使用 `dotnet watch` 與 `npm run dev` 進行極速熱重載開發與斷點除錯。

## 後果與權衡 (Consequences)

### 優點
- **展現與評測友善**：面試官可一鍵評測系統。
- **開發效率極高**：避免容器內 HMR 事件延遲與偵錯代理連線問題。
