---
create_date: 2026-02-21
type: Research
source:
  - Anna Meng
  - Vicki Yang
categories:
  - Technology
authors:
  - 桃慕
tags:
  - AIAgent
  - AIWorkflow
  - MCP
  - ACP
---

## AI Agent & AI IDE

| 工具                            | 发布时间                                         | 主要用途分类                                                                 | 使用的编程语言                                                                      | 是否支持Skills                                  | 如何支持Rules                                                   | 是否支持MCP                                                | 是否支持ACP                                                                     |
| ----------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Cursor**​                   | 2025年6月发布1.0版本                               | **AI原生IDE**：基于VS Code构建，深度集成Claude 3.5 Sonnet、GPT-4o等模型，提供全仓库智能对话和代码生成 | **TypeScript/JavaScript**（基于VS Code核心），部分AI功能使用Python                        | **是**，通过MCP协议集成外部工具                         | 通过项目根目录的`.cursorrules`/`.mdc`文件进行语义化触发约束，支持全局规则和项目规则分层管理    | **是**，支持MCP协议，可通过设置面板配置MCP服务器                          | **否**，主要通过MCP协议扩展能力                                                         |
| **Trae**​                     | 2025年1月19日发布海外版，2025年3月3日发布国内版               | **AI原生IDE**：字节跳动推出的国内首个AI原生集成开发环境，主打Builder模式快速构建                      | **TypeScript/JavaScript**（前端），**Python/Go/Java**等（后端）                        | **是**，内置Builder模式的通用技能                      | 通过`.traerules`文件提供项目全局约束，支持个人规则和项目规则两种类型                    | **是**，支持MCP协议，提供MCP市场、手动配置和安装链接导入三种方式                  | **否**，主要通过MCP协议扩展能力                                                         |
| **Cline**​                    | 2024年6月出道，原名Claude Dev                       | **AI原生IDE**：提供高度灵活的编程智能体，支持自定义工具流和自动化工作流                               | **TypeScript/JavaScript**（VS Code扩展）                                         | **是**，支持用户自定义工具流（Custom Skills）             | 通过`.clinerules`文件（Markdown格式）定义项目级规则，支持全局规则和工作区规则分层管理       | **是**，支持MCP协议，通过XML标签在JSON的content字段中传递交互逻辑            | **是**，支持ACP协议，可通过`client -acp`标志将Cline转变为ACP兼容的代理                           |
| **Kiro**​                     | 2025年7月进入公共预览阶段，2025年11月19日正式可用              | **AI原生IDE**：亚马逊云科技推出的规范驱动开发IDE，主打氛围编程和智能代理钩子                           | **Python 3.10+**（后端，FastAPI），**React 18 + TypeScript**（前端）                   | **是**，支持Powers（一键安装的MCP专家包）                 | 通过**Steering**机制实现全局+局部引导文件（如`STEERING.md`），支持规则覆盖和优先级管理    | **是**，支持MCP协议，可通过`.kiro/settings/mcp.json`配置文件管理MCP服务器 | **是**，支持ACP协议，通过`kiro-cli acp`命令将Kiro转变为符合ACP标准的Agent，支持JetBrains全家桶和Zed编辑器 |
| **Windsurf**​                 | 2025年4月正式更名（原Codeium）                        | **AI原生IDE**：基于Codeium云端知识库，提供Cascade全仓库聊天和智能补全                         | **TypeScript/JavaScript**（基于VS Code构建）                                       | **是**，深度集成Codeium云端知识库作为专家技能                | 通过`.windsurfrules`文件进行约束，支持全局规则和工作区规则，限制每个文件6000字符          | **是**，支持MCP协议，Wave 3版本开始全面支持MCP智能协议                    | **否**，主要通过MCP协议扩展能力                                                         |
| **Claude Code (Anthropic)**​  | 2025年2月随Claude 3.7 Sonnet一同发布                | **自主编程标杆**：顶级CLI Agent，具备极高的推理一致性和复杂的仓库级操作能力                           | **TypeScript/JavaScript**（主要通过npm发行）                                         | 文档未明确提及用户自定义技能支持                            | 文档未明确提及规则文件支持机制                                             | **是**，支持MCP协议，作为MCP生态的核心推动者                            | **是**，支持ACP协议，通过官方适配器`@zed-industries/claude-code-acp`实现ACP Server          |
| **OpenClaw**​                 | 2025年11月首次以Clawdbot名称发布，2026年1月30日定名OpenClaw | **高性能开源Agent**：旨在复刻并增强Claude Code的自主性，支持TDD插件和多语言环境                    | **Node.js 22+ + TypeScript**（核心），支持Python、JavaScript/TypeScript、Java、Go等多种语言 | **是**，支持技能平台（ClawHub）和用户自定义技能               | **是**，通过配置文件（`openclaw.json`）和会话参数进行约束，支持持久化记忆              | **是**，支持MCP协议，OpenClaw Gateway可同时作为MCP Server运行        | **是**，支持ACP协议，提出了ACP标准并完整实现，让IDE通过标准协议与Agent通信                              |
| **DeepAgents (LangChain官方)**​ | 2025年10月28日发布0.2版本                           | **Agent Harness**：基于LangGraph运行时，集成规划、文件系统、子智能体，开箱即用                   | **Python**（基于LangChain生态）                                                    | **是**，支持添加自定义工具（`tools`参数）                  | 支持通过系统提示词（`system_prompt`）进行行为约束，基于LangGraph的状态管理机制         | **是**，支持MCP协议，可通过`MultiServerMCPClient`集成MCP工具         | **否**，主要通过MCP协议扩展能力                                                         |
| **OpenCode**​                 | 2025年6月19日正式发布                               | **开源AI编程智能体**：支持多模型，提供终端TUI和编程辅助，可在终端、IDE或桌面端运行                        | **Bun + Go双引擎架构**，核心使用TypeScript/Go                                          | **是**，支持自定义命令和MCP工具集成                       | 支持通过配置文件的`agents`部分定义模型和行为参数，提供自动紧凑功能管理上下文                  | **是**，支持MCP协议，可集成MCP工具                                 | **否**，主要通过MCP协议扩展能力                                                         |

