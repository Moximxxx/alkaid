# ArkTS 约束

> ArkTS 编码规范，避免常见的 ArkTS/ETS 使用问题。

## 类型安全

### R-01: 禁止使用 any/unknown

ArkTS 是静态类型语言，应使用具体类型：

```typescript
// 错误
let data: any = getData();
let result: unknown = fetch();

// 正确
let data: string = getData();
let result: string[] = fetch();
```

### R-02: 必须启用严格 null 检查

```typescript
// 错误
let name: string = null;  // 编译错误

// 正确
let name: string | null = null;
if (name !== null) {
    // 使用 name
}
```

## 状态管理

### R-03: 状态下推原则

状态应放在最小需要的组件中，避免全局状态：

```typescript
// 推荐：状态放在需要的组件中
@Component
struct MyComponent {
    @State count: number = 0;
}

// 不推荐：所有状态放 App 级别
```

### R-04: @State/@Prop/@Link 正确使用

| 装饰器 | 用途 | 限制 |
|--------|------|------|
| @State | 组件私有状态 | 只能本组件修改 |
| @Prop | 父到子单向传递 | 子组件只读 |
| @Link | 父子双向绑定 | 父组件管理状态 |

## 组件

### R-05: build() 必须是纯声明

build() 中禁止：
- 创建新对象
- 调用有副作用的方法
- async/await

```typescript
// 错误
build() {
    let items = new Array<Item>();  // 禁止 new
    this.fetchData();  // 禁止副作用
}

// 正确
@State items: Item[] = [];
```

### R-06: 禁止在 build() 中使用 ForEach 遍历超 20 项

大量数据应使用懒加载：
```typescript
LazyForEach(
    this.datasource,
    (item: Item) => {
        ItemComponent({ item: item })
    },
    (item: Item) => item.id.toString()
)
```

### R-07: 单文件组件行数限制 300 行

超过 300 行应拆分为子组件。

## 并发

### R-08: Worker 不操作 UI

Worker 是独立线程，不能访问 UI 组件。

**正确做法**：
- Worker 只做数据处理
- 通过 postMessage/onmessage 与主线程通信
- UI 更新必须在主线程

### R-09: 禁止在 Worker 中调用 napi_value

跨线程 napi_value 操作会导致崩溃。

### R-10: Worker 禁止调用 workerPort.close()

会导致 pthread_exit 持 thread_list_lock 死锁。

## 内存

### R-11: aboutToDiscard 清理定时器

页面退出时必须清理：
- `setTimeout` / `setInterval`
- 事件监听器
- Worker 实例

```typescript
aboutToDisappear() {
    clearTimeout(this.timerId);
    this.worker.terminate();
}
```

### R-12: 禁止在组件外存储组件引用

```typescript
// 错误
let componentRef: MyComponent;  // 全局存储组件引用

// 正确
@State componentKey: string = '';
```

## 性能

### R-13: 首帧渲染 <= 200ms

避免在首帧做重计算：
- 延迟非关键初始化
- 使用 `requestAnimationFrame`
- 减少 build() 中的计算量

### R-14: 避免在 build() 中创建新对象

```typescript
// 错误
build() {
    ForEach(this.items.map(item => new ItemVM(item)), ...)
}

// 正确：在 aboutToAppear 或 @State 初始化时创建
@State itemVMs: ItemVM[] = [];
aboutToAppear() {
    this.itemVMs = this.items.map(item => new ItemVM(item));
}
```
