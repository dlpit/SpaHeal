const { spawn } = require('child_process');
const fs = require('fs');

const java21Path = 'C:\\Program Files\\Microsoft\\jdk-21.0.12.8-hotspot';
const env = { ...process.env };

if (fs.existsSync(java21Path)) {
  env.JAVA_HOME = java21Path;
  env.PATH = `${java21Path}\\bin;${process.env.PATH || ''}`;
}

const child = spawn(
  'npx',
  ['firebase', 'emulators:start', '--import=./emulators-data', '--export-on-exit'],
  {
    env,
    shell: true,
    stdio: 'inherit'
  }
);

child.on('exit', (code) => {
  process.exit(code || 0);
});
