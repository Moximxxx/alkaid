---
name: accessibility
description: 无障碍设计规范，包括 WCAG 标准、ARIA 标签和键盘导航。
---

# Accessibility Skill

## 使用场景

当用户需要实现无障碍界面、审查 Accessibility、或需要修复屏幕阅读器问题时使用此 Skill。

## WCAG 标准

### R-01: WCAG 2.1 原则（ POUR）

| 原则 | 说明 |
|------|------|
| **P**erceivable | 可感知 - 信息和组件必须可被用户感知 |
| **O**perable | 可操作 - 用户界面组件必须可操作 |
| **U**nderstandable | 可理解 - 信息和操作必须可理解 |
| **R**obust | 健壮 - 内容必须足够健壮，可被各种用户代理可靠解释 |

### R-02: 对比度要求

| 文本类型 | 最小对比度 |
|----------|-----------|
| 正常文本 | 4.5:1 |
| 大文本（>= 18pt） | 3:1 |
| UI 组件和图形 | 3:1 |

```css
/* 正确 */
.text {
    color: #333333;  /* 背景 #ffffff，对比度 12.6:1 */
    background: #ffffff;
}

/* 错误 */
.text {
    color: #999999;  /* 背景 #ffffff，对比度 2.5:1 */
    background: #ffffff;
}
```

## 语义化 HTML

### R-03: 使用正确的语义元素

```html
<!-- 正确 -->
<header>站点头部</header>
<nav>导航</nav>
<main>主要内容</main>
<article>文章</article>
<section>章节</section>
<aside>侧边栏</aside>
<footer>页脚</footer>

<!-- 错误：全部用 div -->
<div class="header">站点头部</div>
<div class="nav">导航</div>
<div class="main">主要内容</div>
```

### R-04: 标题层级

```html
<!-- 正确：连续层级 -->
<h1>主标题</h1>
    <h2>章节标题</h2>
        <h3>小节标题</h3>

<!-- 错误：跳过层级 -->
<h1>主标题</h1>
<h3>直接到 h3</h3>
```

## ARIA 属性

### R-05: 使用 ARIA 增强语义

```html
<!-- 正确：使用 ARIA -->
<button aria-label="关闭对话框">X</button>
<span aria-hidden="true">$</span>
<span aria-label="价格">100</span>

<!-- 错误：滥用 ARIA -->
<div role="button" onclick="...">点击</div>
<!-- 应该用 <button> -->
```

### R-06: ARIA 标签规则

| 属性 | 用途 | 示例 |
|------|------|------|
| aria-label | 提供标签文字 | `aria-label="关闭"` |
| aria-labelledby | 引用另一个元素的 ID | `aria-labelledby="title"` |
| aria-describedby | 提供描述 | `aria-describedby="hint"` |
| aria-hidden | 隐藏屏幕阅读器 | `aria-hidden="true"` |

### R-07: Live Regions

```html
<!-- 动态内容更新通知 -->
<div aria-live="polite" aria-atomic="true">
    <!-- 内容更新时通知用户 -->
</div>

<!-- 重要通知 -->
<div aria-live="assertive">
    <!-- 立即通知，谨慎使用 -->
</div>
```

## 键盘导航

### R-08: 可聚焦元素

```html
<!-- 可聚焦元素 -->
<a href="#">链接</a>
<button>按钮</button>
<input type="text">
<select>下拉框</select>
<textarea>文本域</textarea>

<!-- 非语义元素需要 tabindex -->
<div role="button" tabindex="0">自定义按钮</div>
```

### R-09: 焦点样式

```css
/* 始终显示焦点指示器 */
:focus {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
}

/* 使用 :focus-visible 优化 */
:focus-visible {
    outline: 2px solid #0066cc;
}

:focus:not(:focus-visible) {
    outline: none;  /* 鼠标用户隐藏焦点样式 */
}
```

### R-10: 焦点顺序

```html
<!-- 逻辑顺序 -->
<header>
    <nav>...</nav>
</header>
<main>
    <section>
        <h2>...</h2>
        <p>...</p>
        <button>操作</button>
    </section>
</main>
<footer>...</footer>

<!-- 确保 tab 顺序与视觉顺序一致 -->
```

