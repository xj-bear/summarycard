# 技术实施方案 (Implementation Plan)

## 1. 技术栈选择
- **语言**: TypeScript (Node.js)
- **协议**: Model Context Protocol (MCP) SDK
- **截图引擎**: Puppeteer (Headless Chrome)
- **存储**: AWS SDK (S3), 本地文件系统
- **包管理**: NPM

## 2. 核心模块设计

### 2.1 目录结构
```
summarycard/
├── src/
│   ├── index.ts         # MCP Server 入口
│   ├── config.ts        # 环境变量配置
│   ├── renderer.ts      # HTML 渲染与截图逻辑
│   ├── storage.ts       # S3 与文件存储逻辑
│   └── templates/
│       └── card.html    # (嵌入或读取) 卡片模板
├── Dockerfile           # Docker 部署配置
├── package.json
├── tsconfig.json
└── README.md
```

### 2.2 数据流 & 输出逻辑
1. **输入**: LLM 调用工具 `generate_summary_card`。
2. **处理**: 渲染 HTML -> Puppeteer 截图 -> 获取 Buffer。
3. **输出逻辑 (优先级从高到低)**:
   - **S3 模式**: 如果环境变量配置了 `S3_BUCKET_NAME` (且未显式指定其他模式) -> 上传 S3 -> 返回 URL。
   - **本地文件模式**: 如果环境变量配置了 `OUTPUT_DIR` 或请求参数指定了 `filename` (且未配置 S3) -> 保存为 JPG/PNG -> 返回绝对路径。
   - **Base64 模式**: 如果以上均未配置 -> 返回 Base64 编码图片字符串。
   
   *注: 用户也可以通过参数 `output_mode` 强制指定 's3', 'local', 或 'base64'。*

### 2.3 环境变量 (Config)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `OUTPUT_DIR` (可选，用于本地存储)

## 3. 部署方案

### 3.1 本地开发 (npx)
- `package.json` `bin` 字段指向构建后的 `index.js`。
- 用户运行 `npx @username/summarycard` 即可启动 stdio 通信的 MCP Server。

### 3.2 Docker (SSE)
- 使用 `node:slim` 基础镜像，安装必要的 Chrome 依赖 (Puppeteer 需要)。
- 暴露端口，使用 `mcp-proxy` 或直接实现 SSE 端点 (MCP SDK 支持)。

## 4. 详细步骤

1. **初始化**: 配置 TypeScript 环境。
2. **模板处理**: 将现有的 `card.html` 转化为可动态注入的模块。
3. **截图服务**: 编写 `Renderer` 类，管理 Puppeteer 实例（注意资源释放）。
4. **MCP 服务**: 使用 `McpServer` 类注册工具。
5. **Docker化**: 编写 Dockerfile，注意处理 Puppeteer 在 Docker 中的沙箱问题。

## 5. CI/CD 自动化
- **GitHub Actions**:
  - `docker-publish.yml`: 自动构建并推送 Docker 镜像到 Docker Hub (`xjbear/summarycard`)。
  - 触发条件: Push to main/master, Tags.
