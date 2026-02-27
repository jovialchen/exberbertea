---
layout: post
date: 2026-02-27
title: "Deep Agents 上下文长度处理机制"
categories: Technology
tags:
  - DeepAgents
  - AIAgent
  - LLM
  - ContextWindow
authors:
  - 桃慕
---
# Deep Agents 上下文长度处理机制

## 概述

Deep Agents 通过多层策略来处理上下文长度超限问题，核心机制包括：

1. **对话摘要（Summarization）** — 当消息历史接近模型上下文窗口上限时，自动将旧消息压缩为摘要
2. **工具参数截断（Tool Argument Truncation）** — 截断历史消息中过大的工具调用参数（如 `write_file`、`edit_file`）
3. **大型工具结果驱逐（Large Tool Result Eviction）** — 将超大的工具返回结果写入文件系统，用引用替换原始内容
4. **ContextOverflowError 兜底** — 当模型 API 返回上下文溢出错误时，自动触发摘要作为降级策略

这些机制由 `SummarizationMiddleware` 和 `FilesystemMiddleware` 协同完成，在 `create_deep_agent()` 中默认启用。

---

## 1. 对话摘要（SummarizationMiddleware）

### 工作原理

`SummarizationMiddleware` 在每次模型调用前检查当前消息列表的 token 数量。当达到触发阈值时：

1. 根据 `keep` 策略确定保留多少最近的消息
2. 将被移除的旧消息持久化到后端存储（Markdown 文件）
3. 用一个较小的 LLM 调用生成旧消息的摘要
4. 用摘要消息 + 保留的最近消息替换原始消息列表

```text
[系统消息] [旧消息1..N] [新消息1..M]
                ↓ 摘要触发
[系统消息] [摘要HumanMessage] [新消息1..M]
```

### 触发阈值（trigger）

`trigger` 参数决定何时启动摘要，支持三种模式：

| 模式           | 格式              | 示例                  | 说明                                              |
| -------------- | ----------------- | --------------------- | ------------------------------------------------- |
| token 数       | `("tokens", N)`   | `("tokens", 170000)` | 消息总 token 数达到 N 时触发                      |
| 消息数         | `("messages", N)` | `("messages", 50)`   | 消息条数达到 N 时触发                             |
| 上下文窗口比例 | `("fraction", F)` | `("fraction", 0.85)` | 占模型 `max_input_tokens` 的比例达到 F 时触发     |

### 保留策略（keep）

`keep` 参数决定摘要后保留多少最近的消息：

| 模式           | 格式              | 示例                  | 说明                        |
| -------------- | ----------------- | --------------------- | --------------------------- |
| 消息数         | `("messages", N)` | `("messages", 6)`     | 保留最近 N 条消息           |
| token 数       | `("tokens", N)`   | `("tokens", 5000)`   | 保留最近 N 个 token 的消息  |
| 上下文窗口比例 | `("fraction", F)` | `("fraction", 0.10)` | 保留占窗口 F 比例的最近消息 |

### 默认值的自动计算

`create_deep_agent()` 会根据模型的 profile（是否有 `max_input_tokens`）自动选择合适的默认值：

**情况 1：模型有 `max_input_tokens` profile（Claude、GPT-4 等主流模型）**

| 参数                              | 默认值                 | 含义                              |
| --------------------------------- | ---------------------- | --------------------------------- |
| `trigger`                         | `("fraction", 0.85)`  | 上下文窗口用到 85% 时触发摘要     |
| `keep`                            | `("fraction", 0.10)`  | 摘要后保留最近 10% 的消息         |
| `truncate_args_settings.trigger`  | `("fraction", 0.85)`  | 85% 时开始截断旧工具参数          |
| `truncate_args_settings.keep`     | `("fraction", 0.10)`  | 最近 10% 的消息不截断             |

**情况 2：模型没有 profile 信息**

| 参数                              | 默认值                 | 含义                              |
| --------------------------------- | ---------------------- | --------------------------------- |
| `trigger`                         | `("tokens", 170000)`  | 170k tokens 时触发摘要            |
| `keep`                            | `("messages", 6)`     | 摘要后保留最近 6 条消息           |
| `truncate_args_settings.trigger`  | `("messages", 20)`    | 20 条消息后开始截断旧工具参数     |
| `truncate_args_settings.keep`     | `("messages", 20)`    | 最近 20 条消息不截断              |

**工具参数截断的固定默认值（两种情况通用）：**

| 参数               | 默认值                       | 含义                                  |
| ------------------ | ---------------------------- | ------------------------------------- |
| `max_length`       | `2000`                       | 工具参数字符串超过 2000 字符时截断    |
| `truncation_text`  | `"...(argument truncated)"`  | 截断后的替换文本                      |

