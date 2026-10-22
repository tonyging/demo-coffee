import { defineConfig } from 'astro/config';

// 部署到 GitHub Pages：https://tonyging.github.io/demo-coffee/
export default defineConfig({
  site: 'https://tonyging.github.io',
  base: '/demo-coffee/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
