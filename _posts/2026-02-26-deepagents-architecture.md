---
layout: post
date: 2026-02-26
title: Deep Agents 架构全景：从 Backend 到 Middleware 的完整解读
categories: Technology
tags:
  - DeepAgents
  - AIAgent
  - LLM
authors:
  - 桃慕
---

# Deep Agents 架构全景

## LangGraph 图结构

Deep Agents 的核心是通过 `create_deep_agent()` 函数构建一个 LangGraph `CompiledStateGraph`。底层调用 `langchain.agents.create_agent()` 创建一个 tool-calling agent loop。

```mermaid
graph TD
    subgraph "create_deep_agent()"
        A[用户输入 / HumanMessage] --> B[System Prompt 组装]
        B --> C[LLM 推理]
        C --> D{有 Tool Calls?}
        D -- 是 --> E[Tool Node 执行]
        E --> F{HITL 中断?}
        F -- 否 --> C
        F -- 是 --> G[等待人工审批]
        G --> E
        D -- 否 --> H[返回最终响应]
    end

    subgraph "Middleware 栈 (按顺序)"
        M1[TodoListMiddleware] --> M2[MemoryMiddleware]
        M2 --> M3[SkillsMiddleware]
        M3 --> M4[FilesystemMiddleware]
        M4 --> M5[SubAgentMiddleware]
        M5 --> M6[SummarizationMiddleware]
        M6 --> M7[AnthropicPromptCachingMiddleware]
        M7 --> M8[PatchToolCallsMiddleware]
        M8 --> M9[用户自定义 Middleware]
        M9 --> M10[HumanInTheLoopMiddleware]
    end

    subgraph "内置 Tools"
        T1[ls]
        T2[read_file]
        T3[write_file]
        T4[edit_file]
        T5[glob]
        T6[grep]
        T7[execute]
        T8[write_todos]
        T9[task - 子代理]
    end

    C -.-> M1
    E -.-> T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9
```

## 主代理 + 子代理架构

```mermaid
graph TB
    subgraph "Main Agent (Orchestrator)"
        MA[主代理 LLM]
        MA_TOOLS[内置 Tools + 用户 Tools]
        MA_TASK[task tool]
    end

    subgraph "General-Purpose SubAgent"
        GP[通用子代理 LLM]
        GP_TOOLS[继承主代理全部 Tools]
        GP_MW[独立 Middleware 栈]
    end

    subgraph "Custom SubAgent N"
        CS[自定义子代理 LLM]
        CS_TOOLS[自定义 Tools]
        CS_MW[独立 Middleware 栈]
    end

    MA --> MA_TASK
    MA_TASK -- "subagent_type=general-purpose" --> GP
    MA_TASK -- "subagent_type=custom" --> CS
    GP -- "ToolMessage (最终结果)" --> MA
    CS -- "ToolMessage (最终结果)" --> MA
```

---

## Backends (后端存储层)

Backend 是 Deep Agents 的文件存储抽象层。所有后端实现 `BackendProtocol` 接口，提供统一的文件操作 API，使上层 Middleware 和 Tools 无需关心底层存储细节。

| Backend | 类名 | 存储位置 | 持久性 | 执行能力 | 典型场景 |
| --- | --- | --- | --- | --- | --- |
| State | `StateBackend` | LangGraph agent state | 会话内临时 | ❌ | 默认后端，轻量临时文件 |
| Filesystem | `FilesystemBackend` | 本地磁盘 | 永久 | ❌ | 本地开发 CLI |
| LocalShell | `LocalShellBackend` | 本地磁盘 + Shell | 永久 | ✅ `execute()` | 本地开发 + 命令执行 |
| Store | `StoreBackend` | LangGraph BaseStore | 跨会话持久 | ❌ | 持久化记忆/文件 |
| Sandbox | `BaseSandbox` (抽象) | 远程沙箱环境 | 取决于实现 | ✅ `execute()` | Docker/VM 隔离执行 |
| Composite | `CompositeBackend` | 路由到多个后端 | 取决于子后端 | 取决于 default | 混合存储策略 |

### 类继承关系

```mermaid
classDiagram
    class BackendProtocol {
        <<abstract>>
        +ls_info(path) list~FileInfo~
        +read(file_path, offset, limit) str
        +write(file_path, content) WriteResult
        +edit(file_path, old, new, replace_all) EditResult
        +grep_raw(pattern, path, glob) list~GrepMatch~ | str
        +glob_info(pattern, path) list~FileInfo~
        +upload_files(files) list~FileUploadResponse~
        +download_files(paths) list~FileDownloadResponse~
    }

    class SandboxBackendProtocol {
        <<abstract>>
        +id str
        +execute(command, timeout) ExecuteResponse
        +aexecute(command, timeout) ExecuteResponse
    }

    class StateBackend {
        +runtime: ToolRuntime
        -读写 runtime.state 中的 files 字典
        -write/edit 返回 files_update
    }

    class FilesystemBackend {
        +cwd: Path
        +virtual_mode: bool
        +max_file_size_bytes: int
        -_resolve_path(key) Path
        -_to_virtual_path(path) str
        -_ripgrep_search() dict
        -_python_search() dict
    }

    class LocalShellBackend {
        +_default_timeout: int
        +_max_output_bytes: int
        +_env: dict
        +_sandbox_id: str
        +execute(command, timeout) ExecuteResponse
    }

    class StoreBackend {
        +runtime: ToolRuntime
        -_namespace: NamespaceFactory
        -_get_store() BaseStore
        -_get_namespace() tuple
        -_search_store_paginated() list~Item~
    }

    class BaseSandbox {
        <<abstract>>
        +execute(command, timeout) ExecuteResponse*
        +id str*
        +upload_files()*
        +download_files()*
        -所有文件操作通过 execute() 委托
    }

    class CompositeBackend {
        +default: BackendProtocol
        +routes: dict
        +sorted_routes: list
        -_get_backend_and_key(key) tuple
    }

    BackendProtocol <|-- SandboxBackendProtocol
    BackendProtocol <|-- StateBackend
    BackendProtocol <|-- FilesystemBackend
    BackendProtocol <|-- StoreBackend
    BackendProtocol <|-- CompositeBackend
    SandboxBackendProtocol <|-- BaseSandbox
    FilesystemBackend <|-- LocalShellBackend
    SandboxBackendProtocol <|-- LocalShellBackend
```