> 注意：`create_deep_agent()` 内部将 `trim_tokens_to_summarize` 设为 `None`（不限制发送给摘要 LLM 的 token 数），而 `SummarizationMiddleware` 自身的默认值是 4000。

### 常见模型的实际默认值

由于 `fraction` 模式下的实际 token 阈值取决于模型的 `max_input_tokens`，不同模型的触发点差异很大。以下是几个常见模型的实际计算结果：

| 模型                        | 上下文窗口（标称） | 实际输入上限 | 摘要触发 (85%)          | 保留消息 (10%)      |
| --------------------------- | ------------------ | ------------ | ----------------------- | ------------------- |
| GPT-5.2 / GPT-5.2-thinking | 400K               | ~272K        | ~340,000 tokens         | ~40,000 tokens      |
| GPT-5                       | 400K               | ~272K        | ~340,000 tokens         | ~40,000 tokens      |
| Claude Sonnet 4.5           | 200K               | ~200K        | ~170,000 tokens         | ~20,000 tokens      |
| GPT-4o                      | 128K               | ~128K        | ~108,800 tokens         | ~12,800 tokens      |
| 无 profile 的模型           | —                  | —            | 170,000 tokens (固定)   | 6 条消息 (固定)     |

> ⚠️ GPT-5/5.2 系列的 400K 是输入+输出的总窗口，实际最大输入约 272K tokens（400K - 128K max output）。但 langchain profile 中 `max_input_tokens` 记录的是 400K，导致 85% 触发阈值（~340K）远超真实输入上限。详见下方"GPT-5/5.2 的 400K 窗口陷阱"。

#### GPT-5.2 使用示例

