---
layout: post
date: 2026-02-21
title: "2026年2月 AI 辅助开发+Agent 总结"
categories: Technology
tags:
  - AI
  - Agent
  - IDE
  - Development
authors:
  - 桃慕
---

## 1. IDE 核心能力对比：Rules 与 Skills

衡量一个 IDE 好坏的标准不仅是模型，更是它对工程化约束（Rules）和模块化能力（Skills）的支持。

|   |   |   |   |
|---|---|---|---|
|**IDE**|**Rules (规则约束)**|**Skills / Powers (专家技能)**|**核心优势**|
|**Cursor**|`.cursorrules` / `.mdc` (语义化触发)|依靠 MCP 协议集成外部工具|规则挂载最精准，生态最丰富|
|**Trae**|`.traerules` (项目全局约束)|内置 Builder 模式的通用技能|免费额度高，0-1 构建极强|
|**Cline**|`.clinerules` (Markdown 格式)|**Custom Skills**: 支持用户自定义工具流|灵活性最高，完全透明|
|**Kiro**|**Steering**: 全局+局部引导文件|**Powers**: 一键安装的 MCP 专家包|专家知识开箱即用，支持 Steering 覆盖机制|
|**Windsurf**|`.windsurfrules`|深度集成 Codeium 的云端知识库|响应速度最快，Flow 感最强|

## 2. Agent 进展：从"对话框"到"自主工程"

Agent 的能力不再取决于单一的 Prompt，而灵活取决于其背后的**编排架构**与**自主执行深度**。

### 核心项目与工具

- **Claude Code (Anthropic)**: `TypeScript` | 顶级 CLI Agent，具备极高的推理一致性和复杂的仓库级操作能力。它是目前"自主编程"的标杆。目前主要通过 `npm` 发行。

- **OpenClaw**: `Python/TypeScript` | [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)。高性能开源 Agent 尝试，旨在复刻并增强 Claude Code 的自主性，对多语言环境 and 文件系统权限有极佳的适配。支持 TDD 插件。

- **DeepAgents (LangChain 官方，开源)**: `Python` | [github.com/langchain-ai/deepagents](https://github.com/langchain-ai/deepagents)。由 LangChain 团队开发的 Agent Harness。它基于 **LangGraph** 运行时，集成了规划（Planning）、文件系统后端和子智能体（Sub-agents）生成能力。

- **PocketFlow (开源)**: `Python` | [https://github.com/The-Pocket/PocketFlow](https://github.com/The-Pocket/PocketFlow)。**【核心优势：极致轻量】** 极简主义 LLM 工作流框架。其核心抽象仅约 100 行代码，旨在消除大框架的冗余。这种极低的代码复杂性使得 AI Agent 能够完美理解其逻辑，从而实现高效的"Agentic Coding"。

- **OpenCode**: `TypeScript/Rust` | [github.com/opencode-ai/opencode](https://github.com/opencode-ai/opencode)。**【开源 AI 编程智能体】** 可以在终端、IDE 或桌面端运行。同时支持连接任何模型供应商（包括 Claude, GPT, Gemini 等），为开发者提供高性能且不绑定厂商的底座支持。

- **LangGraph (开源)**: `Python/TypeScript` | [github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)。基于状态机驱动的 Agent 编排框架。它通过显式的循环逻辑（Cycles）和状态持久化，解决了复杂软件工程任务中 Agent 容易"迷路"或陷入死循环的问题。

- **Spring AI (Alibaba)**: `Java` | [github.com/alibaba/spring-ai-alibaba](https://github.com/alibaba/spring-ai-alibaba)。阿里巴巴主导贡献的 Spring 生态 AI 框架。它通过统一的抽象接口对接各类 LLM，并深度集成 Spring Cloud 技术栈。

## 3. 高阶技能树 (Skills)：工程化的确定性

在 AI 时代，为了对抗模型的"幻觉"，以下四种工程技能成为了顶级开发者的护城河。

### A. 规格驱动设计 (Spec-Driven Coding Design)

代码是易耗品，**Spec（规格）** 才是核心资产。

- **Spec Kit (0-1)**: `TypeScript` | [github.com/github/spec-kit](https://github.com/github/spec-kit)。GitHub 官方出品，通过 `specify` CLI 引导。它强制 AI 在写代码前生成规格文档，非常适合新项目从 0 到 1 的严谨构建。

- **OpenSpec (1-N)**: `Markdown/YAML` | [github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)。主打"流式"而非"瀑布式"规划。它引入了 `delta-based` 理念，专门针对现有项目（Brownfield）的渐进式修改。

### B. 属性测试 (Property-Based Testing - PBT)

这是 2026 年捕获"隐形 Bug"与安全漏洞的最强手段。

- **核心参考**: `Python/JS/Solidity` | https://github.com/trailofbits/skills/tree/main/plugins/property-based-testing/skills/property-based-testing。根据 Trail of Bits 的 definition，PBT 是将代码行为抽象为数学性质的工程实践。

- **核心工具**: **Hypothesis (Python)**、**fast-check (TS/JS)** 或 **Echidna (Solidity)**。

- **Skill 重点**: 验证不变性 (Invariants，如 $\forall x \in \text{Inputs}, \text{Property}(x) = \text{True}$)、状态机测试 (Stateful Testing) 以及最小反例缩小 (Shrinking)。

### C. TDD&Worktree (Super Powers)

利用 Agent 技能库实现"红灯-绿灯-重构"的强约束。

- **Superpowers 插件**: `TypeScript` | [github.com/obra/superpowers](https://github.com/obra/superpowers)。这是为 Claude Code 打造的专家技能包，强制执行 `RED-GREEN-REFACTOR`流程。Agent 必须先编写测试并观察其失败，才能被允许编写业务代码。

### D. 智能体 Web 自动化测试 (Webapp Testing)

- **核心参考**: `TypeScript` | [anthropics/skills/webapp-testing](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md)。这是 Anthropic 定义的官方技能规范。

- **关键能力**: 自适应导航 (Adaptive Navigation)、多模态断言 (Multimodal Assertions)、环境自愈 (Self-healing) 和自动上下文隔离 (Context Isolation)。
