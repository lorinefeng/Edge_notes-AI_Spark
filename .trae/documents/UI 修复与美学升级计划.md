# UI 修复与升级计划：解决“白底白字”并提升质感

您遇到的问题核心在于：**旧页面代码仍在使用硬编码的白色背景 (`bg-white`)，却继承了新版深色模式下的浅色字体 (`text-white`)**，导致文字“隐身”。我们将彻底移除所有硬编码颜色，全面拥抱语义化主题系统。

## 1. 核心修复：表单与详情页 (`new/page.tsx` & `note/[id]/page.tsx`)
*   **移除**：所有 `bg-white`, `text-gray-900`, `border-gray-300` 等硬编码样式。
*   **替换为**：
    *   容器背景：`bg-card` (亮模式白/暗模式深蓝灰)。
    *   文字颜色：`text-foreground` (自动适配)。
    *   边框颜色：`border-border` (自动适配)。
*   **输入框专项修复**：
    *   背景：改为 `bg-background` 或 `bg-muted/50`，使其与卡片背景区分。
    *   文字：强制指定 `text-foreground`。
    *   边框：`border-input` (我们将新增此变量) 或 `border-border`。

## 2. 导航栏优化
*   **Back 按钮**：从 `text-gray-600` 改为 `text-muted-foreground hover:text-primary`。这样在深色模式下会是清晰的浅灰色，悬停变蓝。
*   **布局**：与首页保持一致，确保顶部留白和对齐。

## 3. 美学升级 (Modern Clean v2)
*   **字体优化**：虽然暂时不引入外部字体文件（避免构建复杂性），我们将通过 CSS 调整字重 (`font-semibold`) 和字间距 (`tracking-tight`) 来去除“平淡感”。
*   **视觉层次**：
    *   给表单容器添加更细腻的阴影 `shadow-lg shadow-black/5`。
    *   输入框聚焦时添加 `ring-2 ring-primary/20` 光晕效果。
    *   按钮统一使用“圆角胶囊”或“平滑圆角”风格，与首页保持一致。

## 4. CSS 变量补充
*   在 `globals.css` 中补充缺失的实用变量（如 `border-input`, `ring`），确保组件级样式统一。

执行此计划后，所有页面将完美适配深色模式，且不再出现文字不可见的问题。