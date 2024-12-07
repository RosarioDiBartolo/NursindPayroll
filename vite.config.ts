import { defineConfig  } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const isDevelopment = mode === 'development';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Bind to all network interfaces
      port: 2000,
     
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
