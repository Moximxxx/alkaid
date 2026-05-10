---
name: test-writing
description: 单元测试编写规范，确保测试覆盖率和方法论。
---

# Test Writing Skill

## 使用场景

当用户要求编写测试、添加测试用例、或需要验证代码正确性时使用此 Skill。

## 测试原则

### FIRST 原则

| 原则 | 说明 |
|------|------|
| **F**ast | 测试应该快速执行 |
| **I**ndependent | 测试之间不应该相互依赖 |
| **R**epeatable | 测试应该可以重复执行 |
| **S**elf-Validating | 测试应该能自动判断通过/失败 |
| **T**horough | 测试应该覆盖各种场景 |

### 测试金字塔

```
        /\
       /  \
      / E2E\     E2E: 少量，端到端
     /------\
    / integr\   Integration: 适中，模块间交互
   /--------\
  /  unit    \  Unit: 大量，单元测试
 /------------\
```

## 测试结构

### R-01: 使用 AAA 模式

```python
# Arrange: 准备测试数据
# Act: 执行被测操作
# Assert: 验证结果

def test_user_creation():
    # Arrange
    user_data = {"email": "test@example.com", "name": "Test"}

    # Act
    user = user_service.create(user_data)

    # Assert
    assert user.email == "test@example.com"
    assert user.id is not None
```

### R-02: 测试命名规范

```python
# 格式: test_{method}_{scenario}_{expected}

def test_user_create_with_valid_email_succeeds():
    ...

def test_user_create_with_duplicate_email_raises_error():
    ...

def test_user_create_with_invalid_email_raises_validation_error():
    ...
```

### R-03: 每个测试只验证一件事

```python
# 错误：一个测试多个断言
def test_user():
    user = create_user()
    assert user.name == "test"
    assert user.email == "test@example.com"  # 应该分开
    assert user.id is not None

# 正确
def test_user_creation_returns_user_with_name():
    ...

def test_user_creation_returns_user_with_email():
    ...

def test_user_creation_generates_id():
    ...
```

## 测试覆盖

### R-04: 必须覆盖的场景

| 场景 | 说明 |
|------|------|
| Happy Path | 正常流程 |
| Edge Cases | 边界条件 |
| Error Cases | 错误处理 |
| Null/Empty | 空值处理 |
| Duplicate | 重复数据 |

```python
# Happy Path
def test_calculate_total_with_valid_items():
    items = [Item(price=10), Item(price=20)]
    assert calculate_total(items) == 30

# Edge Cases
def test_calculate_total_with_single_item():
    assert calculate_total([Item(price=10)]) == 10

def test_calculate_total_with_zero_items():
    assert calculate_total([]) == 0

# Error Cases
def test_calculate_total_with_negative_price_raises_error():
    with pytest.raises(InvalidPriceError):
        calculate_total([Item(price=-10)])

# Null/Empty
def test_calculate_total_with_none_returns_zero():
    assert calculate_total(None) == 0
```

### R-05: 禁止的测试模式

```python
# 错误：测试实现细节
def test_internal_cache_is_used():
    # 不要测试私有方法
    assert cache.get("key") is not None

# 错误：时间相关测试不稳定
def test_expiry_check():
    time.sleep(10)  # 不要依赖精确时间
    assert token.is_expired()

# 错误：网络调用不稳定
def test_api_call():
    response = requests.get("http://slow-api.com")  # 不要依赖外部
```

## Mock 与 Stub

### R-06: 正确使用 Mock

```python
from unittest.mock import Mock, patch

# 正确：Mock 外部依赖
@patch('my_module.database')
def test_user_creation(mock_db):
    mock_db.insert.return_value = User(id=1)

    user = user_service.create({"email": "test@example.com"})

    assert user.id == 1
    mock_db.insert.assert_called_once()
```

### R-07: 使用 fixture 管理测试数据

```python
import pytest

@pytest.fixture
def user_data():
    return {"email": "test@example.com", "name": "Test"}

@pytest.fixture
def user_service():
    return UserService(user_repository, email_service)

def test_create_user(user_service, user_data):
    user = user_service.create(user_data)
    assert user.email == user_data["email"]
```

### R-08: 避免过度 Mock

```python
# 错误：Mock 一切
@patch('database')
@patch('cache')
@patch('logger')
@patch('metrics')
def test_something(mock_db, mock_cache, mock_logger, mock_metrics):
    ...

# 正确：只 Mock 外部依赖
@patch('external_service.ApiClient')
def test_with_real_logic(mock_api):
    # 测试真实业务逻辑
    result = process_with_api(mock_api)
```

## 集成测试

### R-09: 集成测试使用真实数据库

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_create_user_integration(db_session):
    repo = UserRepository(db_session)
    user = repo.create({"email": "test@example.com"})
    db_session.commit()

    assert user.id is not None
    assert db_session.query(User).count() == 1
```

### R-10: 使用 testcontainers 做集成测试

```python
import testcontainers.postgres

@pytest.fixture(scope="module")
def postgres():
    with testcontainers.postgres.Postgres() as pg:
        yield pg
```

## 覆盖率要求

### R-11: 覆盖率阈值

| 类型 | 最低要求 |
|------|---------|
| 整体覆盖率 | 80% |
| 新增代码 | 90% |
| 关键路径 | 100% |

### R-12: 检查覆盖率

```bash
# pytest-cov
pytest --cov=. --cov-report=html --cov-fail-under=80

# 生成报告
coverage report
coverage html
```

## 测试文档

### R-13: 测试应该自文档化

```python
def test_user_cannot_login_with_wrong_password():
    """
    验证用户使用错误密码登录失败

    Given: 已存在的用户
    When: 使用错误密码登录
    Then: 返回认证失败错误

    防止: 密码暴力破解
    """
    ...
```

## 持续集成

### R-14: CI 中必须运行测试

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    pytest --cov=. --cov-fail-under=80 --timeout=60

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## 验证命令

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest tests/unit/test_user.py

# 运行特定标记
pytest -m "not slow"

# 并行运行
pytest -n auto

# 生成 coverage 报告
pytest --cov=. --cov-report=term-missing
```
