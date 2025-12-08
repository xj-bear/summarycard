# 版本更新与发布指南

本次更新已完成以下内容：
1.  **版本升级**: `package.json` 版本号已更新为 `1.1.1`。
2.  **文档优化**: `README.md` 已添加 npm 版本徽章。
3.  **代码清理**: 移除了 `verify_correction.js`, `check_dim.js`, `verify_card.js` 等临时测试文件。
4.  **依赖同步**: 更新 `package-lock.json` 版本号至 `1.1.1`。
5.  **构建验证**: 执行了 `npm run build`，构建成功。
6.  **Git 准备**: 已提交更改并创建标签 `v1.1.1`。

## 🚀 后续操作 (Next Steps)

请在终端执行以下命令以完成发布：

### 1. 推送到 GitHub
```bash
git push origin main
git push origin v1.1.1
```

### 2. 发布到 npm
```bash
npm publish --access public
```

### 3. Docker 构建与推送 (可选)
如果您也维护 Docker 镜像，请执行：
```bash
docker build -t xjbear/summarycard:latest -t xjbear/summarycard:v1.1.1 .
docker push xjbear/summarycard:latest
docker push xjbear/summarycard:v1.1.1
```
