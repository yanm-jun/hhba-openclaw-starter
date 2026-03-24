# HHBA OpenClaw Plugin

这是 starter 自带的本地插件包。

它会把 HHBA 的 5 个核心能力注册成 OpenClaw tools：

- `create_task`
- `search_candidates`
- `lock_candidate`
- `submit_result`
- `update_score`

外层 starter 会自动安装这个目录里的依赖，并把它写进生成后的 OpenClaw 配置。
