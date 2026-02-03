const permissionResolver = require('./permissionResolver');
const aclApplier = require('./aclApplier');
const log = require('./protectionLog');
const fs = require('fs');
const path = require('path');
async function protectFiles({ files, targetFolder, actor }) {
  if (!Array.isArray(files) || !files.length)
    throw new Error('Nenhum arquivo informado');
  if (!targetFolder)
    throw new Error('Pasta de destino inválida');
  if (!fs.existsSync(targetFolder))
    fs.mkdirSync(targetFolder, { recursive: true });
  const context = await permissionResolver.resolve();
  const moved = [];
  for (const file of files) {
    const dest = path.join(targetFolder, path.basename(file));
    fs.renameSync(file, dest);
    moved.push(dest);
  }
  await aclApplier.apply({
    folder: targetFolder,
    context
  });
  log.record({
    action: 'PROTECT_FOLDER',
    actor,
    folder: targetFolder,
    files: moved.length,
    mode: context.mode,
    target: context.target
  });

  return { ok: true, files: moved };
}
module.exports = { protectFiles };
