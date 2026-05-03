# TypeScript 约束

> TypeScript 开发规范和常见错误规避。

## 类型安全

### R-01: 必须启用 strict 模式

**原因**：strict 模式启用所有严格类型检查，避免常见错误。

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**验证**：
```bash
tsc --strict
```

### R-02: 禁止使用 any

**原因**：any 会绕过所有类型检查，失去 TypeScript 的意义。

```typescript
// 错误
function process(data: any): any {
    return data;
}

// 正确：使用 unknown 或具体类型
function process(data: unknown): Record<string, unknown> {
    if (typeof data === 'object' && data !== null) {
        return data as Record<string, unknown>;
    }
    throw new Error('Invalid data');
}
```

### R-03: unknown vs any

| 类型 | 特点 | 使用场景 |
|------|------|---------|
| any | 无类型检查，可赋值给任何类型 | 禁止使用 |
| unknown | 有类型检查，必须进行类型 narrowing | 处理外部数据、API 返回 |

```typescript
// 正确使用 unknown
function parseJSON(json: string): unknown {
    return JSON.parse(json);
}

// 使用时必须 type guard
const data = parseJSON(responseText);
if (typeof data === 'object' && data !== null && 'id' in data) {
    console.log(data.id);
}
```

## 接口与类型

### R-04: 优先使用接口，类型别名用于联合/交叉类型

```typescript
// 优先接口：描述对象结构
interface User {
    id: string;
    name: string;
    email: string;
}

// 类型别名：描述联合或交叉类型
type Status = 'pending' | 'approved' | 'rejected';
type Result = Success & Error;
```

### R-05: 禁止声明合并冲突

```typescript
// 错误：同名接口会合并，但属性类型冲突会报错
interface A {
    value: string;
}
interface A {
    value: number; // Error: 同一属性不同类型
}

// 正确：使用 type
type A = {
    value: string | number;
};
```

## 泛型

### R-06: 泛型约束必须明确

```typescript
// 错误：没有约束的泛型无法访问属性
function getProperty<T, K>(obj: T, key: K) {
    return obj[key]; // Error: T 上不存在 K
}

// 正确：使用泛型约束
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}
```

### R-07: 避免泛型推断回退到 any

```typescript
// 错误：无法推断时回退到 any
function first<T>(arr: T[]): any {
    return arr[0];
}

// 正确：提供明确的类型或默认值
function first<T>(arr: T[]): T | undefined {
    return arr[0];
}
```

## 函数

### R-08: 函数返回值类型必须显式声明

```typescript
// 正确
function add(a: number, b: number): number {
    return a + b;
}

// 箭头函数
const add = (a: number, b: number): number => a + b;
```

### R-09: 回调函数类型必须声明

```typescript
// 正确
function fetchData(callback: (data: Data) => void): void {
    // ...
}

// 错误
function fetchData(callback: Function): void {
    // ...
}
```

## 异步

### R-10: 必须使用 async/await，禁止裸 Promise

```typescript
// 正确
async function fetchUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
}

// 禁止
function fetchUser(id: string) {
    return fetch(`/api/users/${id}`)
        .then(response => response.json()); // 避免
}
```

### R-11: async 函数必须返回 Promise

```typescript
// 错误
async function handler(): number {
    return 42; // async 函数隐式返回 Promise
}

// 正确
async function handler(): Promise<number> {
    return 42;
}
```

## 模块

### R-12: 禁止使用 import = require()

```typescript
// 错误
const fs = require('fs');

// 正确
import fs from 'fs';
import { readFile } from 'fs/promises';
```

### R-13: 禁止 namespace，使用 ES 模块

```typescript
// 错误
namespace MyNamespace {
    export class MyClass {}
}

// 正确
export class MyClass {}
import { MyClass } from './my-class';
```

## 装饰器

### R-14: 装饰器必须启用 experimentalDecorators

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### R-15: 类装饰器不能修改类本身

```typescript
// 错误
function singleton(target: Function) {
    return target; // 装饰器不能返回新类
}

// 正确
function singleton<T extends Function>(target: T): T {
    let instance: T;
    return function(...args: any[]) {
        if (!instance) {
            instance = new target(...args);
        }
        return instance;
    } as T;
}
```

## 类型守卫

### R-16: 自定义类型守卫必须返回正确类型断言

```typescript
// 正确
interface Cat {
    meow(): void;
}

function isCat(animal: unknown): animal is Cat {
    return (
        typeof animal === 'object' &&
        animal !== null &&
        'meow' in animal &&
        typeof (animal as Cat).meow === 'function'
    );
}
```

## 最佳实践

### R-17: 使用 satisfies 验证类型

```typescript
// 验证对象字面量符合类型，但不改变推断类型
const config = {
    port: 3000,
    host: 'localhost'
} satisfies Config;
```

### R-18: 使用 readonly 和 const 断言

```typescript
// 数组只读
const arr: readonly number[] = [1, 2, 3];

// 对象字面量只读
const obj = {
    name: 'test'
} as const;
```
