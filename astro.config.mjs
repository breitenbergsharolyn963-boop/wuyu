// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// GitHub Pages 部署：根据仓库名自动推断 base 子路径。
// 本地开发（非 CI）时 base 固定为 '/'，不影响 npm run dev / preview。
const inCI = process.env.GITHUB_ACTIONS === 'true';
const owner = process.env.GH_OWNER ?? 'your-username';
const repo = process.env.GH_REPO ?? 'your-repo';
// 用户/组织页：仓库名为 <owner>.github.io，部署在根路径，无需 base
const isUserPage = repo === `${owner}.github.io`;

export default defineConfig({
  site: inCI ? `https://${owner}.github.io` : 'http://localhost:4321',
  base: inCI && !isUserPage ? `/${repo}/` : '/',
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      // 代码高亮主题：浅色用 github-light，深色用 github-dark
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
  },
});
