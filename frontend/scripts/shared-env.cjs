const fs = require('node:fs');
const path = require('node:path');

function readEnvFile(filePath = path.resolve(__dirname, '../../infra/.env')) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return env;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = value;
      return env;
    }, {});
}

function getRequiredEnv(name) {
  const sharedEnv = readEnvFile();
  const value = process.env[name] || sharedEnv[name];

  if (!value) {
    throw new Error(`${name} must be defined in infra/.env or the shell environment.`);
  }

  return value;
}

module.exports = {
  getRequiredEnv,
  readEnvFile,
};
