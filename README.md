<div align="center">
  <h1>🚗 孤独的公路</h1>
  <p>Lonesome Highway - 基于 React 和 Three.js 的 3D 驾驶游戏</p>
</div>

## 🎮 关于游戏

《孤独的公路》是一款沉浸式 3D 驾驶体验游戏，捕捉了在无尽公路上独自前行的忧郁情怀。

### 游戏特色

- 🌅 3D 沉浸式驾驶体验
- 🎨 复古像素风格画面
- 🎵 沉浸式背景音乐
- 💬 精心挑选的忧郁文案
- 🎯 两个精心设计的关卡

## 🚀 快速开始

### 前置要求

- Node.js (v16 或更高版本)
- npm 或 yarn

### 本地运行

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动开发服务器

```bash
npm run dev
```

游戏将在 `http://localhost:3000` 运行

## 📦 生产环境构建

```bash
npm run build
```

优化后的文件将生成在 `dist/` 目录中。

## 🌐 部署指南

### 方法一：部署到 Cloudflare Pages（推荐）

这是最简单、最快速的部署方式。

#### 步骤 1：推送到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Lonesome Highway game"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/lonesome-highway.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 步骤 2：连接 Cloudflare Pages

1. **登录 Cloudflare**
   - 访问：https://dash.cloudflare.com/
   - 登录您的 Cloudflare 账户

2. **创建 Pages 项目**
   - 在左侧菜单选择 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Pages" 标签
   - 点击 "Connect to Git"

3. **连接 GitHub 仓库**
   - 点击 "Connect to Git" 按钮
   - 授权 Cloudflare 访问您的 GitHub
   - 选择 `lonesome-highway` 仓库
   - 点击 "Begin setup"

4. **配置构建设置**
   ```
   项目名称: lonesome-highway
   生产分支: main
   框架预设: None（自定义构建）
   构建命令: npm run build
   构建输出目录: dist
   ```

5. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成（通常 1-2 分钟）
   - 部署成功后，您将获得一个 URL：`https://lonesome-highway.pages.dev`

### 方法二：部署到其他平台

#### Vercel

1. 访问 https://vercel.com/
2. 连接您的 GitHub 账户
3. 导入 `lonesome-highway` 仓库
4. 配置构建设置：
   - Framework Preset: None
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点击 Deploy

#### Netlify

1. 访问 https://www.netlify.com/
2. 点击 "Add new site" → "Import an existing project"
3. 连接 GitHub 并选择仓库
4. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 点击 Deploy site

## 🎯 游戏操作

### 键盘控制

- **W** 或 **↑**：加速
- **A** 或 **←**：左转
- **D** 或 **→**：右转
- **S** 或 **↓**：减速

### 游戏目标

- 🏁 不要停下：保持移动以获得进度
- 🛣️ 留在路上：避免掉出公路边缘
- 🌟 完成两个关卡：
  - 第一关：笔直冲刺
  - 第二关：蜿蜒山道

### 游戏规则

- 长期停滞会导致游戏结束
- 掉出公路边缘会失败
- 到达终点即可胜利

## 🛠️ 技术栈

- **React 19** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Three.js** - 3D 图形引擎
- **React Three Fiber** - React 的 Three.js 封装
- **React Three Drei** - Three.js 辅助库
- **Tailwind CSS** - 样式框架
- **esbuild** - 快速的打包工具

## 📁 项目结构

```
aloneroad/
├── components/          # React 组件
│   ├── GameCanvas.tsx  # 游戏画布
│   ├── HUD.tsx        # 游戏界面
│   └── BGMPlayer.tsx  # 背景音乐播放器
├── public/             # 静态资源
│   └── _redirects     # Cloudflare 路由配置
├── dist/              # 构建输出目录
├── .github/           # GitHub Actions 配置
├── App.tsx            # 主应用组件
├── index.html         # HTML 入口
├── index.tsx          # React 入口
├── types.ts           # TypeScript 类型定义
├── constants.ts       # 游戏常量
├── build-esbuild.js   # esbuild 构建脚本
├── vite.config.ts     # Vite 配置
└── wrangler.toml      # Cloudflare 配置
```

## 🎨 自定义配置

### 修改游戏参数

编辑 `constants.ts` 文件可以调整游戏难度和参数：

```typescript
// 速度设置
const INITIAL_SPEED = 1;
const MAX_SPEED = 3;

// 关卡设置
const LEVEL_1_DISTANCE = 1000;
const LEVEL_2_DISTANCE = 1500;

// 失败判定
const MAX_STAGNATION_TIME = 10; // 秒
```

### 添加新关卡

在 `types.ts` 中定义新的关卡：

```typescript
enum Level {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3, // 新关卡
}
```

### 修改样式

游戏使用 Tailwind CSS，可以在组件中直接使用 Tailwind 类名，或编辑 `index.html` 中的内联样式。

## 🔧 故障排除

### 构建失败

**问题**：运行 `npm run build` 时出错

**解决方案**：
1. 确保已安装所有依赖：`npm install`
2. 检查 Node.js 版本：`node --version`（建议 v16+）
3. 删除 `node_modules` 和 `package-lock.json`，重新安装
4. 检查环境变量是否正确设置

### 部署后游戏无法运行

**问题**：部署到 Cloudflare Pages 后游戏崩溃

**解决方案**：
1. 检查构建设置是否正确：
   - Build command: `npm run build`
   - Output directory: `dist`
3. 查看 Cloudflare Pages 的部署日志
4. 确保所有必要文件都已提交到 Git

## 📝 开发日志

### v0.0.1 (2024-02-10)

- ✅ 初始版本发布
- ✅ 完成两个关卡设计
- ✅ 集成 Three.js 和 React Three Fiber
- ✅ 实现静态文案系统
- ✅ 实现背景音乐系统
- ✅ 配置 Cloudflare Pages 部署

## 🎯 未来计划

- [ ] 添加更多关卡和障碍物
- [ ] 添加成就系统
- [ ] 支持移动端触控
- [ ] 添加更多音乐和音效
- [ ] 添加排行榜

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目为私有项目，仅供学习参考。

## 🙏 致谢

- React 团队提供优秀的 UI 框架
- Three.js 社区提供强大的 3D 渲染能力
- Cloudflare 提供快速的全球 CDN 服务

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues
- Email: [740555510@qq.com]

## 🌟 支持

如果这个项目对您有帮助，请给个 Star ⭐️

---

**祝您游戏愉快！🚗💨**
