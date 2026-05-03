# React 约束

> React 开发规范和常见错误规避。

## Hooks 规则

### R-01: 只在顶层调用 Hooks

**原因**：Hooks 依赖调用顺序，条件调用会破坏状态机。

```jsx
// 错误
function MyComponent({ show }) {
    if (show) {
        const [value, setValue] = useState(0);
    }
    return <div>{value}</div>;
}

// 正确：始终在顶层调用
function MyComponent({ show }) {
    const [value, setValue] = useState(0);
    return show ? <div>{value}</div> : null;
}
```

### R-02: 只在 React 函数中调用 Hooks

```jsx
// 错误：在普通函数中调用
function handleClick() {
    const [count, setCount] = useState(0); // 错误
}

// 正确：在组件或自定义 Hook 中调用
function MyComponent() {
    const [count, setCount] = useState(0);

    const handleClick = () => {
        setCount(count + 1);
    };

    return <button onClick={handleClick}>{count}</button>;
}

// 自定义 Hook
function useCounter() {
    const [count, setCount] = useState(0);
    const increment = useCallback(() => setCount(c => c + 1), []);
    return { count, increment };
}
```

### R-03: 自定义 Hook 必须以 use 开头

```jsx
// 正确
function useUser(userId) {
    const [user, setUser] = useState(null);
    useEffect(() => {
        fetchUser(userId).then(setUser);
    }, [userId]);
    return user;
}

// 错误
function getUser(userId) { // 不符合规范
    // ...
}
```

## 状态管理

### R-04: 状态更新可能是异步的

```jsx
// 错误：依赖旧状态计算新状态
function Counter() {
    const [count, setCount] = useState(0);

    const handleClick = () => {
        setCount(count + 1); // 可能不是最新值
        setCount(count + 1); // 两次调用可能只增加 1
    };

    return <button onClick={handleClick}>{count}</button>;
}

// 正确：使用函数式更新
function Counter() {
    const [count, setCount] = useState(0);

    const handleClick = () => {
        setCount(prev => prev + 1);
        setCount(prev => prev + 1); // 正确增加 2
    };

    return <button onClick={handleClick}>{count}</button>;
}
```

### R-05: 状态应该保持最小化

```jsx
// 错误：派生状态作为 state
function MyComponent({ items, filter }) {
    const [filteredItems, setFilteredItems] = useState([]);

    useEffect(() => {
        setFilteredItems(items.filter(item => item.name.includes(filter)));
    }, [items, filter]);

    return <List items={filteredItems} />;
}

// 正确：计算得出
function MyComponent({ items, filter }) {
    const filteredItems = items.filter(item => item.name.includes(filter));
    return <List items={filteredItems} />;
}
```

### R-06: 使用 useMemo 缓存计算结果

```jsx
function MyComponent({ items, filter }) {
    const filteredItems = useMemo(() => {
        return items.filter(item => item.name.includes(filter));
    }, [items, filter]);

    return <List items={filteredItems} />;
}
```

## 闭包陷阱

### R-07: 警惕闭包中的过期引用

```jsx
// 错误：闭包捕获过期的 state
function MyComponent() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            console.log(count); // 永远是 0
        }, 1000);
        return () => clearInterval(id);
    }, []); // 空依赖，但 count 变化时不会重新执行

    return <div>{count}</div>;
}

// 正确：使用函数式更新或添加依赖
useEffect(() => {
    const id = setInterval(() => {
        setCount(prev => prev + 1); // 使用函数式更新
    }, 1000);
    return () => clearInterval(id);
}, []);

// 或
useEffect(() => {
    const id = setInterval(() => {
        console.log(count); // 现在能访问最新值
    }, 1000);
    return () => clearInterval(id);
}, [count]); // 添加依赖
```

### R-08: useCallback 包装回调函数

```jsx
// 错误：每次渲染创建新函数引用
function MyComponent({ onClick }) {
    return <button onClick={() => onClick(1)}>Click</button>;
}

// 正确：稳定函数引用
function MyComponent({ onClick }) {
    const handleClick = useCallback(() => {
        onClick(1);
    }, [onClick]);

    return <button onClick={handleClick}>Click</button>;
}
```

