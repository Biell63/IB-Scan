const fs = require('fs');
const path = require('path');
const { sign, verify } = require('./authCrypto');

const STORE_PATH = path.join(
  process.env.APPDATA || process.env.HOME,
  '.ibscan-auth.json'
);

function load() {
  if (!fs.existsSync(STORE_PATH)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    const { sig, ...data } = raw;

    if (!verify(data, sig)) return null;
    return data;
  } catch {
    return null;
  }
}

function save(data) {
  const payload = {
    ...data,
    sig: sign(data)
  };
  fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2));
}

function clear() {
  if (fs.existsSync(STORE_PATH)) fs.unlinkSync(STORE_PATH);
}

module.exports = {
  load,
  save,
  clear
};
