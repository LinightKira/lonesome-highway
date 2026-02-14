import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

(async () => {
  try {
    // 清理并创建 dist 目录
    const distDir = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // 使用 esbuild 构建
    await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: 'dist/bundle.js',
      platform: 'browser',
      target: 'es2020',
      jsx: 'automatic',
      jsxImportSource: 'react',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      },
      publicPath: '/',
      sourcemap: true,
    });

    // 复制 public 目录内容
    const publicDir = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicDir)) {
      copyDirectory(publicDir, distDir);
    }

    // 复制并修改 index.html
    let htmlContent = fs.readFileSync('index.html', 'utf-8');
    // 替换脚本引用为 bundle.js
    htmlContent = htmlContent.replace(
      '<script type="module" src="/index.tsx"></script>',
      '<script src="/bundle.js"></script>'
    );
    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);

    // 创建 _redirects 文件
    fs.writeFileSync(
      path.join(distDir, '_redirects'),
      '/* /index.html 200\n'
    );

    console.log('✓ Build complete! Files are in dist/');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
})();

function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

