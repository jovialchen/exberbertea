---
layout: post
date: 2026-02-26
title: Deep Agents SubAgent：上下文隔离与并行执行的利器
categories: Technology
tags:
  - DeepAgents
  - AIAgent
  - LLM
authors:
  - 桃慕
---

# Deep Agents General-Purpose SubAgent 详解

## 概述

Deep Agents 的 SubAgent 机制允许主代理 (Orchestrator) 通过 `task` 工具启动短生命周期的子代理来处理复杂、多步骤的独立任务。每个子代理拥有独立的上下文窗口和 Middleware 栈，执行完毕后返回一条精简的 `ToolMessage` 给主代理。

其中，**General-Purpose SubAgent（通用子代理）** 是系统默认内置的子代理类型。它继承主代理的全部工具和能力，适用于任何需要隔离上下文、节省 token 的通用任务场景。

<pre class="mermaid">
graph TB
    subgraph "Main Agent (Orchestrator)"
        MA[主代理 LLM]
        TASK[task tool]
    end

    subgraph "General-Purpose SubAgent"
        GP[通用子代理 LLM]
        GP_TOOLS[继承主代理全部 Tools]
        GP_MW[独立 Middleware 栈]
    end

    subgraph "Custom SubAgent"
        CS[自定义子代理 LLM]
        CS_TOOLS[自定义 Tools 子集]
    end

    MA --> TASK
    TASK -- "subagent_type='general-purpose'" --> GP
    TASK -- "subagent_type='custom-name'" --> CS
    GP -- "ToolMessage (最终结果)" --> MA
    CS -- "ToolMessage (最终结果)" --> MA
</pre>

## 为什么需要 General-Purpose SubAgent

在处理复杂任务时，主代理的上下文窗口会被大量中间步骤（工具调用、搜索结果、文件内容等）占满。这带来两个问题：

1. **Token 消耗膨胀** — 每次 LLM 推理都需要处理完整的对话历史，中间步骤越多，成本越高
2. **上下文污染** — 不相关的中间信息干扰后续推理质量

General-Purpose SubAgent 通过**上下文隔离**解决这些问题：子代理在独立的上下文窗口中完成多步骤工作，最终只返回一条精简的结果消息。主代理的上下文中只保留这条结果，而非全部中间过程。

### 典型使用场景

| 场景 | 说明 |
| --- | --- |
| 深度研究 | 对某个主题进行多轮搜索和分析，返回综合报告 |
| 代码库分析 | 在大型代码库中搜索文件、阅读代码、分析依赖关系 |
| 多任务并行 | 将独立子任务分发给多个子代理并行执行 |
| 文件批量处理 | 读取、分析、修改多个文件后返回汇总结果 |

## 核心实现

### SubAgent 规格定义

General-Purpose SubAgent 的基础规格定义在 `middleware/subagents.py` 中：

```python
GENERAL_PURPOSE_SUBAGENT: SubAgent = {
    "name": "general-purpose",
    "description": "General-purpose agent for researching complex questions, "
                   "searching for files and content, and executing multi-step tasks. "
                   "This agent has access to all tools as the main agent.",
    "system_prompt": "In order to complete the objective that the user asks of you, "
                     "you have access to a number of standard tools.",
}
```

### 独立的 Middleware 栈

General-Purpose SubAgent 拥有自己的 Middleware 栈，与主代理的栈结构类似但独立运行：

```python
gp_middleware = [
    TodoListMiddleware(),
    FilesystemMiddleware(backend=backend),
    SummarizationMiddleware(model=model, backend=backend, ...),
    AnthropicPromptCachingMiddleware(unsupported_model_behavior="ignore"),
    PatchToolCallsMiddleware(),
]
# 如果主代理配置了 skills，子代理也会加载
if skills is not None:
    gp_middleware.append(SkillsMiddleware(backend=backend, sources=skills))
# 如果主代理配置了 HITL，子代理也会继承
if interrupt_on is not None:
    gp_middleware.append(HumanInTheLoopMiddleware(interrupt_on=interrupt_on))
```

<pre class="mermaid">
graph LR
    subgraph "主代理 Middleware 栈"
        M1[TodoList] --> M2[Memory] --> M3[Skills] --> M4[Filesystem]
        M4 --> M5[SubAgent] --> M6[Summarization] --> M7[PromptCaching]
        M7 --> M8[PatchToolCalls] --> M9[HITL]
    end

    subgraph "General-Purpose SubAgent Middleware 栈"
        G1[TodoList] --> G2[Filesystem] --> G3[Summarization]
        G3 --> G4[PromptCaching] --> G5[PatchToolCalls] --> G6[Skills]
        G6 --> G7[HITL]
    end
</pre>

### task 工具的实现

`task` 工具是主代理调用子代理的唯一入口。它接收两个参数：

- `description` — 任务的详细描述，包含所有必要上下文和期望的输出格式
- `subagent_type` — 子代理类型名称（如 `"general-purpose"`）

