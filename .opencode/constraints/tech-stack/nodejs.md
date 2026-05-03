# Node.js 约束

> Node.js 开发规范和常见错误规避。

## 异步编程

### R-01: 禁止回调地狱，使用 async/await

**原因**：回调地狱难以阅读和维护。

```javascript
// 错误：回调地狱
getUser(userId, (err, user) => {
    if (err) {
        return handleError(err);
    }
    getOrders(user.id, (err, orders) => {
        if (err) {
            return handleError(err);
        }
        getProducts(orders, (err, products) => {
            if (err) {
                return handleError(err);
            }
            render(user, orders, products);
        });
    });
});

// 正确：async/await
async function getUserData(userId) {
    const user = await getUser(userId);
    const orders = await getOrders(user.id);
    const products = await getProducts(orders);
    return { user, orders, products };
}
```

### R-02: 必须处理 Promise rejection

**原因**：未处理的 Promise rejection 会导致进程崩溃。

```javascript
// 错误
async function fetchData() {
    return fetch('/api/data'); // 未处理的 rejection
}

// 正确：总是添加 .catch 或使用 try/catch
async function fetchData() {
    try {
        const response = await fetch('/api/data');
        return response.json();
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error; // 重新抛出以便调用方处理
    }
}

// 全局处理：process.on('unhandledRejection', ...)
```

### R-03: 使用 promise 原型方法而非手写 promise

```javascript
// 错误：手写 promise
function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// 正确：使用 util.promisify
const { promisify } = require('util');
const sleep = promisify(setTimeout);
await sleep(1000);
```

## 模块

### R-04: 禁止使用 require()，使用 import

```javascript
// 错误
const fs = require('fs');
const { readFile } = require('fs/promises');

// 正确
import fs from 'fs';
import { readFile } from 'fs/promises';
```

### R-05: 禁止循环依赖

**原因**：循环依赖会导致模块加载顺序不确定。

```javascript
// a.js
import { b } from './b.js';
export const a = 'a';

// b.js
import { a } from './a.js'; // 错误：循环依赖
export const b = 'b';

// 正确：重构消除循环依赖
// 使用依赖注入、事件或重构模块结构
```

### R-06: 使用命名导出

```javascript
// 正确：命名导出
export function add(a, b) {
    return a + b;
}

export const PI = 3.14;

// 错误：默认导出（难以重构和 mocking）
export default { add, PI };
```

## 错误处理

### R-07: 错误必须包含上下文

```javascript
// 错误
throw new Error('failed');

// 正确
throw new Error(`Failed to process user ${userId}: ${originalError.message}`);
```

### R-08: 使用自定义错误类

```javascript
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}
```

### R-09: async 中间件必须传递错误

```javascript
// Express 错误处理中间件
app.get('/users/:id', async (req, res, next) => {
    try {
        const user = await getUser(req.params.id);
        res.json(user);
    } catch (error) {
        next(error); // 必须调用 next 传递错误
    }
});

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        error: err.message,
        code: err.code
    });
});
```

## 事件循环

### R-10: 禁止阻塞事件循环

**原因**：阻塞事件循环会导致所有请求卡住。

```javascript
// 错误：CPU 密集型操作阻塞事件循环
function processLargeArray(arr) {
    return arr.reduce((sum, item) => {
        // 复杂计算
        return sum + heavyComputation(item);
    }, 0);
}

// 正确：使用 Worker Threads
import { Worker } from 'worker_threads';

function processInWorker(data) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./processor.js', {
            workerData: data
        });
        worker.on('message', resolve);
        worker.on('error', reject);
    });
}
```

### R-11: 避免在事件循环中创建大对象

```javascript
// 错误：每次请求创建大 buffer
app.get('/download', (req, res) => {
    const data = new Buffer(100 * 1024 * 1024); // 100MB
    res.send(data);
});

// 正确：流式处理
import fs from 'fs';
app.get('/download', (req, res) => {
    const stream = fs.createReadStream('./large-file.dat');
    stream.pipe(res);
});
```

## 内存管理

### R-12: 及时清理事件监听器

```javascript
// 错误：内存泄漏
function createServer() {
    const server = http.createServer((req, res) => {
        eventEmitter.on('data', handleData); // 每次请求添加监听器
    });
    return server;
}

// 正确：使用 once 或显式移除
function createServer() {
    const server = http.createServer((req, res) => {
        eventEmitter.once('data', handleData); // 只监听一次
    });
    return server;
}

// 或显式移除
eventEmitter.off('data', handleData);
```

### R-13: 使用流处理大文件

```javascript
// 错误：加载整个文件到内存
const data = fs.readFileSync('large-file.json');
const parsed = JSON.parse(data);

// 正确：流式 JSON 解析
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import JSONStream from 'jsonstream';
const stream = fs.createReadStream('large-file.json');
stream.pipe(JSONStream.parse('data.*')).on('data', processItem);
```

## 安全

### R-14: 禁止使用 eval

```javascript
// 错误
const result = eval('(' + userInput + ')');
new Function('return ' + userInput)();

// 正确：使用 JSON.parse（经过验证的输入）
const parsed = JSON.parse(userInput);
```

### R-15: 禁止使用已废弃的 API

```javascript
// 错误：已废弃
new Buffer(size); // Use Buffer.alloc() instead
Buffer(size);     // Use Buffer.alloc() instead

// 正确
Buffer.alloc(size);
Buffer.allocUnsafe(size); // 更快但不初始化
```

## 依赖管理

### R-16: 必须使用 package-lock.json

**原因**：锁定依赖版本，确保构建一致性。

```bash
# 确保 lock 文件被提交
git add package-lock.json
```

### R-17: 禁止提交 node_modules

```bash
# .gitignore
node_modules/
```

### R-18: 定期更新依赖

```bash
# 检查过时的依赖
npm outdated

# 更新
npm update

# 交互式更新
npx npm-check-updates -u
```

## 日志

### R-19: 使用结构化日志

```javascript
// 错误
console.log('User logged in:', userId);

// 正确：使用日志库
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'app.log' })
    ]
});

logger.info('User logged in', { userId, ip: req.ip });
```

## 测试

### R-20: 使用 Jest 或 Vitest

```javascript
// 使用 Jest
describe('UserService', () => {
    it('should create user', async () => {
        const user = await userService.create({
            email: 'test@example.com'
        });
        expect(user).toHaveProperty('id');
        expect(user.email).toBe('test@example.com');
    });

    it('should throw on duplicate email', async () => {
        await expect(
            userService.create({ email: 'existing@example.com' })
        ).rejects.toThrow('Duplicate email');
    });
});
```

### R-21: 使用 supertest 测试 HTTP

```javascript
import request from 'supertest';

describe('GET /users/:id', () => {
    it('should return user', async () => {
        const res = await request(app)
            .get('/users/123')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toHaveProperty('name');
    });
});
```
