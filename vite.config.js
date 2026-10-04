export default {
  base: process.env.GITHUB_PAGES === 'true' ? '/hakoniwa2/' : '/',
  optimizeDeps: { noDiscovery: true, include: [], exclude: ['three'] },
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
    },
  },
};
