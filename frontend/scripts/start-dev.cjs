const { spawn } = require('node:child_process');
const { getRequiredEnv } = require('./shared-env.cjs');

const frontendPort = getRequiredEnv('FRONTEND_PORT');
const passthroughArgs = process.argv.slice(2);

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['ng', 'serve', '--host', '127.0.0.1', '--port', frontendPort, ...passthroughArgs],
  {
    stdio: 'inherit',
    shell: false,
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
