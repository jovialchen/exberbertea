---
layout: post
date: 2026-02-26
title: Deep Agents Sandbox：从操作系统隔离到 AI Agent 安全执行
categories: Technology
tags:
  - DeepAgents
  - AIAgent
  - LLM
authors:
  - 桃慕
---

# Sandbox：从操作系统隔离到 AI Agent 安全执行

## 什么是 Sandbox

Sandbox（沙箱）是一种隔离机制，允许程序在受限的环境中运行，使其无法影响外部系统。这个比喻来自儿童游乐场中的沙坑——孩子们可以在沙坑里随意搭建和破坏，而不会对真实世界造成任何损害。

在计算机领域，sandbox 的核心思想是：**将不受信任的代码限制在一个边界内执行，即使代码行为异常或恶意，也无法突破边界影响宿主系统。**

## 历史渊源

Sandbox 的演进史本质上是一部操作系统隔离技术的发展史，从最初的文件系统隔离逐步扩展到进程、网络、资源的全面隔离。

### 1979 — chroot：一切的起点

1979 年，Unix Version 7 的开发过程中引入了 `chroot` 系统调用。它的功能很简单：改变进程看到的根目录（`/`），使进程只能访问指定目录树下的文件。

据记载，Bill Joy 在 1982 年 3 月 18 日将 `chroot` 加入 BSD 系统，最初目的是为了测试 4.2BSD 的安装和构建系统——在一个隔离的目录树中模拟完整的系统环境，而不影响真实的根文件系统。

随着互联网在 1980 年代末和 1990 年代初的扩张，系统管理员开始用 `chroot` 来隔离网络服务。例如，将 Web 服务器运行在 chroot 环境中，即使攻击者利用漏洞获得了服务器进程的控制权，也只能看到 chroot 目录下的文件，无法访问系统的其他部分。

但 `chroot` 有一个根本性的缺陷：它只隔离了文件系统视图，没有隔离进程、网络、用户等其他资源。拥有 root 权限的进程可以轻松"越狱"。

