const { contextBridge, ipcRenderer } = require('electron');
let scanning = false;
let protecting = false;
let progressCallback = null;
const validPath = p =>
  typeof p === 'string' && p.length > 2 && p.length < 4096;

const validPassword = p =>
  typeof p === 'string' && p.length >= 4 && p.length < 256;

const validUser = u =>
  typeof u === 'string' && u.length >= 2 && u.length < 128;
const validScanId = id =>
  (typeof id === 'string' && id.length > 0 && id.length < 128) ||
  (typeof id === 'number' && Number.isSafeInteger(id));
ipcRenderer.on('scan-progress', (_, progress) => {
  if (
    typeof progressCallback === 'function' &&
    progress &&
    Number.isInteger(progress.processed) &&
    Number.isInteger(progress.total)
  ) {
    try {
      progressCallback({
        processed: progress.processed,
        total: progress.total
      });
    } catch {
    }
  }
});
const api = {
  async login(user, password) {
    if (!validUser(user) || !validPassword(password))
      return { ok: false, error: 'Credenciais inválidas' };

    try {
      return await ipcRenderer.invoke('auth-login', user, password);
    } catch {
      return { ok: false, error: 'Falha ao autenticar' };
    }
  },
  async logout() {
    try {
      return await ipcRenderer.invoke('auth-logout');
    } catch {
      return { ok: false };
    }
  },
  async getAuthStatus() {
    try {
      return await ipcRenderer.invoke('auth-status');
    } catch {
      return { logged: false };
    }
  },
  async selectFolder() {
    return ipcRenderer.invoke('select-folder');
  },

  async runScan(folderPath) {
    if (scanning || protecting)
      return { ok: false, error: 'Operação em andamento' };

    if (!validPath(folderPath))
      return { ok: false, error: 'Caminho inválido' };

    scanning = true;
    try {
      return await ipcRenderer.invoke('run-scan', folderPath);
    } catch {
      return { ok: false, error: 'Falha ao executar varredura' };
    } finally {
      scanning = false;
    }
  },
  onProgress(callback) {
    if (typeof callback === 'function') {
      progressCallback = callback;
    }
  },
async getHistory() {
  try {
    const res = await ipcRenderer.invoke('history-list');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
},
async exportHistoryPdf(scanId) {
  if (!validScanId(scanId))
    return { ok: false, error: 'ID inválido' };

  try {
    return await ipcRenderer.invoke('history-export-pdf', scanId);
  } catch {
    return { ok: false, error: 'Falha ao exportar PDF' };
  }
},

async clearHistory() {
  try {
    return await ipcRenderer.invoke('history-clear');
  } catch {
    return { ok: false, error: 'Falha ao limpar histórico' };
  }
},
  async protectionPreview(files) {
    if (!Array.isArray(files) || !files.length)
      return { ok: false, error: 'Lista de arquivos inválida' };

    try {
      return await ipcRenderer.invoke('protection-preview', {
        files
      });
    } catch {
      return { ok: false, error: 'Falha no preview da proteção' };
    }
  },
  async protectionApply({ files, targetFolder }) {
    if (protecting)
      return { ok: false, error: 'Proteção em andamento' };

    if (!Array.isArray(files) || !files.length)
      return { ok: false, error: 'Arquivos inválidos' };

    if (!validPath(targetFolder))
      return { ok: false, error: 'Pasta inválida' };

    protecting = true;

    try {
      return await ipcRenderer.invoke('protection-apply', {
        files,
        targetFolder,
        actor: 'ui'
      });
    } catch {
      return { ok: false, error: 'Falha ao proteger arquivos' };
    } finally {
      protecting = false;
    }
  },
  async openFile(filePath) {
    if (!validPath(filePath))
      return { ok: false, error: 'Caminho inválido' };

    return ipcRenderer.invoke('open-file', filePath);
  },

  async exportReport() {
    if (scanning || protecting)
      return { ok: false, error: 'Operação em andamento' };

    try {
      return await ipcRenderer.invoke('export-report');
    } catch {
      return { ok: false, error: 'Falha ao exportar relatório' };
    }
  }
};
function deepFreeze(obj) {
  Object.freeze(obj);
  for (const k of Object.keys(obj)) {
    if (
      typeof obj[k] === 'object' &&
      obj[k] !== null &&
      !Object.isFrozen(obj[k])
    ) {
      deepFreeze(obj[k]);
    }
  }
  return obj;
}
contextBridge.exposeInMainWorld(
  'IBScan',
  deepFreeze(api)
);
