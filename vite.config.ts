import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import WindiCSSPluginAnimations from '@windicss/plugin-animations'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    WindiCSS({
      config: {
        plugins: [WindiCSSPluginAnimations()],
      },
    }),
  ],
  server: {
    port: 8080,
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: `${resolve(__dirname, 'src')}`,
      },
    ],
  },
})