注意 `LocalShellBackend` 是双重继承：它同时继承 `FilesystemBackend`（文件操作）和 `SandboxBackendProtocol`（Shell 执行能力）。

---

## Middleware (中间件层)

中间件在 agent loop 的不同阶段注入逻辑，按栈顺序执行。

| Middleware | 类名 | 功能 | 注入的 Tools | 修改 System Prompt |
|-----------|------|------|-------------|-------------------|
| TodoList | `TodoListMiddleware` | 任务规划与跟踪 | `write_todos` | ✅ |
| Memory | `MemoryMiddleware` | 加载 AGENTS.md 记忆文件 | 无 (复用 edit_file) | ✅ 注入记忆内容 |
| Skills | `SkillsMiddleware` | 加载 SKILL.md 技能库 | 无 (复用 read_file) | ✅ 注入技能列表 |
| Filesystem | `FilesystemMiddleware` | 文件系统操作 | `ls` `read_file` `write_file` `edit_file` `glob` `grep` `execute` | ✅ |
| SubAgent | `SubAgentMiddleware` | 子代理调度 | `task` | ✅ |
| Summarization | `SummarizationMiddleware` | 对话历史摘要 + 卸载 | 无 | ✅ (摘要注入) |
| AnthropicPromptCaching | `AnthropicPromptCachingMiddleware` | Anthropic 模型 prompt 缓存优化 | 无 | 否 |
| PatchToolCalls | `PatchToolCallsMiddleware` | 修补悬空的 tool calls | 无 | 否 |
| HumanInTheLoop | `HumanInTheLoopMiddleware` | 人工审批中断 | 无 | 否 |

---

## Tools 总览

| Tool | 来源 | 描述 |
|------|------|------|
| `ls` | FilesystemMiddleware | 列出目录内容 |
| `read_file` | FilesystemMiddleware | 读取文件 (支持分页、图片) |
| `write_file` | FilesystemMiddleware | 创建新文件 |
| `edit_file` | FilesystemMiddleware | 精确字符串替换编辑 |
| `glob` | FilesystemMiddleware | Glob 模式文件搜索 |
| `grep` | FilesystemMiddleware | 文本内容搜索 (literal, 非 regex) |
| `execute` | FilesystemMiddleware | Shell 命令执行 (需 SandboxBackend) |
| `write_todos` | TodoListMiddleware | 管理任务列表 |
| `task` | SubAgentMiddleware | 启动子代理执行隔离任务 |

---

## 完整数据流

```mermaid
graph TB
    subgraph "输入层"
        USER[用户] --> |"invoke(messages, files)"| AGENT
    end

    subgraph "Agent 核心"
        AGENT[create_deep_agent] --> |"model + middleware + tools"| GRAPH[CompiledStateGraph]
        GRAPH --> LOOP{Agent Loop}
    end

    subgraph "Middleware 处理"
        LOOP --> MW_BEFORE[before_agent<br/>PatchToolCalls / Memory / Skills 加载]
        MW_BEFORE --> MW_WRAP[wrap_model_call<br/>System Prompt 注入]
        MW_WRAP --> LLM[LLM 推理<br/>Claude / GPT / etc.]
        LLM --> MW_AFTER[after_model_call<br/>Summarization 检查]
    end

    subgraph "工具执行"
        LLM --> |tool_calls| TOOL_NODE[Tool Node]
        TOOL_NODE --> FS_TOOLS[文件系统工具<br/>ls/read/write/edit/glob/grep]
        TOOL_NODE --> EXEC[execute<br/>Shell 命令]
        TOOL_NODE --> TASK[task<br/>子代理]
        TOOL_NODE --> TODO[write_todos<br/>任务管理]
        TOOL_NODE --> CUSTOM[用户自定义 Tools]
    end

    subgraph "后端存储"
        FS_TOOLS & EXEC --> BACKEND{Backend}
        BACKEND --> B_STATE[StateBackend<br/>临时 State]
        BACKEND --> B_FS[FilesystemBackend<br/>本地磁盘]
        BACKEND --> B_SHELL[LocalShellBackend<br/>磁盘 + Shell]
        BACKEND --> B_STORE[StoreBackend<br/>持久 Store]
        BACKEND --> B_COMP[CompositeBackend<br/>路由组合]
    end

    subgraph "子代理"
        TASK --> SUB_GP[General-Purpose<br/>通用子代理]
        TASK --> SUB_CUSTOM[自定义子代理]
        SUB_GP --> |ToolMessage| LOOP
        SUB_CUSTOM --> |ToolMessage| LOOP
    end

    MW_AFTER --> |继续循环| LOOP
    LOOP --> |完成| RESULT[最终响应]
    RESULT --> USER
```

---

**作者简介：** 桃慕，软件工程师，专注 AI Agent 系统研究与开发。

**本系列文章：**
- Deep Agents 架构全景（本文）
- Deep Agents Human-in-the-Loop 机制详解
- Deep Agents Memory 机制详解
- Deep Agents General-Purpose SubAgent 详解
