# DFDesk

DFDesk 是一个面向《三角洲行动》烽火地带玩家的中文网页工具，提供首页信息、鼠鼠卡战备、特勤处、改枪码、赛季任务、活动与拼图小游戏等功能。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm ci
npm run dev
```

开发服务器启动后，打开终端显示的本地地址。

## 构建与独立启动

```bash
npm run build
npm start
```

默认监听 `http://localhost:4173`。可通过 `PORT` 环境变量修改端口。

## 测试

```bash
npm test
```

## 可选数据源

没有第三方密钥时，应用仍可启动，并对不可用的数据源显示说明或使用本地演示数据。若需要启用可选数据源：

```bash
cp .env.example .env
```

然后在 `.env` 中填写服务端密钥。不要把 `.env` 或任何真实密钥提交到仓库。

- `ORZICE_TOKEN`：可选的国服第三方开放平台令牌。
- `DELTA_FORCE_API_KEY`：可选的国际服第三方 API 密钥。
- `DELTA_FORCE_API_BASE_URL`：国际服第三方 API 地址。
- `PORT`：独立服务端口。

第三方接口的可用性、区服覆盖和授权条款由各服务提供方决定。
