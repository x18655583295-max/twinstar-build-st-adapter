# 来源与改动

上游：<https://github.com/qiwu622/build-standalone>

基于 Build Standalone 0.5.0 的 `extensions/build-standalone-adapter/` 中 `index.js`、`runtime.js`、`transport.js` 与扩展 manifest。上游来源标识为 Build Standalone；原有注释保留。

本仓库改动：

- 调整 TT / RPC 分流界面说明与资源版本。
- 兼容 TT 原生 quiet 独立任务，不额外读取当前聊天。
- 根据酒馆助手的 `js_generation_requested` 来源事件，为 generateRaw 的临时提示词副本标记来源，兼容其底层 normal 请求。
- 对重复使用的请求配置移除本扩展自身的旧边界后再标记。
- 增加独立、无网络、无用户数据的回归检查。

所依据的上游快照未附独立 LICENSE 文件，本仓库没有为上游代码重新指定许可证或宣称独占权利；上游代码的权利归原作者。新增改动亦保留于源码供审阅。
