---
name: responsive-design
description: 响应式设计规范，包括断点设置、布局方案和适配策略。
---

# Responsive Design Skill

## 使用场景

当用户需要实现响应式界面、审查 UI 设计、或需要处理多端适配时使用此 Skill。

## 断点设计

### R-01: 标准断点设置

```css
/* Mobile First 断点 */

/* Extra Small - 手机竖屏 */
@media (min-width: 320px) { }

/* Small - 手机横屏 */
@media (min-width: 576px) { }

/* Medium - 平板竖屏 */
@media (min-width: 768px) { }

/* Large - 平板横屏 / 小笔记本 */
@media (min-width: 992px) { }

/* Extra Large - 桌面 */
@media (min-width: 1200px) { }

/* XXL - 大屏 */
@media (min-width: 1400px) { }
```

### R-02: 断点命名规范

```css
/* 使用语义化命名 */
:root {
    --screen-xs: 320px;
    --screen-sm: 576px;
    --screen-md: 768px;
    --screen-lg: 992px;
    --screen-xl: 1200px;
    --screen-xxl: 1400px;
}
```

## 布局系统

### R-03: 使用 Grid 布局

```css
/* 推荐：Grid 布局 */
.grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
}

/* 列宽 */
.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
/* ... */
.col-12 { grid-column: span 12; }

/* 响应式 */
@media (min-width: 768px) {
    .md-col-6 { grid-column: span 6; }
}
```

### R-04: 使用 Flexbox 布局

```css
/* Flex 容器 */
.flex-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

/* 等高列 */
.flex-container {
    display: flex;
    gap: 16px;
}

.flex-item {
    flex: 1;
    min-width: 200px;
}
```

## 响应式策略

### R-05: Mobile First

```css
/* 从最小屏幕开始设计 */
.mobile-component {
    width: 100%;
    padding: 12px;
}

/* 逐步增强 */
@media (min-width: 576px) {
    .mobile-component {
        padding: 16px;
    }
}

@media (min-width: 768px) {
    .mobile-component {
        padding: 20px;
        max-width: 720px;
    }
}
```

### R-06: 容器查询（Container Queries）

```css
/* 现代浏览器支持容器查询 */
.card-container {
    container-type: inline-size;
}

.card {
    display: grid;
    gap: 16px;
}

@container (min-width: 400px) {
    .card {
        grid-template-columns: 1fr 2fr;
    }
}
```

## 图片适配

### R-07: 响应式图片

```html
<!-- 使用 srcset -->
<img
    src="image-400.jpg"
    srcset="
        image-400.jpg 400w,
        image-800.jpg 800w,
        image-1200.jpg 1200w
    "
    sizes="(max-width: 576px) 400px,
           (max-width: 992px) 800px,
           1200px"
    alt="描述"
>

<!-- 使用 picture -->
<picture>
    <source
        media="(min-width: 992px)"
        srcset="image-desktop.jpg"
    >
    <source
        media="(min-width: 576px)"
        srcset="image-tablet.jpg"
    >
    <img src="image-mobile.jpg" alt="描述">
</picture>
```

### R-08: 图片格式选择

| 格式 | 适用场景 | 压缩比 |
|------|---------|--------|
| WebP | 通用（现代浏览器） | 高 |
| AVIF | 照片（最新浏览器） | 最高 |
| SVG | 图标、矢量图 | 无损 |
| PNG | 需要透明 | 低 |

```html
<picture>
    <source type="image/avif" srcset="image.avif">
    <source type="image/webp" srcset="image.webp">
    <img src="image.jpg" alt="描述">
</picture>
```

## 字体适配

### R-09: 响应式字体

```css
/* 使用 clamp() 实现流畅缩放 */
.heading {
    font-size: clamp(1.5rem, 2vw + 1rem, 3rem);
    /* min: 1.5rem, preferred: 2vw + 1rem, max: 3rem */
}

/* 使用 rem + viewport units */
body {
    font-size: calc(14px + 0.5vw);
}
```

