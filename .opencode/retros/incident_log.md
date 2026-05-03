# 事故日志

> Mitchell 法则的数据源。每次验证失败、运行时崩溃、调试超时都必须记录。

## 记录格式

```markdown
### INC-NNNN: [一句话摘要]

- **日期**：YYYY-MM-DD
- **类型**：构建失败 / 运行时崩溃 / 验证漏检 / 调试耗时 / 约束违反
- **现象**：[发生了什么]
- **根因**：[为什么发生]
- **修复**：[怎么修的]
- **约束引用**：[已有 P-0x 或 NEW]
- **复盘结论**：[PENDING / NO_ACTION / NEW_CONSTRAINT]
```

## 事故记录

<!-- 从这里开始记录 -->

### INC-2026-0503-002: verify_arch.sh P-01 检查误报

- **日期**：2026-05-03
- **类型**：验证漏检
- **现象**：P-01 检查报告 openai 模型数量不一致 (Welcome:5 vs constants:6)，但实际一致
- **根因**：验证脚本使用 `grep -c 'gpt-'` 全局搜索，误将 `DEFAULT_AI_CONFIG.model: 'gpt-4-vision-preview'` 计入
- **修复**：需改进脚本，只统计 MODELS 对象内的模型
- **约束引用**：UPDATE_VERIFIER
- **复盘结论**：NO_ACTION（P-01 约束本身已正确遵守，问题是验证脚本）