### 核心洞察

当前AI Agent的架构演进呈现明显的收敛趋势：从早期各自为政的Workflow编排，逐渐统一到 **React Loop（感知-决策-执行循环） + Middleware（中间件层） + Skills（技能模块）**​  的三层架构范式。这一演进路径在主流Agent工具中清晰可见, 并且被应用到了AI IDE中：

**架构统一化趋势**：

- **React Loop层**成为Agent的"大脑"，负责状态管理和决策循环（LangGraph的状态机、OpenClaw的自主推理循环）

- **Middleware层**标准化工具集成，MCP/ACP协议成为事实标准（Cursor、Kiro、OpenClaw的双协议支持）

- **Skills层**模块化封装专业能力，从MCP工具到自定义技能链（Cline的Custom Skills、Kiro的Powers）

## AI Workflow Framework

| 工具                     | 发布时间                          | 主要用途分类                                            | 使用的编程语言                                                           | 是否支持Skills                                  | 如何支持Rules                                                   | 是否支持MCP                                  | 是否支持ACP                 |     |
| ---------------------- | ----------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- | ----------------------- | --- |
| **PocketFlow**​        | 2025年7月左右发布极简LLM框架版本          | **极简LLM工作流框架**：核心约100行代码，旨在实现高效的"Agentic Coding"  | **Python**（核心框架），支持多语言版本（Python、TypeScript、Java、C++、Go、Rust、PHP等） | 框架本身不提供内置技能，但因其代码极简，可由AI代理理解并集成任何工具         | 框架层级较低，不直接提供规则约束机制，依赖具体应用实现                                 | **否**，作为极简框架，不直接集成MCP协议                  | **否**，作为极简框架，不直接集成ACP协议 |     |
| **LangGraph**​         | 2024年1月首次发布，2025年10月发布1.0版本   | **Agent编排框架**：基于状态机驱动的低层编排框架，解决复杂任务中的编排与状态持久化问题   | **Python**（主要），也支持**TypeScript/JavaScript**版本                     | **N/A**（作为底层编排框架，不直接提供"技能"概念，但可编排任何工具或节点）   | **N/A**（作为底层框架，规则约束由开发者在上层图中定义，提供状态管理和持久化机制）                | **是**，支持MCP协议，可通过适配器集成MCP工具              | **否**，作为底层框架，不直接集成ACP协议 |     |
| **Spring AI Alibaba**​ | 2024年9月正式开源，2025年6月发布1.0 GA版本 | **Java生态AI框架**：阿里巴巴主导贡献的Spring生态AI框架，提供企业级智能体解决方案 | **Java**（基于Spring Boot 3.4.8+，JDK 17+）                            | **是**，支持技能（Skills）注册和管理，深度集成Spring Cloud技术栈 | **是**，通过配置化的上下文工程策略、Agent配置和工作流定义实现规则约束，支持Human-in-the-loop | **是**，支持MCP协议，深度集成Model Context Protocol | **否**，主要通过MCP协议扩展能力     |     |



