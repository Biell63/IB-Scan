const { execSync } = require('child_process');
const os = require('os');
async function apply({ folder, context }) {
  if (!folder || !context)
    throw new Error('Dados insuficientes para ACL');

  if (os.platform() === 'win32') {
    applyWindowsACL(folder, context);
  } else {
    applyUnixACL(folder);
  }
}
function applyWindowsACL(folder, context) {
  const cmds = [
    `icacls "${folder}" /inheritance:r`,
    `icacls "${folder}" /remove:g *S-1-1-0`,
    `icacls "${folder}" /remove:g *S-1-5-32-545`,
    `icacls "${folder}" /grant "${context.target}:(OI)(CI)M"`
  ];
  for (const cmd of cmds) {
    try {
      execSync(cmd, { stdio: 'ignore' });
    } catch {
    }
  }
}
function applyUnixACL(folder) {
  execSync(`chmod 700 "${folder}"`);
}
module.exports = { apply };
