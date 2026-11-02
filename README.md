# 双子星 Build/ST 酒馆分流适配

适用于 TauriTavern（TT）与兼容的 SillyTavern 客户端。当前版本：**0.5.3-twinstar-rpc**。

将 `build-st/` 请求封装为 Build 后端需要的 `BUILD_ST_CONTEXT_V1`：酒馆预设直接进入提示词，聊天历史、世界书和角色资料等进入上下文附件。

**这是酒馆扩展，不是 Chrome 扩展，也不是 API 服务器。** 仍需一个支持 `build-st/` 和上述分流协议的 Build 后端。扩展不包含 API 地址、密钥、账号、Cookie 或用户聊天。

## 安装

在酒馆的「扩展」→「安装扩展」中粘贴本仓库地址：

```text
https://github.com/x18655583295-max/twinstar-build-st-adapter
```

安装后刷新酒馆，在扩展设置中确认「双子星 Build/ST · 酒馆分流」已开启，并核对版本为 `0.5.3-twinstar-rpc`。

已手动安装过 `build-standalone-adapter` 或其他 Build 分流扩展时，先禁用旧副本，避免同一请求被重复处理。

无法从 Git 安装时，可下载 GitHub 的 Code → Download ZIP，解压出含 `manifest.json` 的目录，放入客户端支持的用户扩展目录，再刷新。具体目录以客户端数据目录为准。

## API 设置

1. 使用「自定义 OpenAI」，或「OpenAI＋反向代理」。填写自己的服务商提供的 Base URL 和 API Key。
2. 普通聊天分流选择 `build-st/gemini-4-argon`、`build-st/gemini-4-argon-low` 等后端实际提供的模型。
3. 清空此连接的「自定义请求正文」和「排除正文参数」；扩展会按每次请求设置它们。
4. 关闭工具／函数调用、图片、JSON Schema 和多候选生成。目前只支持纯文本、单候选。
5. 「测试连接」使用普通 `build/` 模型；分流需要提示词准备过程。

`build/` 普通模型不依赖本扩展，扩展也不会修改 `build/`、`pggo/` 等其他模型的请求。后处理的“无工具”选项不保证顶层请求没有 `tools` 等字段，工具参数兼容问题需在客户端或后端另行处理。

## 两种输入路径

| 请求 | 处理方式 |
| --- | --- |
| 标准酒馆聊天 | 在 Prompt Manager 的临时副本中标记来源，保留预设原文，背景和历史进入附件 |
| TT 自带 generateRaw 静默请求 | 只封装本次提供的消息；system/developer 指令内联，其他任务数据入附件 |
| 酒馆助手 generateRaw，如建档 AI 灵感／补全 | 利用 `js_generation_requested` 来源事件识别；即使底层请求类型为 normal，也保留独立任务语义，不额外加入当前聊天或预设 |

分流过程不修改保存的预设、世界书、角色和聊天。临时边界在封装前移除，消息角色、顺序和文本保留。缺少来源标记的普通聊天仍会拒绝，不会把所有 normal 请求当作独立任务放行。

## 限制与验证范围

- 内联内容沿用 45000 token 估算保护，实际后端限制由服务器决定。本扩展不会自动截断预设。
- 其他扩展如果破坏临时边界，分流会拒绝请求并显示错误。
- 0.5.3 针对酒馆助手 generateRaw 的 normal 请求路径增加了回归检查；已通过离线检查。发布时尚未完成用户当前 TT 及其全部扩展组合的真实建档回合确认。
- 本仓库的离线测试不调用模型，也不访问任何用户数据。安装 Node.js 后执行 `npm test`。

## 更新与停用

使用酒馆扩展管理器更新本仓库，随后刷新页面。停用时在扩展管理器禁用本扩展即可，不需要修改服务器 API 或 Key。

## 来源

基于 [qiwu622/build-standalone](https://github.com/qiwu622/build-standalone) 0.5.0 自带兼容酒馆适配器调整，保留原有代码注释。改动与来源见 [UPSTREAM.md](UPSTREAM.md)。
