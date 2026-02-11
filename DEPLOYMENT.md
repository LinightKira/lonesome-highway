# 🌟 GitHub 部署指南

## 📋 准备工作

您的项目已经配置好了所有必要的文件，可以部署到 Cloudflare Pages！

## 🎯 推荐的英文名称：**Lonesome Highway**

## 📝 第一步：推送到 GitHub

### 1. 初始化 Git 仓库（如果还没有）

```bash
cd "e:\紫夜世离\开端\AIGames\aloneroad"
git init
```

### 2. 添加文件到暂存区

```bash
git add .
```

### 3. 提交文件

```bash
git commit -m "Initial commit: Lonesome Highway game"
```

### 4. 在 GitHub 上创建新仓库

- 访问 https://github.com/new
- 仓库名称：`lonesome-highway`
- 设置为 Private（私有）或 Public（公开）
- 不要初始化 README、.gitignore 或 LICENSE（我们已经有了）
- 点击 "Create repository"

### 5. 推送到 GitHub

```bash
git remote add origin https://github.com/你的用户名/lonesome-highway.git
git branch -M main
git push -u origin main
```

**替换 `你的用户名` 为您的 GitHub 用户名**

## 🚀 第二步：连接到 Cloudflare Pages

### 方法一：通过 Cloudflare Dashboard

1. **登录 Cloudflare**
   - 访问：https://dash.cloudflare.com/
   - 登录您的账户

2. **创建 Pages 项目**
   - 在左侧菜单选择 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Pages" 标签
   - 点击 "Connect to Git"

3. **连接 GitHub 仓库**
   - 点击 "Connect to Git" 按钮
   - 授权 Cloudflare 访问您的 GitHub 账户
   - 选择 `lonesome-highway` 仓库
   - 点击 "Begin setup"

4. **配置构建设置**
   - **Project name**: `lonesome-highway`
   - **Production branch**: `main`
   - **Framework preset**: `None`（我们使用自定义构建）
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

5. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成（通常 1-2 分钟）
   - 部署成功后会获得一个 URL：`https://lonesome-highway.pages.dev`

### 方法二：使用 Wrangler CLI

如果您已经安装了 Wrangler：

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建 Pages 项目（连接到 GitHub）
npx wrangler pages project create lonesome-highway --production-branch=main

# 3. 部署（需要先推送代码到 GitHub）
# Cloudflare Pages 会自动从 GitHub 部署
```

## 🔧 配置自定义域名（可选）

1. 在 Cloudflare Pages 项目设置中
2. 点击 "Custom domains"
3. 点击 "Set up a custom domain"
4. 输入您的域名（例如：`lonesome-highway.yourdomain.com`）
5. 按照提示配置 DNS 记录

## 📊 监控部署

- 每次您推送代码到 `main` 分支，Cloudflare Pages 会自动重新部署
- 可以在 Cloudflare Dashboard 查看部署日志
- 支持预览部署（Preview Deployments）用于测试 Pull Requests

## 🎨 个性化项目

### 更改项目名称

如果您想使用其他英文名称，可以：

1. 修改 `package.json` 中的 `name` 字段
2. 修改 `README.md` 中的标题
3. 在 Cloudflare Pages 中可以设置任何项目名称（不依赖代码）

### 推荐的其他名称

- `Solitary-Drive`
- `Infinite-Road`
- `The-Lonesome-Highway`
- `Deserted-Highway`

## 📝 常见问题

### Q: 构建失败怎么办？
A: 检查：
1. Cloudflare Pages 的构建命令是否正确（`npm run build`）
2. 输出目录是否正确（`dist`）
3. 查看构建日志获取详细错误信息

### Q: 如何回滚到之前的版本？
A: 在 Cloudflare Pages 项目中：
1. 进入 "Deployments" 标签
2. 找到之前的部署版本
3. 点击右侧的三个点菜单
4. 选择 "Rollback to this deployment"

### Q: 如何添加自定义域名？
A: 见上面的 "配置自定义域名" 部分

## 🎉 完成！

一旦部署成功，您的游戏就可以通过以下方式访问：
- Cloudflare Pages URL: `https://lonesome-highway.pages.dev`
- 您的自定义域名（如果已配置）

---

**祝您的游戏发布成功！🚗💨**
