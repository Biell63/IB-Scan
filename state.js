const License = require('./license/license');
const { STATUS } = require('./license/validator');
const state = {
  allowed: false,
  reason: 'Licença não carregada'
};
const StateAPI = {
  init() {
    License.load();
    this.sync();
  },
  sync() {
    const status = License.getStatus();
    if (status === STATUS.VALID) {
      state.allowed = true;
      state.reason = 'OK';
    } else {
      state.allowed = false;
      state.reason = this.humanize(status);
    }
  },
  block(reason = 'Bloqueado') {
    License.invalidate(reason);
    state.allowed = false;
    state.reason = reason;
  },
  isAllowed() {
    this.sync();
    return state.allowed;
  },
  canScan() {
    return this.isAllowed();
  },

  canScanDocuments() {
    return this.canScan();
  },

  canScanImages() {
    return this.canScan();
  },

  canUseAdvancedFeatures() {
    // reservado para planos futuros // 
    return this.isAllowed();
  },
  getStatus() {
    this.sync();
    return state.reason;
  },
  activate(licenseString) {
    const res = License.activate(licenseString);
    this.sync();
    return res;
  }
};
StateAPI.humanize = function (status) {
  switch (status) {
    case STATUS.EXPIRED:
      return 'Licença expirada';
    case STATUS.INVALID_MACHINE:
      return 'Licença não pertence a este computador';
    case STATUS.INVALID_SIGNATURE:
      return 'Licença inválida (assinatura)';
    case STATUS.MISSING_FIELDS:
    case STATUS.INVALID_FORMAT:
      return 'Chave de licença inválida';
    default:
      return 'Licença inválida';
  }
};

module.exports = Object.freeze(StateAPI);