## 图像和媒体

### R-11: 图像 alt 文本

```html
<!-- 装饰性图像 -->
<img src="decoration.png" alt="">

<!-- 信息性图像 -->
<img src="chart.png" alt="销售增长图表显示 Q1 增长 20%">

<!-- 功能性图像（链接/按钮） -->
<a href="/home">
    <img src="logo.png" alt="返回首页">
</a>

<!-- 复杂图像 -->
<img src="complex-chart.png" alt="图表">
<details>
    <summary>图表详细说明</summary>
    <!-- 详细描述 -->
</details>
```

### R-12: 视频字幕

```html
<video controls>
    <source src="video.mp4" type="video/mp4">
    <track kind="captions" src="captions.vtt" label="中文" srclang="zh" default>
</video>
```

## 表单

### R-13: 表单标签

```html
<!-- 正确：每个输入都有标签 -->
<label for="name">姓名</label>
<input type="text" id="name" name="name">

<!-- 错误：placeholder 代替标签 -->
<input type="text" placeholder="请输入姓名">

<!-- 正确：aria-label -->
<input type="text" aria-label="搜索">

<!-- 关联标签 -->
<label for="email">
    邮箱
    <input type="email" id="email" name="email">
</label>
```

### R-14: 错误提示

```html
<label for="password">密码</label>
<input
    type="password"
    id="password"
    name="password"
    aria-describedby="password-hint password-error"
>
<span id="password-hint">至少 8 个字符</span>
<span id="password-error" style="color: red;">
    密码不能为空
</span>
```

### R-15: 必填标记

```html
<label for="email">
    邮箱地址
    <span aria-hidden="true">*</span>
</label>
<input
    type="email"
    id="email"
    required
    aria-required="true"
>
```

## 对话框

### R-16: 可访问对话框

```html
<div
    role="dialog"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-desc"
    aria-modal="true"
>
    <h2 id="dialog-title">确认删除</h2>
    <p id="dialog-desc">此操作无法撤销</p>
    <button>取消</button>
    <button>确认删除</button>
</div>
```

### R-17: 对话框焦点管理

```javascript
// 打开对话框时
// 1. 保存之前焦点
const previousFocus = document.activeElement;

// 2. 聚焦对话框第一个元素
dialog.querySelector('button').focus();

// 3. 捕获 Tab 键
dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        // 确保焦点在对话框内循环
    }
});

// 4. 关闭时恢复焦点
dialog.addEventListener('close', () => {
    previousFocus.focus();
});
```

## 颜色

### R-18: 不要仅用颜色传达信息

```html
<!-- 错误：只用颜色表示状态 -->
<span style="color: red;">错误</span>

<!-- 正确：颜色 + 图标/文字 -->
<span style="color: red;">
    <svg aria-hidden="true"><!-- X 图标 --></svg>
    错误
</span>
```

## 测试

### R-19: 自动化测试

```bash
# axe-core
npx playwright install-deps
npx playwright test --project=accessibility

# lighthouse
lighthouse https://example.com --only-categories=accessibility

# pa11y
pa11y https://example.com
```

### R-20: 手动测试清单

```markdown
- [ ] 使用 Tab 键导航
- [ ] 使用屏幕阅读器
- [ ] 检查颜色对比度
- [ ] 验证焦点样式
- [ ] 测试键盘快捷键
- [ ] 检查 ARIA 标签
```

## 检查清单

```markdown
## Accessibility Checklist

### 基础
- [ ] 语义化 HTML
- [ ] 标题层级正确
- [ ] alt 文本完整
- [ ] 对比度达标

### 键盘
- [ ] 可通过键盘访问
- [ ] 焦点样式可见
- [ ] 焦点顺序正确
- [ ] 自定义组件可键盘操作

### 屏幕阅读器
- [ ] ARIA 标签正确
- [ ] 动态内容通知
- [ ] 表单错误提示
- [ ] 对话框可访问

### 测试
- [ ] axe-core 测试通过
- [ ] Lighthouse >= 90
- [ ] 手动屏幕阅读器测试
```
