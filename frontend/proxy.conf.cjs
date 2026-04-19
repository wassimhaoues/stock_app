const { getRequiredEnv } = require('./scripts/shared-env.cjs');

const target = getRequiredEnv('FRONTEND_PROXY_TARGET');

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'info',
  },
};