GPT-5.2 于 2025 年 12 月 11 日发布，提供三个变体（[来源](https://llm-stats.com/blog/research/gpt-5-2-launch)）：

- **Instant** — 低延迟，适合高吞吐量任务
- **Thinking** — 可调推理深度（Light/Medium/Heavy），适合大多数生产场景
- **Pro** — 最大推理精度，适合科研和复杂编码

三个变体共享 400K 上下文窗口和 128K 最大输出。在 Deep Agents 中使用：

```python
from deepagents import create_deep_agent

# 默认配置会自动适配 400K 窗口，无需手动设置 trigger/keep
agent = create_deep_agent(model="openai:gpt-5.2")

# 使用 Thinking 变体（推荐用于 agent 场景）
agent = create_deep_agent(model="openai:gpt-5.2-thinking")

# 使用 Pro 变体（复杂推理任务）
agent = create_deep_agent(model="openai:gpt-5.2-pro")
```

GPT-5.2 的定价为输入 $1.75/1M tokens、输出 $14.00/1M tokens。由于摘要会产生额外的 LLM 调用（默认使用同一模型），400K 窗口下摘要触发频率更低，间接降低了摘要成本。如果希望进一步节省摘要开销，可以自定义一个使用更便宜模型的 `SummarizationMiddleware`。

> ⚠️ GPT-5.2 的默认 fraction-based 触发阈值（340K）超过了实际输入上限（272K），可能导致上下文溢出。建议手动设置 `trigger=("tokens", 200000)`，详见下方"GPT-5/5.2 的 400K 窗口陷阱"。

### 模型名称必须精确匹配

langchain 的 profile 查找是精确匹配（exact match），不存在模糊匹配或前缀匹配。

每个 langchain provider 包（如 `langchain-openai`）内部维护一个 `_PROFILES` 字典，key 是模型的精确名称（数据来源于 [models.dev](https://models.dev)）。`model.profile` 的解析过程就是一次普通的字典查找，找不到就返回 `None`。

这意味着模型名称中的每个字符都很重要。以 GPT-5.2 为例：

```python
# 正确 — 精确匹配 _PROFILES 中的 "gpt-5.2"，获得 400K 窗口的 fraction-based 配置
agent = create_deep_agent(model="openai:gpt-5.2")

# 错误 — "gpt-5-2" 在 _PROFILES 中不存在，profile 为 None
agent = create_deep_agent(model="openai:gpt-5-2")
```

当 `model.profile` 为 `None` 时，`_compute_summarization_defaults()` 中的 `has_profile` 检查会失败：

```python
has_profile = (
    model.profile is not None          # ← None，直接 False
    and isinstance(model.profile, dict)
    and "max_input_tokens" in model.profile
    and isinstance(model.profile["max_input_tokens"], int)
)
```

结果是系统会静默回退到"无 profile 模型"的固定默认值，而不是你期望的 fraction-based 配置：

| 配置项  | 期望值（`gpt-5.2`）                | 实际值（`gpt-5-2`）            |
| ------- | ----------------------------------- | ------------------------------- |
| trigger | `("fraction", 0.85)` → ~340K tokens | `("tokens", 170000)` — 固定值 |
| keep    | `("fraction", 0.10)` → ~40K tokens  | `("messages", 6)` — 固定值    |

> 这个问题不会报错，只会静默降级。如果你发现 agent 在远未达到模型上下文窗口上限时就频繁触发摘要，首先检查模型名称是否与 OpenAI API 文档中的名称完全一致。

### GPT-5/5.2 的 400K 窗口陷阱

GPT-5/5.2 系列存在一个容易被忽略的关键问题：400K 上下文窗口是输入+输出的总量，而非纯输入上限。OpenAI 为最大输出预留了 128K tokens，因此实际最大输入约为 272K tokens（[来源：OpenAI 社区讨论](https://community.openai.com/t/huge-gpt-5-documentation-gap-flaw-input-limit-is-not-the-advertised-context-window/1344734)）。

当输入超过 ~272K tokens 时，OpenAI API 会返回硬错误：

```text
Input tokens exceed the configured limit of 272,000 tokens.
Your messages resulted in XXX tokens.
```

这与其他模型的行为不同。例如 Claude Sonnet 4.5 的 200K 窗口就是纯输入上限，GPT-4o 的 128K 也是。只有 GPT-5 系列采用了输入+输出共享窗口的设计。

#### 为什么默认配置无法保护你

即使模型名称正确匹配到 `gpt-5.2`（profile 中 `max_input_tokens: 400000`），默认的 fraction-based 配置也存在问题：

| 配置项  | 默认值                              | 实际效果                                |
| ------- | ----------------------------------- | --------------------------------------- |
| trigger | `("fraction", 0.85)` → ~340K tokens | 远超 272K 真实输入上限，摘要永远不会触发 |
| keep    | `("fraction", 0.10)` → ~40K tokens  | 正常                                    |

摘要触发阈值 340K > 实际输入上限 272K，意味着在正常情况下摘要机制根本来不及触发，系统会直接撞上 API 的硬限制。虽然 `ContextOverflowError` 兜底机制会尝试降级摘要，但此时已经发生了一次失败的 API 调用。

#### 如果模型名称还写错了

情况会更复杂。以 `"gpt-5-2"`（连字符）为例：

1. langchain profile 查找失败，`model.profile` 为 `None`
2. 摘要 trigger 回退到 `("tokens", 170000)` — 固定 170K
3. 但 `count_tokens_approximately` 使用 4 字符 ≈ 1 token 的粗略估算
4. 如果对话包含大量代码、JSON、工具调用结果（字符/token 比率可能只有 1.5~2:1），实际 token 数会远高于估算值
5. 估算值到 170K 时，实际 token 数可能已经接近或超过 272K

这就是为什么你可能在 ~270K 时遇到崩溃——近似计数器严重低估了实际 token 数，摘要虽然"触发"了，但为时已晚。

#### 推荐配置

对于 GPT-5/5.2 系列，建议手动设置一个安全的触发阈值，而不是依赖默认的 fraction-based 配置：

```python
from deepagents import create_deep_agent
from deepagents.middleware.summarization import SummarizationMiddleware
from deepagents.backends import StateBackend

# 方式 1：使用固定 token 数触发，留出安全余量
custom_summarization = SummarizationMiddleware(
    model="openai:gpt-5.2",
    backend=StateBackend,
    trigger=("tokens", 200000),   # 200K，远低于 272K 硬限制
    keep=("tokens", 30000),       # 保留 30K tokens 的最近消息
)

agent = create_deep_agent(
    model="openai:gpt-5.2",
    middleware=[custom_summarization],
)
```

选择 200K 作为触发点的理由：

- 272K 是硬限制，需要留出余量给系统消息、工具定义等
- `count_tokens_approximately` 的误差可能高达 30-50%（尤其是代码密集的对话）
- 200K 在最坏情况下（2:1 字符/token 比率）对应约 260K 实际 tokens，仍在安全范围内
- 即使估算不准，`ContextOverflowError` 兜底机制也能在 272K 处捕获并降级

### 历史消息持久化

被摘要的消息不会丢失。它们会被写入后端存储的 Markdown 文件中：

- 路径格式：`/conversation_history/{thread_id}.md`
- 每次摘要追加一个带时间戳的新段落
- 摘要消息中包含文件路径引用，agent 可以在需要时回溯查看

```text
You are in the middle of a conversation that has been summarized.

The full conversation history has been saved to /conversation_history/abc123.md
should you need to refer back to it for details.

A condensed summary follows:

<summary>
...摘要内容...
</summary>
```

### 使用示例

```python
from deepagents import create_deep_agent
from deepagents.middleware.summarization import SummarizationMiddleware
from deepagents.backends import FilesystemBackend

# 方式 1：使用 create_deep_agent 的默认配置（推荐）
agent = create_deep_agent(model="anthropic:claude-sonnet-4-5-20250929")

# 方式 2：自定义摘要参数
middleware = SummarizationMiddleware(
    model="openai:gpt-4o-mini",  # 用于生成摘要的模型（可以用便宜的模型）
    backend=FilesystemBackend(root_dir="/data"),
    trigger=("fraction", 0.75),  # 75% 时触发
    keep=("fraction", 0.15),     # 保留 15%
)

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    middleware=[middleware],
)
```

---

## 2. 工具参数截断（Truncate Args）

### 工作原理

长时间运行的 agent 会话中，历史消息里的 `write_file` 和 `edit_file` 工具调用可能包含大量文件内容作为参数。这些参数在后续对话中已经没有价值，但仍占用上下文空间。

工具参数截断机制会：

1. 在摘要检查之前，先扫描历史消息中的 `AIMessage.tool_calls`
2. 对 `write_file` 和 `edit_file` 的参数，如果字符串长度超过 `max_length`（默认 2000），则截断
3. 只截断"旧"消息（由 `keep` 策略保护的最近消息不受影响）

```python
# 截断前
{"name": "write_file", "args": {"file_path": "/app.py", "content": "...10000字符..."}}

# 截断后
{"name": "write_file", "args": {"file_path": "/app.py", "content": "...前20字符...(argument truncated)"}}
```

### 配置

通过 `truncate_args_settings` 参数配置：

```python
SummarizationMiddleware(
    model="gpt-4o-mini",
    backend=backend,
    truncate_args_settings={
        "trigger": ("messages", 50),     # 50 条消息后开始截断
        "keep": ("messages", 20),        # 最近 20 条不截断
        "max_length": 2000,              # 参数超过 2000 字符时截断
        "truncation_text": "...(argument truncated)",
    },
)
```

---

## 3. 大型工具结果驱逐（FilesystemMiddleware）

### 工作原理

当工具执行返回的结果过大时（如读取大文件、执行返回大量输出的命令），`FilesystemMiddleware` 会自动将结果写入文件系统，并用一条简短的引用消息替换原始内容。

判断标准：`len(content_str) > NUM_CHARS_PER_TOKEN * tool_token_limit_before_evict`

- `NUM_CHARS_PER_TOKEN = 4`（保守估计）
- `tool_token_limit_before_evict = 20000`（默认值）
- 即内容超过约 80,000 字符时触发驱逐

驱逐后的消息格式：

```text
Tool result too large to display inline.
The full result has been saved to /large_tool_results/{tool_call_id}.
Use read_file to view the content.
```

### 排除的工具

以下工具不会触发驱逐（因为它们的返回值通常很小或已经有自己的截断逻辑）：

- `ls`、`glob`、`grep` — 文件列表/搜索工具
- `write_file`、`edit_file` — 写入确认消息
- `write_todos` — todo 列表操作

### 配置

```python
from deepagents.middleware.filesystem import FilesystemMiddleware

# 自定义驱逐阈值
middleware = FilesystemMiddleware(
    backend=backend,
    tool_token_limit_before_evict=10000,  # 更激进的驱逐
)

# 禁用驱逐
middleware = FilesystemMiddleware(
    backend=backend,
    tool_token_limit_before_evict=None,  # 不驱逐
)
```

---

## 4. ContextOverflowError 兜底

即使有主动的摘要触发机制，某些情况下（如 token 计数不精确、系统消息变化等）仍可能触发模型 API 的上下文溢出错误。

`SummarizationMiddleware` 会捕获 `ContextOverflowError`，并自动执行一次摘要作为降级策略：

```python
# 简化的内部逻辑
try:
    return handler(request.override(messages=truncated_messages))
except ContextOverflowError:
    # 降级：立即执行摘要
    cutoff_index = self._determine_cutoff_index(truncated_messages)
    messages_to_summarize, preserved = self._partition_messages(truncated_messages, cutoff_index)
    summary = self._create_summary(messages_to_summarize)
    # ... 用摘要后的消息重试
```

---

## 开发者注意事项

### 使用 `create_deep_agent()` 时

1. **默认已启用所有机制** — `create_deep_agent()` 自动配置了 `SummarizationMiddleware` 和 `FilesystemMiddleware`，包括工具参数截断。通常不需要额外配置。

2. **`create_deep_agent()` 不暴露 `trigger`/`keep` 参数** — 这些值由 `_compute_summarization_defaults(model)` 根据模型 profile 自动计算，没有直接的覆盖入口。如果需要自定义，有两种方式：

   **方式 A：通过 `middleware` 参数追加（简单但有副作用）**

   ```python
   from deepagents import create_deep_agent
   from deepagents.middleware.summarization import SummarizationMiddleware
   from deepagents.backends import StateBackend

   custom_summarization = SummarizationMiddleware(
       model="openai:gpt-4o-mini",
       backend=StateBackend,
       trigger=("tokens", 100000),
       keep=("messages", 10),
   )

   agent = create_deep_agent(
       model="anthropic:claude-sonnet-4-5-20250929",
       middleware=[custom_summarization],
   )
   ```

   > ⚠️ 这样会导致存在两个 `SummarizationMiddleware`（内置默认的 + 你追加的），两者都会执行。对于大多数场景这不会造成问题（先触发的那个会先压缩上下文），但并不理想。

   **方式 B：绕过 `create_deep_agent()`，自己组装 middleware 栈**

   参考 `libs/deepagents/deepagents/graph.py` 中 `create_deep_agent()` 的实现，直接使用 `langchain.agents.create_agent()` 并完全控制 middleware 列表。这样可以精确替换 `SummarizationMiddleware` 的配置。

3. **摘要模型与主模型相同** — 默认使用同一个模型生成摘要。如果想节省成本，可以在自定义 `SummarizationMiddleware` 时指定一个更便宜的模型（如 `gpt-4o-mini`）。

4. **Backend 路由** — CLI 模式下，大型工具结果和对话历史分别路由到独立的临时目录，避免污染工作目录：

   ```python
   CompositeBackend(
       default=backend,
       routes={
           "/large_tool_results/": large_results_backend,
           "/conversation_history/": conversation_history_backend,
       },
   )
   ```

### 自定义 Middleware 时

1. **State Schema 合并** — `SummarizationMiddleware` 使用 `SummarizationState`，其中包含私有字段 `_summarization_event`。如果你的自定义 middleware 也定义了 `state_schema`，确保不会与此字段冲突。

2. **Middleware 顺序很重要** — 在 `create_deep_agent()` 中，middleware 的执行顺序是：

   ```text
   TodoListMiddleware → MemoryMiddleware → SkillsMiddleware →
   FilesystemMiddleware → SubAgentMiddleware → SummarizationMiddleware →
   AnthropicPromptCachingMiddleware → PatchToolCallsMiddleware → 用户自定义 middleware
   ```

   `SummarizationMiddleware` 在 `FilesystemMiddleware` 之后，这意味着它处理的消息已经经过了工具结果驱逐。

3. **子 Agent 也有独立的摘要** — 每个子 agent（包括 general-purpose subagent）都有自己的 `SummarizationMiddleware` 实例，独立管理各自的上下文长度。

### 性能与成本考量

1. **摘要会产生额外的 LLM 调用** — 每次触发摘要时，会额外调用一次 LLM 来生成摘要文本。`trim_tokens_to_summarize` 参数控制发送给摘要 LLM 的最大 token 数（默认 4000，`create_deep_agent` 中设为 `None` 即不限制）。

2. **fraction 模式依赖模型 profile** — 如果使用 `("fraction", 0.85)` 但模型没有 `max_input_tokens` profile，fraction 模式会静默失败（不触发）。确保你的模型有正确的 profile，或使用 `("tokens", N)` 作为备选。

3. **token 计数是近似的** — 默认使用 `count_tokens_approximately`，这是一个基于字符数的粗略估计。如果需要更精确的计数，可以传入自定义的 `token_counter` 函数。

### 调试与排查

1. **日志** — `SummarizationMiddleware` 使用 `logging` 模块记录关键事件。启用 `deepagents.middleware.summarization` logger 的 DEBUG 级别可以看到：
    - 消息持久化的路径和数量
    - 持久化失败的警告

2. **CLI 中的摘要过滤** — CLI 的 Textual UI 会过滤掉摘要 LLM 的流式输出（通过 `_is_summarization_chunk` 检测 `lc_source: "summarization"` 元数据），用户不会看到摘要生成过程。

3. **LocalContextMiddleware 联动** — 在 CLI 中，每次摘要事件发生后，`LocalContextMiddleware` 会自动刷新本地上下文（git 信息、目录树等），确保摘要后的上下文仍然包含最新的环境信息。