```python
def task(
    description: str,      # 任务描述
    subagent_type: str,    # 子代理类型
    runtime: ToolRuntime,  # 运行时上下文
) -> str | Command:
    subagent = subagent_graphs[subagent_type]
    # 构建子代理的初始状态（排除不需要传递的 state key）
    subagent_state = {
        k: v for k, v in runtime.state.items()
        if k not in _EXCLUDED_STATE_KEYS
    }
    subagent_state["messages"] = [HumanMessage(content=description)]
    result = subagent.invoke(subagent_state)
    # 只返回最终消息
    return Command(update={
        "messages": [ToolMessage(result["messages"][-1].text, tool_call_id=...)]
    })
```

## 并行执行

General-Purpose SubAgent 的一个关键优势是支持**并行执行**。当主代理在一次响应中发出多个 `task` 工具调用时，这些子代理可以并发运行：

<pre class="mermaid">
graph TB
    USER[用户: 研究 A、B、C 三个主题并比较] --> MAIN[主代理]
    MAIN --> |"并行 task 调用"| T1[task: 研究 A]
    MAIN --> |"并行 task 调用"| T2[task: 研究 B]
    MAIN --> |"并行 task 调用"| T3[task: 研究 C]
    T1 --> GP1[SubAgent 1: 深度研究 A]
    T2 --> GP2[SubAgent 2: 深度研究 B]
    T3 --> GP3[SubAgent 3: 深度研究 C]
    GP1 --> |"精简报告 A"| MAIN
    GP2 --> |"精简报告 B"| MAIN
    GP3 --> |"精简报告 C"| MAIN
    MAIN --> RESULT[综合比较分析]
    RESULT --> USER
</pre>

每个子代理在自己的上下文窗口中深入研究，可以消耗大量 token 进行搜索和分析，但最终只返回精简的结果。主代理的上下文中只保留三条精简报告，而非三份完整的研究过程。

## 自定义子代理 vs General-Purpose

除了内置的 General-Purpose SubAgent，开发者还可以定义自定义子代理：

```python
agent = create_deep_agent(
    model="openai:gpt-4o",
    tools=[search_tool, write_tool],
    subagents=[
        {
            "name": "researcher",
            "description": "专门用于深度研究的子代理",
            "system_prompt": "你是一个研究助手，专注于收集和分析信息。",
            "model": "anthropic:claude-haiku-4-5-20251001",  # 可以使用不同模型
            "tools": [search_tool],  # 只给搜索工具，不给写入工具
        },
    ],
)
```

| 特性 | General-Purpose | 自定义子代理 |
| --- | --- | --- |
| 工具集 | 继承主代理全部工具 | 可自定义工具子集 |
| 模型 | 继承主代理模型 | 可指定不同模型 |
| System Prompt | 通用提示 | 领域专用提示 |
| 创建方式 | 自动内置 | 通过 `subagents` 参数定义 |
| 适用场景 | 通用任务、上下文隔离 | 特定领域、工具受限场景 |

## task 工具的使用指南

### 何时使用

- 任务复杂且需要多步骤，可以完全委托给子代理独立完成
- 任务之间相互独立，可以并行执行
- 任务需要大量上下文（如代码分析、深度研究），会占满主代理的上下文窗口
- 你只关心最终结果，不需要看到中间步骤

### 何时不使用

- 任务简单，只需要几次工具调用即可完成
- 你需要看到中间推理过程
- 拆分任务不会减少 token 消耗或降低复杂度
- 任务之间有强依赖关系，无法独立执行

### 使用示例

```python
# 主代理的 LLM 会生成类似这样的 tool call：
task(
    description="""
    研究 Python 3.12 的新特性，重点关注：
    1. 类型系统改进
    2. 性能优化
    3. 新的标准库模块

    请返回一份结构化的报告，包含每个特性的简要说明和代码示例。
    """,
    subagent_type="general-purpose"
)
```

关键原则：`description` 应该包含子代理完成任务所需的**全部上下文**，因为子代理看不到主代理的对话历史。同时应明确指定期望的输出格式，因为子代理只能返回一条消息。

## 总结

General-Purpose SubAgent 是 Deep Agents 中实现**上下文隔离**和**并行执行**的核心机制。它通过独立的上下文窗口和 Middleware 栈，让复杂的多步骤任务在隔离环境中高效完成，同时保持主代理上下文的简洁。无论是深度研究、代码分析还是多任务并行，General-Purpose SubAgent 都能有效降低 token 消耗并提升推理质量。

---

**作者简介：** 桃慕，软件工程师，专注 AI Agent 系统研究与开发。

**本系列文章：**
- Deep Agents 架构全景
- Deep Agents Human-in-the-Loop 机制详解
- Deep Agents Memory 机制详解
- Deep Agents General-Purpose SubAgent 详解（本文）
