const { hashPassword, machineHash } = require('./authCrypto');
const store = require('./authStore');

let session = null;

 const USERS = [
    {
      user: 'ibscan',
      passHash: hashPassword('ibscan2831')
    }
  ];  

function now() {
  return Math.floor(Date.now() / 1000);
}

function init() {
  const data = store.load();
  if (!data) return;
  if (now() < data.lastRun) {
    store.clear();
    return;
  }
  if (data.machine !== machineHash()) {
    store.clear();
    return;
  }

  session = data;
  session.lastRun = now();
  store.save(session);
}

function login(user, password) {
  const u = USERS.find(x => x.user === user);
  if (!u) return { ok: false, error: 'Usuário ou senha inválidos' };

  if (u.passHash !== hashPassword(password))
    return { ok: false, error: 'Usuário ou senha inválidos' };

  const issuedAt = now();
  const expiresAt = issuedAt + 60 * 60 * 24 * 365; // 1 ano

  session = {
    user,
    issuedAt,
    expiresAt,
    lastRun: issuedAt,
    machine: machineHash()
  };

  store.save(session);
  return { ok: true };
}

function logout() {
  session = null;
  store.clear();
}

function isValid() {
  if (!session) return false;
  if (now() > session.expiresAt) return false;
  return true;
}

function status() {
  if (!session) return { logged: false };

  return {
    logged: true,
    user: session.user,
    expiresAt: session.expiresAt,
    expired: now() > session.expiresAt
  };
}

function canUse() {
  return isValid();
}

module.exports = {
  init,
  login,
  logout,
  status,
  canUse
};
