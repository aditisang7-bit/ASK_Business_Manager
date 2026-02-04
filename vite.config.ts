import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    // Polyfill process.env with loaded env variables
    define: {
      'process.env': env, 
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['recharts', 'lucide-react', '@google/genai']
          }
        }
      }
    },
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: 3000,      // Match Supabase Site URL
      strictPort: true // Do not auto-switch to 3001 if 3000 is taken.
    }
  };
});