> 来源：[The Story of Containers - VMware](https://blogs.vmware.com/opensource/2018/02/27/the-story-of-containers/)，[Chroot - Wikiwand](https://www.wikiwand.com/en/Chroot_prison)
> Content was rephrased for compliance with licensing restrictions.

### 1995 — Java Applet Sandbox：应用层沙箱的先驱

1995 年，Java 随 JDK 1.0 发布了其安全模型，首次在应用层面上引入了"sandbox"这个术语。Java 的安全架构将代码分为两类：本地代码（受信任，可以完全访问系统资源）和远程下载的 Applet（不受信任，只能在 sandbox 内运行）。

Applet sandbox 限制了远程代码的能力：不能读写本地文件、不能建立任意网络连接、不能执行本地程序。这是第一次在语言运行时层面实现了细粒度的权限控制，而非依赖操作系统内核。

Java sandbox 模型深刻影响了后来的浏览器安全架构。

> 来源：[Java SE Platform Security Architecture - Oracle](https://docs.oracle.com/en/java/javase/17/security/java-se-platform-security-architecture.html)
> Content was rephrased for compliance with licensing restrictions.

### 2000 — FreeBSD Jail：真正的操作系统级隔离

`chroot` 的安全缺陷促使 Poul-Henning Kamp 在 FreeBSD 上开发了 Jail 机制。Jail 于 1999 年提交到 FreeBSD 代码库，随 FreeBSD 4.0 在 2000 年正式发布。

与 `chroot` 相比，Jail 提供了更全面的隔离：

- 独立的文件系统视图（继承自 chroot）
- 独立的进程空间（jail 内的进程看不到 jail 外的进程）
- 独立的网络栈（每个 jail 绑定独立的 IP 地址）
- 独立的主机名
- 限制 root 权限（jail 内的 root 无法影响宿主系统）

Jail 是现代容器技术的直接先驱，它证明了在共享内核的前提下实现强隔离是可行的。

> 来源：[FreeBSD Jail - Wikiwand](https://www.wikiwand.com/en/articles/FreeBSD_Jail)
> Content was rephrased for compliance with licensing restrictions.

### 2004–2008 — Solaris Zones、Linux Namespaces 与 cgroups

2004 年，Sun Microsystems 发布了 Solaris Containers（Zones）的公开测试版，将资源控制和边界隔离结合在一起，并利用 ZFS 的快照和克隆功能实现快速部署。

与此同时，Linux 内核也在发展自己的隔离原语：

- **Linux Namespaces**（2002 年开始）：隔离进程的各种系统视图——PID namespace（进程 ID）、NET namespace（网络栈）、MNT namespace（挂载点）、UTS namespace（主机名）等
- **cgroups**（2006 年由 Google 工程师创建，2008 年合并入 Linux 内核）：控制进程组的资源使用——CPU、内存、磁盘 I/O、网络带宽

Namespaces 提供了"看到什么"的隔离，cgroups 提供了"能用多少"的限制。两者结合，构成了 Linux 容器技术的内核基础。

> 来源：[Technology Landscape - straypaper.com](https://www.straypaper.com/containers-tech-landscape/)，[A Brief History of Containers - Aqua Security](https://www.aquasec.com/blog/a-brief-history-of-containers-from-1970s-chroot-to-docker-2016/)
> Content was rephrased for compliance with licensing restrictions.

### 2008 — LXC：Linux 容器的诞生

2008 年，基于 namespaces 和 cgroups，LXC（Linux Containers）项目诞生。LXC 是第一个完整的 Linux 容器管理工具，提供了创建和管理轻量级隔离环境的用户空间工具。

LXC 容器共享宿主内核，但拥有独立的文件系统、进程树、网络栈和资源限制。相比虚拟机，容器的启动速度快几个数量级，资源开销也小得多。

### 2013 — Docker：容器技术的大众化

2013 年，Docker 在 LXC 的基础上（后来替换为自研的 libcontainer/runc）引入了镜像分层、标准化打包和分发机制，将容器技术从系统管理员的工具变成了每个开发者的日常工具。

Docker 的贡献不在于发明新的隔离技术，而在于将已有的内核原语（namespaces、cgroups、union filesystem）包装成了极其易用的开发者体验。

### 2025 — AI Agent Sandbox：新的前沿

随着 LLM Agent 的兴起，sandbox 技术迎来了新的应用场景。AI Agent 能够自主生成和执行代码、调用工具、修改文件系统，这带来了前所未有的安全挑战：

- Agent 生成的代码可能包含逻辑错误（如 `rm -rf /`）
- Prompt 注入可能导致 Agent 执行恶意操作
- Agent 可能访问敏感文件（API 密钥、SSH 私钥）并通过网络泄露

2025 年的行业共识是：**所有 LLM 生成的代码都应被视为不受信任的代码**，需要在隔离环境中执行。这正是 sandbox 技术在 AI 时代的核心价值。

> 来源：[Code Sandboxes for LLMs and AI Agents - amirmalik.net](https://amirmalik.net/2025/03/07/code-sandboxes-for-llm-ai-agents)，[Sandbox Management for AI Coding Agents - blaxel.ai](https://blaxel.ai/blog/sandbox-management-for-ai-coding-agents)
> Content was rephrased for compliance with licensing restrictions.

### 时间线总结

```
1979  chroot (Unix V7)           — 文件系统视图隔离
1982  chroot 进入 BSD             — 用于构建系统测试
1995  Java Applet Sandbox        — 应用层权限沙箱
2000  FreeBSD Jail               — 操作系统级全面隔离
2004  Solaris Zones              — 资源控制 + 边界隔离
2006  cgroups (Google)           — 进程组资源限制
2008  Linux Namespaces + LXC     — Linux 原生容器
2013  Docker                     — 容器技术大众化
2025  AI Agent Sandbox           — LLM 代码执行隔离
```

---

## Deep Agents 中的 Sandbox

Deep Agents 通过 `SandboxBackendProtocol` 和 `BaseSandbox` 抽象基类，将 sandbox 概念融入其后端架构。sandbox 在 Deep Agents 中的核心作用是：**为 Agent 提供安全的 Shell 命令执行能力**。

### 架构概览

<pre class="mermaid">
classDiagram
    class BackendProtocol {
        <<abstract>>
        +ls_info(path) list~FileInfo~
        +read(file_path) str
        +write(file_path, content) WriteResult
        +edit(file_path, old, new) EditResult
        +grep_raw(pattern) list~GrepMatch~
        +glob_info(pattern) list~FileInfo~
    }

    class SandboxBackendProtocol {
        <<abstract>>
        +id str
        +execute(command, timeout) ExecuteResponse
    }

    class BaseSandbox {
        <<abstract>>
        +execute(command, timeout) ExecuteResponse*
        +upload_files(files)*
        +download_files(paths)*
        所有文件操作通过 execute 委托
    }

    class LocalShellBackend {
        本地 Shell 执行
        无隔离
    }

    class RunloopSandbox {
        Runloop Devbox
        远程隔离环境
    }

    class ModalSandbox {
        Modal Sandbox
        云端容器隔离
    }

    class DaytonaSandbox {
        Daytona Sandbox
        云端开发环境
    }

    BackendProtocol <|-- SandboxBackendProtocol
    SandboxBackendProtocol <|-- BaseSandbox
    SandboxBackendProtocol <|-- LocalShellBackend
    BaseSandbox <|-- RunloopSandbox
    BaseSandbox <|-- ModalSandbox
    BaseSandbox <|-- DaytonaSandbox
</pre>

### SandboxBackendProtocol：执行能力的契约

`SandboxBackendProtocol` 继承 `BackendProtocol`，在文件操作的基础上增加了一个关键能力——Shell 命令执行：

```python
class SandboxBackendProtocol(BackendProtocol):
    @property
    def id(self) -> str: ...           # 沙箱唯一标识

    def execute(
        self,
        command: str,
        *,
        timeout: int | None = None,
    ) -> ExecuteResponse: ...          # 执行 Shell 命令
```

`ExecuteResponse` 包含三个字段：

```python
@dataclass
class ExecuteResponse:
    output: str              # 合并的 stdout + stderr
    exit_code: int | None    # 进程退出码
    truncated: bool = False  # 输出是否被截断
```

只有实现了 `SandboxBackendProtocol` 的后端，Agent 才能使用 `execute` 工具执行 Shell 命令。`FilesystemMiddleware` 在注册工具时会检查后端类型：如果后端不是 `SandboxBackendProtocol`，`execute` 工具会返回错误信息而非执行命令。

### BaseSandbox：远程沙箱的基类

`BaseSandbox` 是一个抽象基类，采用了一种巧妙的设计模式：**将所有文件操作委托给 `execute()` 方法**。这意味着具体的沙箱实现只需提供一个 `execute()` 方法，就能自动获得完整的文件操作能力。

<pre class="mermaid">
graph LR
    subgraph "BaseSandbox 委托模式"
        READ["read('/app/main.py')"] --> EXEC1["execute('python3 -c \"...read script...\"')"]
        WRITE["write('/app/out.txt', content)"] --> EXEC2["execute('python3 -c \"...write script...\"' << heredoc)"]
        EDIT["edit('/app/main.py', old, new)"] --> EXEC3["execute('python3 -c \"...edit script...\"' << heredoc)"]
        LS["ls_info('/app')"] --> EXEC4["execute('python3 -c \"...scandir script...\"')"]
        GREP["grep_raw('pattern')"] --> EXEC5["execute('grep -rHnF ...')"]
        GLOB["glob_info('*.py')"] --> EXEC6["execute('python3 -c \"...glob script...\"')"]
    end
</pre>

这种设计的优势在于：

1. **实现简单** — 新的沙箱提供商只需实现 `execute()`、`upload_files()`、`download_files()` 和 `id` 属性
2. **环境无关** — 只要沙箱环境有 Python3 和基本 Shell 工具，就能支持完整的文件操作
3. **安全传输** — 使用 base64 编码 + heredoc 模式传递文件内容，避免 Shell 注入和 `ARG_MAX` 限制

#### heredoc 安全传输机制

`BaseSandbox` 的 `write()` 和 `edit()` 操作需要将任意内容（可能包含特殊字符、换行、大文件）安全地传递到远程沙箱。直接将内容插入命令行参数会遇到两个问题：

- **Shell 注入** — 内容中的特殊字符可能被 Shell 解释
- **ARG_MAX 限制** — 操作系统对命令行参数总大小有限制（通常 128KB–2MB）

解决方案是将内容 base64 编码后通过 stdin（heredoc）传递：

```bash
python3 -c "
import sys, base64, json
payload = base64.b64decode(sys.stdin.read().strip()).decode('utf-8')
data = json.loads(payload)
# ... 执行文件操作
" <<'__DEEPAGENTS_EOF__'
{base64_encoded_payload}
__DEEPAGENTS_EOF__
```

数据通过 stdin 而非命令行参数传递，绕过了 `ARG_MAX` 限制；base64 编码确保了任意二进制内容的安全传输。

#### exit code 约定

`BaseSandbox` 的 `edit()` 操作使用 exit code 传递操作结果：

| Exit Code | 含义 |
| --- | --- |
| 0 | 成功，stdout 输出替换次数 |
| 1 | 目标字符串未找到 |
| 2 | 多次出现但未指定 `replace_all` |
| 3 | 文件不存在 |
| 4 | payload 解码失败 |

### LocalShellBackend：本地开发的便捷选择

`LocalShellBackend` 是一个特殊的存在——它同时继承了 `FilesystemBackend`（本地文件操作）和 `SandboxBackendProtocol`（Shell 执行），但**不提供任何隔离**。

```python
class LocalShellBackend(FilesystemBackend, SandboxBackendProtocol):
    def execute(self, command: str, *, timeout: int | None = None) -> ExecuteResponse:
        result = subprocess.run(
            command,
            shell=True,        # 直接在宿主 Shell 中执行
            capture_output=True,
            timeout=effective_timeout,
            cwd=str(self.cwd),
        )
        # ...
```

它使用 `subprocess.run(shell=True)` 直接在宿主系统上执行命令，没有任何进程隔离、文件系统隔离或网络隔离。这使得它非常适合本地开发场景（CLI 编码助手），但完全不适合生产环境。

`LocalShellBackend` 的安全保障完全依赖于 Human-in-the-Loop (HITL) 中间件——在执行每个命令前暂停，等待人工审批。

### 远程沙箱实现：真正的隔离

Deep Agents 通过 partner 包提供了三个远程沙箱实现，它们都继承自 `BaseSandbox`，在真正隔离的环境中执行代码：

#### RunloopSandbox

连接到 [Runloop](https://runloop.ai/) 的 Devbox（远程开发环境），通过 Runloop API 执行命令：

```python
class RunloopSandbox(BaseSandbox):
    def execute(self, command, *, timeout=None):
        result = self._devbox.cmd.exec(command, timeout=effective_timeout)
        # ...
```

#### ModalSandbox

连接到 [Modal](https://modal.com/) 的云端沙箱容器，通过 Modal SDK 执行命令：

```python
class ModalSandbox(BaseSandbox):
    def execute(self, command, *, timeout=None):
        process = self._sandbox.exec("bash", "-c", command, timeout=effective_timeout)
        process.wait()
        # ...
```

Modal 的实现还覆盖了 `download_files()` 和 `upload_files()`，使用 Modal 的原生文件 API 而非通过 `execute()` 委托，提供更高效的文件传输。

#### DaytonaSandbox

连接到 [Daytona](https://daytona.io/) 的云端开发环境：

```python
class DaytonaSandbox(BaseSandbox):
    def execute(self, command, *, timeout=None):
        result = self._sandbox.process.exec(command, timeout=effective_timeout)
        # ...
```

### 使用方式

#### 本地开发（无隔离）

```python
from deepagents import create_deep_agent
from deepagents.backends import LocalShellBackend

agent = create_deep_agent(
    backend=LocalShellBackend(root_dir="/my/project"),
    interrupt_on={"execute": True},  # 强烈建议启用 HITL
)
```

#### 远程沙箱（真正隔离）

```python
from deepagents import create_deep_agent
from langchain_modal import ModalSandbox
import modal

# 创建 Modal 沙箱
sandbox = modal.Sandbox.create(image=modal.Image.debian_slim().pip_install("numpy"))

agent = create_deep_agent(
    backend=ModalSandbox(sandbox=sandbox),
    # 沙箱环境中 HITL 是可选的，因为代码在隔离环境中执行
)
```

#### 自定义沙箱

如果需要对接其他沙箱提供商（如 Docker、AWS CodeBuild、自建 VM），只需继承 `BaseSandbox` 并实现四个抽象方法：

```python
from deepagents.backends.sandbox import BaseSandbox
from deepagents.backends.protocol import ExecuteResponse, FileDownloadResponse, FileUploadResponse

class MyCustomSandbox(BaseSandbox):
    @property
    def id(self) -> str:
        return "my-sandbox-123"

    def execute(self, command: str, *, timeout: int | None = None) -> ExecuteResponse:
        # 在你的隔离环境中执行命令
        ...

    def upload_files(self, files: list[tuple[str, bytes]]) -> list[FileUploadResponse]:
        # 上传文件到沙箱
        ...

    def download_files(self, paths: list[str]) -> list[FileDownloadResponse]:
        # 从沙箱下载文件
        ...
```

所有文件操作（`read`、`write`、`edit`、`ls_info`、`grep_raw`、`glob_info`）会自动通过 `execute()` 委托实现。

### 完整数据流

<pre class="mermaid">
sequenceDiagram
    participant User as 用户
    participant Agent as Deep Agent
    participant MW as FilesystemMiddleware
    participant Sandbox as Sandbox Backend

    User->>Agent: "运行测试"
    Agent->>Agent: LLM 推理，决定执行 Shell 命令
    Agent->>MW: execute("pytest tests/")

    alt LocalShellBackend
        MW->>MW: 检查 HITL 配置
        MW-->>User: interrupt（等待审批）
        User->>MW: approve
        MW->>Sandbox: subprocess.run("pytest tests/", shell=True)
        Note over Sandbox: 直接在宿主系统执行，无隔离
    else 远程 Sandbox (Modal/Runloop/Daytona)
        MW->>Sandbox: sandbox.exec("pytest tests/")
        Note over Sandbox: 在隔离容器/VM 中执行
    end

    Sandbox-->>MW: ExecuteResponse(output="...", exit_code=0)
    MW-->>Agent: 工具结果
    Agent-->>User: "测试全部通过"
</pre>

## 安全建议

| 场景 | 推荐后端 | HITL |
| --- | --- | --- |
| 本地开发 CLI | `LocalShellBackend` | 必须启用 |
| 生产 API 服务 | `StateBackend`（无 Shell） | 可选 |
| CI/CD 流水线 | 远程 Sandbox | 可选 |
| 多租户平台 | 远程 Sandbox | 建议启用 |
| 教育/演示环境 | 远程 Sandbox | 可选 |

核心原则：**如果 Agent 能执行 Shell 命令，要么在隔离环境中执行，要么启用 HITL 人工审批。** 两者至少选其一。

## 总结

Sandbox 技术从 1979 年的 `chroot` 起步，经历了 FreeBSD Jail、Solaris Zones、Linux Namespaces/cgroups、Docker 容器等里程碑，在 2025 年的 AI Agent 时代找到了新的使命。Deep Agents 通过 `BaseSandbox` 抽象基类和可插拔的后端架构，让开发者可以灵活选择隔离级别——从本地开发的零隔离（`LocalShellBackend` + HITL）到生产环境的完全隔离（远程 Sandbox），在安全性和便捷性之间找到合适的平衡点。
