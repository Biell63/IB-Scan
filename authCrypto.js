const crypto = require('crypto');
const os = require('os');

const SECRET = 'IBSCAN::AUTH::V1::STATIC::SALT';

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + SECRET)
    .digest('hex');
}

function sign(data) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(JSON.stringify(data))
    .digest('hex');
}

function verify(data, signature) {
  return sign(data) === signature;
}

function machineHash() {
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.userInfo().username
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');
}

module.exports = {
  hashPassword,
  sign,
  verify,
  machineHash
};
