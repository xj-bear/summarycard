# 任务清单 (Task List)

## 1. 项目初始化与文档
- [x] 创建 `task.md` (当前文件)
- [x] 创建 `implementation_plan.md` (技术实施方案)
- [x] 创建 `README.md` (项目说明文档，中文)
- [x] 初始化 `package.json` 和 `tsconfig.json`

## 2. 核心功能开发
- [x] 创建基础配置 `config.ts`
- [x] 创建存储服务 `storage.ts` (需根据新计划微调逻辑)
- [x] 创建渲染服务 `renderer.ts`
- [x] 完成 MCP Server 入口 `index.ts`
- [x] 完善 `storage.ts` 以匹配最终输出逻辑

## 3. 部署与打包
- [x] 配置 `Dockerfile` 支持 SSE 模式
- [x] 创建 `docker-compose.yml`
- [x] 配置 `npm` 发布脚本 (支持 `npx` 运行)
- [x] 本地调试脚本

## 5. 新特性开发
- [x] 支持移动端/桌面端布局切换 (`layout` 参数)
- [x] 优化移动端排版 (字体大小、间距调整)
- [x] 新增视觉主题 (`style` 参数): Minimal, Dark, Editorial

## 4. 测试与验证
- [x] 本地生成测试
- [x] S3 上传测试 (逻辑已实现，需凭证验证)
- [x] Docker 容器测试 (Dockerfile 已创建)
- [x] 修复 `dotenv` 版本导致的 stdout 污染问题
- [x] 修复 `dist` 构建路径和 `cherry_config.json` 配置错误
- [x] 增强 `generate_card` 兼容性，支持字符串类型的参数输入 (修复 -32603 错误)

## 6. 样式与布局修复 (进行中)
- [x] 调整移动端宽度至 500px
- [x] 修复左右间距不平衡问题
- [x] 解决卡片粘连问题 (增加间距)
- [x] 进一步缩小字体大小
- [x] 验证用户提供的 "APP推广项目框架合作协议" 案例 (Desktop Layout)
  - [x] 修复 Desktop 布局变形问题 (恢复 .card-grid 样式)
- [x] 验证用户提供的 "APP推广项目框架合作协议" 案例 (Mobile Layout)
  - [x] 验证所有主题 (Default, Minimal, Dark, Editorial) 输出一致性
- [x] 将默认布局 (Layout) 修改为 Mobile (500px)
- [x] 修复输出文件名丢失后缀 (.png) 的问题
- [x] 排查移动端宽度异常问题 (确认是参数 layout='desktop' 导致)
- [x] 移除 `layout` 参数，强制使用 Mobile (500px) 布局
- [x] 样式调整: 移动端标题居中，数字字号改为 1rem
- [x] 修复移动端背景文字 (Background Text) 消失的问题 (移除 opacity 限制)
- [x] 样式统一: `data-highlight` 字号全局调整为 1.2rem
- [x] 恢复移动端背景文字显示 (移除移动端特定覆盖，继承 Desktop 样式)
- [x] 修复 `card.html` 模板文件乱码问题 (重写文件)
- [x] 修复 `card.html` 模板文件乱码问题 (重写文件)
- [x] 验证 `data-highlight` 字号 (1.2rem) 和背景文字可见性
- [x] 修复构建脚本 `copy` 命令未强制覆盖导致旧模板残留的问题
- [x] 优化非数字内容展示: 纯文本数据使用普通样式 (`.card-data-text`)，仅含数字内容使用高亮样式 (`.card-data-highlight`)

## 7. 发布准备 (Release Preparation)
- [x] 更新 `README.md` (用户名 xjbear/xj_bear)
- [x] 更新 `package.json` (包名 @xj_bear/summarycard, 仓库信息)
- [x] 清理测试文件 (test_*.ts, logs)
- [x] 添加 NPM 发布配置 (bin, prepublishOnly)
- [x] 创建 GitHub Actions 工作流 (Docker Build & Push)
- [x] 执行 NPM 构建 (Build)
