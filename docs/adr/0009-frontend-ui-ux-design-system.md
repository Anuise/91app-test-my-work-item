# 9. 前端 UI/UX 設計系統與微光玻璃擬態風格規範

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

前台「My Work Item」需要展現極致的現代 Web 設計美學、優秀的 UX 互動體驗與規範化的 UI Token，避免粗糙與傳統預設樣式。依據 `ui-ux-pro-max` 設計庫規範，需訂定前端專案的 Design System。

## 決策 (Decision)

1. **視覺風格**：採用 **微光玻璃擬態風格 (Soft Glassmorphism SaaS)**：
   - **背景**：柔和淡藍紫漸層 `linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)`
   - **卡片與面板**：半透明玻璃質感 `rgba(255, 255, 255, 0.75)` 搭配 `backdrop-filter: blur(12px)` 與 `1px solid rgba(255, 255, 255, 0.5)` 邊框。
   - **圓角規範**：卡片與對話框 `rounded-2xl` (16px)，按鈕與輸入框 `rounded-xl` (12px)，狀態標籤 `rounded-full` Capsule。
   - **色彩 Token**：
     - 主色 (Primary): Royal Blue `#2563EB`
     - 待確認 (Pending Status): 暖黃 Capsule (Text `#D97706`, Background `rgba(254, 243, 199, 0.8)`)
     - 已確認 (Confirmed Status): 翠綠 Capsule (Text `#059669`, Background `rgba(209, 250, 229, 0.8)`)
2. **字體系統**：
   - 使用 Google Fonts **Inter** / **Roboto**。
3. **圖標規範**：
   - **嚴禁使用 Emoji 做為控制圖標**（如 🎨, 🚀, ⚙️）。
   - 統一使用向量 SVG 圖標庫（如 `@phosphor-icons/react` 或 `lucide-react`）。
4. **UX 與微互動規範**：
   - 所有點擊元件需有 `cursor-pointer`。
   - 轉場動畫統一 `150ms - 250ms ease-in-out`。
   - 保留無障礙 `focus:ring-2 focus:ring-blue-500` 鍵盤導航外框。

## 後果與權衡 (Consequences)

### 優點
- **視覺震撼度**：現代 Glassmorphism 與半透明毛玻璃效果帶來極為 Premium 的畫面體驗。
- **元件高度規範化**：狀態標籤與圖標規範確保跨頁面一致性。
