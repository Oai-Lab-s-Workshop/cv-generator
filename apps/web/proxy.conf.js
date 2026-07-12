const pocketbaseInternalPort = process.env.POCKETBASE_INTERNAL_PORT || '8090';
const target = process.env.POCKETBASE_BASE_URL || `http://pocketbase:${pocketbaseInternalPort}`;

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
  },
  '/api/**': {
    target,
    secure: false,
    changeOrigin: true,
  },
  '/_/': {
    target,
    secure: false,
    changeOrigin: true,
  },
};
