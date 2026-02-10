import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Drag & Drop (used by Editor + Sidebar)
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', '@dnd-kit/modifiers'],
          // Syntax highlighting (only used by CodeBlock)
          'vendor-prism': ['prismjs'],
          // Emoji picker (very heavy ~400KB, only used when picking icons)
          'vendor-emoji': ['emoji-picker-react'],
          // Markdown utilities
          'vendor-markdown': ['marked', 'turndown'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
});