## 渲染性能

### R-09: 列表必须提供 key

```jsx
// 错误
{items.map(item => <Item key={item.id} {...item} />)}

// 正确
{items.map(item => (
    <Item key={item.id} {...item} />
))}

// 警告：不要使用索引作为 key
{items.map((item, index) => (
    <Item key={index} {...item} /> // 错误，删除/重排会出问题
))}
```

### R-10: 组件应该 memo 化

```jsx
// 正确：React.memo 包装纯展示组件
const PureChild = React.memo(function ChildComponent({ data }) {
    return <div>{data.name}</div>;
});

// 正确：useMemo 缓存计算结果
function ParentComponent({ a, b }) {
    const expensiveResult = useMemo(() => {
        return computeExpensiveValue(a, b);
    }, [a, b]);

    return <Child result={expensiveResult} />;
}
```

### R-11: 避免不必要的重渲染

```jsx
// 错误：props 每次都是新对象
function Parent() {
    return <Child onClick={() => console.log('click')} />;
}

// 正确：稳定化 props
function Parent() {
    const handleClick = useCallback(() => console.log('click'), []);
    return <Child onClick={handleClick} />;
}
```

## 副作用

### R-12: useEffect 必须有正确的依赖

```jsx
// 错误：遗漏依赖
useEffect(() => {
    fetchData(id); // 使用了 id 但未声明
}, []); // 依赖数组为空

// 正确
useEffect(() => {
    fetchData(id);
}, [id]);

// 正确：使用 setState 函数消除依赖
useEffect(() => {
    setState(prev => ({ ...prev, loading: true }));
    fetchData().then(data => {
        setState(prev => ({ ...prev, loading: false, data }));
    });
}, []); // setState 使用函数式更新，不需要依赖
```

### R-13: 清理副作用

```jsx
// 错误：未清理订阅
useEffect(() => {
    const subscription = eventSource.subscribe(data => setData(data));
    // 组件卸载时 subscription 不会被清理
}, []);

// 正确
useEffect(() => {
    const subscription = eventSource.subscribe(data => setData(data));
    return () => {
        subscription.unsubscribe(); // 清理
    };
}, []);
```

## TypeScript

### R-14: 使用 FC 或函数签名定义组件类型

```tsx
// 正确
interface Props {
    name: string;
    age?: number;
}

const UserCard: React.FC<Props> = ({ name, age = 18 }) => {
    return (
        <div>
            <h1>{name}</h1>
            <p>{age}</p>
        </div>
    );
};

// 或
function UserCard({ name, age = 18 }: Props) {
    return (
        <div>
            <h1>{name}</h1>
            <p>{age}</p>
        </div>
    );
}
```

### R-15: Props 必须定义类型

```tsx
// 错误
function Component({ data }) {
    return <div>{data.name}</div>;
}

// 正确
interface Props {
    data: {
        name: string;
        id: number;
    };
    onClick: () => void;
}

function Component({ data, onClick }: Props) {
    return <div onClick={onClick}>{data.name}</div>;
}
```

## Context

### R-16: Context 应该保持最小化

```tsx
// 错误：大而全的 Context
const AppContext = createContext({
    user: null,
    theme: 'light',
    settings: {},
    // ...
});

// 正确：分离 Context
const UserContext = createContext<User | null>(null);
const ThemeContext = createContext<Theme>('light');
const SettingsContext = createContext<Settings>({});
```

### R-17: 使用 useContext 简化消费

```tsx
// 错误
const user = useContext(UserContext);

// 正确：创建自定义 hook
function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
}
```

## 事件处理

### R-18: 事件处理器使用箭头函数或 bind

```tsx
// 正确
<button onClick={() => handleClick(id)}>Click</button>

// 或
<button onClick={handleClick.bind(null, id)}>Click</button>
```

### R-19: 事件处理器必须类型正确

```tsx
// 正确
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
};

<input onChange={handleChange} />

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
};

<button onClick={handleClick}>Submit</button>
```