## 高阶技能树 (Skills)：工程化的确定性

在 AI 时代，为了对抗模型的"幻觉"并提升开发流程的可靠性，以下四种工程化实践与工具成为了关键。

### A. 规格驱动设计 (Spec-Driven Development)

代码是易耗品，**Spec（规格）**​ 才是核心资产。此方法强调在编写代码前，先由AI与开发者共同确认清晰、可执行的需求与设计规格。

- **Spec Kit (GitHub官方出品)**: [github.com/github/spec-kit](https://github.com/github/spec-kit)。通过 `specify`CLI 工具和一套 `/speckit.*`斜杠命令，强制AI在编码前依次生成项目准则、功能规格、技术方案和任务清单。它不仅适用于从0到1创建新项目，也支持对现有项目的迭代式开发。该工具兼容Claude、GPT、Cursor等超过20种AI代理。

- **OpenSpec (Fission.AI出品)**: [github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)。主打"流式而非瀑布式、迭代而非阶段式"的轻量级规格框架。其核心哲学是服务于现有复杂项目，支持渐进式修改。它提供了一个完整的工作流（从提案、规格、设计到任务），并能集成到开发者现有的工具链中，通过斜杠命令与多种AI助手协同工作。

### B. 属性测试 (Property-Based Testing - PBT)

这是一种通过定义并验证代码行为的通用数学属性，来系统化发现边界案例和"隐形Bug"的测试方法。

- **核心参考**: 该技能的定义和最佳实践可参考相关领域的权威资源（注：您之前提供的Trail of Bits链接内容无法访问，此处基于模型知识描述）。常见的实践包括验证代码的"不变性"、对状态机进行测试，以及利用工具自动寻找并缩小导致测试失败的最小反例。

- **核心工具**: 根据语言生态不同，可选择 **Hypothesis (Python)**、**fast-check (TypeScript/JavaScript)**​ 或 **Echidna (Solidity)**​ 等库。

### C. 超级技能工作流 (Superpowers)

这是一套为AI编码助手（如Claude Code）设计的、可组合的完整软件开发技能与工作流系统，强制执行工程最佳实践。

- **Superpowers 技能库**: [github.com/obra/superpowers](https://github.com/obra/superpowers)。它不仅仅关乎测试，更是一套覆盖从构思到交付全流程的"元技能"。其主要强制执行的流程包括：`brainstorming`（设计构思与验证）、`using-git-worktrees`（创建隔离开发分支）、`writing-plans`（详细任务分解）、`subagent-driven-development`（子代理驱动开发）、`test-driven-development`（严格遵守"红灯-绿灯-重构"的TDD循环）、`requesting-code-review`（代码审查）以及`finishing-a-development-branch`（分支收尾）。其技能是语言和框架无关的流程指导。

### D. 智能体 Web 自动化测试 (Webapp Testing)

这是由Anthropic官方定义的技能，指导AI如何对本地Web应用进行自动化测试。

- **核心参考 (Anthropic官方技能)**: [github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md)。

- **关键方法**: 该技能要求使用 **Python**​ 编写 **Playwright**​ 脚本。它提供了一个决策树，指导AI根据应用类型（静态或动态）选择测试方法：对于动态应用，优先使用辅助脚本（如`with_server.py`）管理服务器生命周期，并强调在检查DOM或执行操作前必须等待页面达到`networkidle`状态。核心模式是"侦察-然后-行动"：先导航、等待、截图或检查渲染后的DOM状态以识别选择器，再使用发现的选择器执行自动化操作。

---
