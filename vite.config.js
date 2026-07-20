import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Auto-detects the correct base path for GitHub Pages.
// When built inside GitHub Actions, GITHUB_REPOSITORY is set to "username/repo-name" —
// we use that to set base to "/repo-name/" automatically, so you never have to edit this file.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  plugins: [react()],
  base: repoName ? `/${repoName}/` : '/',
})
