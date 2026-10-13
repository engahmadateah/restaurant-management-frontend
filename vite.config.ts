import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // ميزة مدمجة بـ Vite 8: بتقرأ "paths" من tsconfig.app.json تلقائياً
    // كطبقة حماية إضافية فوق الـ alias اليدوي تحت.
    tsconfigPaths: true,
    alias: {
      // بنستخدم import.meta.url بدل __dirname لأنو __dirname مش موجود
      // بشكل موثوق جوا ES modules (package.json فيه "type": "module")،
      // وهاد كان سبب فشل الـ alias عند بعض المستخدمين على ويندوز.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // بدّل التارغت لعنوان الـ Laravel API عندك محلياً وقت التطوير
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