### R-10: 行高适配

```css
p {
    /* 大屏幕增加行高提高可读性 */
    line-height: 1.6;
}

@media (min-width: 768px) {
    p {
        line-height: 1.8;
    }
}
```

## 组件适配

### R-11: 隐藏/显示策略

```css
/* 移动端隐藏（桌面显示） */
.hide-mobile {
    display: none;
}

@media (min-width: 768px) {
    .hide-mobile {
        display: block;
    }
}

/* 桌面端隐藏（移动显示） */
.hide-desktop {
    display: block;
}

@media (min-width: 768px) {
    .hide-desktop {
        display: none;
    }
}
```

### R-12: 触摸目标尺寸

```css
/* 最小触摸目标 44x44px */
.touch-target {
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
}
```

## 导航适配

### R-13: 响应式导航

```html
<!-- 移动端：汉堡菜单 -->
<nav class="navbar">
    <div class="brand">Logo</div>
    <button class="menu-toggle" aria-label="菜单">
        <span></span>
        <span></span>
        <span></span>
    </button>
    <ul class="nav-menu">
        <li><a href="/">首页</a></li>
        <li><a href="/about">关于</a></li>
    </ul>
</nav>

<!-- 桌面端：水平菜单 -->
<!-- 通过 CSS 实现切换 -->
```

```css
@media (min-width: 768px) {
    .menu-toggle {
        display: none;
    }

    .nav-menu {
        display: flex;
        gap: 24px;
    }
}
```

## 表单适配

### R-14: 响应式表单

```css
/* 移动端全宽 */
.form-input {
    width: 100%;
    padding: 12px;
}

/* 桌面端约束宽度 */
@media (min-width: 576px) {
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .form-input {
        width: auto;
    }
}
```

## 表格适配

### R-15: 响应式表格

```html
<!-- 方案1：横向滚动 -->
<div class="table-wrapper">
    <table>...</table>
</div>

<!-- 方案2：卡片式 -->
<div class="table-cards">
    <div class="card">
        <span class="label">Name:</span>
        <span class="value">John</span>
    </div>
</div>
```

```css
/* 横向滚动 */
.table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

/* 卡片式 */
@media (max-width: 575px) {
    .table-cards {
        display: block;
    }

    .table-wrapper {
        display: none;
    }
}
```

## 工具类

### R-16: 常用响应式工具类

```css
/* 显示/隐藏 */
.visible-xs { display: none; }
.visible-sm { display: none; }
.visible-md { display: none; }
.visible-lg { display: none; }

@media (min-width: 320px) { .visible-xs { display: block; } }
@media (min-width: 576px) { .visible-sm { display: block; } }
@media (min-width: 768px) { .visible-md { display: block; } }
@media (min-width: 992px) { .visible-lg { display: block; } }

/* 文本对齐 */
.text-xs-left { text-align: left; }
.text-xs-center { text-align: center; }
.text-xs-right { text-align: right; }

@media (min-width: 576px) {
    .text-sm-left { text-align: left; }
    /* ... */
}
```

## 测试

### R-17: 响应式测试

```bash
# Chrome DevTools
# 1. Ctrl + Shift + M 切换设备模式
# 2. 测试各种设备预设
# 3. 自定义断点测试

# 命令行测试
npx playwright test --viewport-width=375 --viewport-height=667
npx playwright test --viewport-width=768 --viewport-height=1024
```

### R-18: 浏览器兼容性

```css
/* 前缀 */
.flex-container {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
}

/* 旧浏览器回退 */
.card {
    display: block;
}

@supports (display: grid) {
    .card {
        display: grid;
    }
}
```

## 检查清单

```markdown
## Responsive Design Checklist

- [ ] 断点设置合理
- [ ] Mobile First 实现
- [ ] 图片响应式
- [ ] 触摸目标 >= 44px
- [ ] 表格适配移动端
- [ ] 导航适配移动端
- [ ] 表单适配移动端
- [ ] 文本可读性良好
- [ ] 测试多种设备
```
