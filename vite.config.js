import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Back-office privé : aucune indexation par les moteurs de recherche. */
function robotsPrive() {
  return {
    name: 'pro2link-admin-robots',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nDisallow: /\n' });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000';
  // Racine du domaine (admin.pro2link.sn) par défaut ; ex. « /admin/ » pour un sous-chemin.
  const base = (env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');

  return {
    base,
    plugins: [react(), tailwindcss(), robotsPrive()],
    server: {
      port: 5174,
      // Le navigateur ne parle qu'à Vite : l'API est servie sous la même origine,
      // le cookie httpOnly du refresh token (SameSite=Strict) circule sans CORS.
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/health': { target: proxyTarget, changeOrigin: true },
      },
    },
    preview: { port: 4174 },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts';
            if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) return 'forms';
            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  };
});
