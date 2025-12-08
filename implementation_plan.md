# 技术实施方案：版本更新与发布

## 1. 版本更新
- **当前版本**: `1.1.0`
- **目标版本**: `1.1.1`
- **操作**:
    - 修改 `package.json` 中的 `version` 字段。
    - 检查 `README.md` 是否有硬编码的版本号需要更新（目前未发现，但需确认）。

## 2. 构建验证
- 执行 `npm run build` 确保 TypeScript 代码能正确编译为 JavaScript。
- 检查 `dist` 目录结构是否完整。

## 3. Git 操作
- 暂存更改: `git add .`
- 提交更改: `git commit -m "chore: bump version to 1.1.1"`
- 打标签: `git tag v1.1.1`

## 4. 发布准备
- 提供 `npm publish` 命令供用户执行。
- 提供 `git push && git push --tags` 命令供用户执行。

## 5. 清理（可选）
- 检查是否存在不需要的临时文件（如 `verify_correction.js`, `check_dim.js`），询问用户是否删除。
