# 总结卡片生成器 MCP (Summary Card MCP)

这是一个基于 Model Context Protocol (MCP) 的工具服务，专为大语言模型 (LLM) 设计。它能够将结构化的文本数据转化为精美的可视化总结卡片，并以图片形式返回。

## ✨ 核心功能

*   **智能排版**: 基于 HTML/CSS 的精美卡片模板，自动适配内容。
*   **多模态输出**:
    *   🖼️ **Base64**: 直接返回图片数据，适合直接在聊天窗口展示。
    *   ☁️ **S3 存储**: 自动上传至 AWS S3 (或兼容存储)，返回访问链接。
    *   📂 **本地文件**: 支持保存到本地指定目录。
*   **灵活部署**:
    *   📦 **NPM/NPX**: 支持本地快速启动。
    *   🐳 **Docker**: 支持服务器端 SSE (Server-Sent Events) 部署。

## 🚀 快速开始

### 1. 本地运行 (npx)

无需安装，直接使用 `npx` 启动服务 (需确保本地已安装 Node.js 和 Chrome/Chromium):

```bash
npx @xj_bear/summarycard
```

### 2. 配置说明

可以通过环境变量配置服务行为：

| 变量名 | 描述 | 必填 | 默认值 |
| :--- | :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | S3 访问密钥 ID | 否 | - |
| `AWS_SECRET_ACCESS_KEY` | S3 访问密钥 Secret | 否 | - |
| `AWS_REGION` | S3 区域 | 否 | us-east-1 |
| `S3_BUCKET_NAME` | S3 存储桶名称 | 否 | - |
| `S3_ENDPOINT` | 自定义 S3 端点 (如 MinIO/OSS) | 否 | - |
| `OUTPUT_DIR` | 本地图片保存路径 | 否 | (临时目录) |

### 3. 在 MCP 客户端中使用

在你的 MCP 配置文件 (如 Claude Desktop Config) 中添加：

```json
{
  "mcpServers": {
    "summary-card": {
      "command": "npx",
      "args": ["-y", "@xj_bear/summarycard"],
      "env": {
        "S3_BUCKET_NAME": "my-cards",
        "AWS_ACCESS_KEY_ID": "..."
      }
    }
  }
}
```

### 3. 在 MCP 客户端中使用 (如 Cherry Studio)

在你的 MCP 客户端配置文件中添加以下内容 (请根据实际路径调整)：

```json
{
  "mcpServers": {
    "summary-card": {
      "command": "node",
      "args": ["g:/project/阿里mcp大赛/summarycard/dist/src/index.js"],
      "env": {
        "PUPPETEER_EXECUTABLE_PATH": "C:\\Users\\Administrator\\.cache\\puppeteer\\chrome-headless-shell\\win64-143.0.7499.40\\chrome-headless-shell-win64\\chrome-headless-shell.exe"
      }
    }
  }
}
```

## 🛠️ 工具定义 (Tool Definition)

本服务提供一个核心工具：`generate_card`

**输入参数 (Schema):**

```json
{
  "title": "卡片标题",
2. 在项目根目录创建 `.env` 文件并填入 AWS 凭证 (参考 `.env.example` 或直接在 `docker-compose.yml` 中配置)。
3. 运行：

```bash
docker-compose up -d --build
```

### 手动构建

```bash
# 构建镜像
docker build -t xjbear/summarycard .

# 运行容器 (SSE 模式)
docker run -d -p 3000:3000 \
  -e S3_BUCKET_NAME=my-bucket \
  xjbear/summarycard
```

## 📦 开发指南

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **本地调试**:
   ```bash
   npm run dev
   ```

3. **构建**:
   ```bash
   npm run build
   ```

## 📄 许可证

MIT
