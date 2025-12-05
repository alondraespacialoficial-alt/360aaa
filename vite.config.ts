import path from 'path';
import { defineConfig, loadEnv } from 'vite';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3004,
        host: '0.0.0.0',
      },
      plugins: [],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Separa React y ReactDOM en su propio chunk
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              // Separa Supabase (es grande)
              'supabase-vendor': ['@supabase/supabase-js'],
              // Separa Stripe
              'stripe-vendor': ['@stripe/stripe-js', 'stripe'],
              // Separa Google AI (Gemini)
              'ai-vendor': ['@google/generative-ai'],
            }
          }
        },
        chunkSizeWarningLimit: 600, // Aumenta el límite a 600kb para evitar warnings innecesarios
      }
    };
});
