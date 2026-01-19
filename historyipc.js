const { ipcMain, dialog } = require('electron');
const path = require('path');
const historyService = require('./history.service');
const exportPdf = require('../report/exportPdf');
ipcMain.handle('history-list', () => {
  try {
    const list = historyService.list(); 
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[HISTORY LIST ERROR]', err);
    return [];
  }
});
ipcMain.handle('history-export-pdf', async (_, scanId) => {
  try {
    if (!scanId || typeof scanId !== 'string') {
      return { ok: false, error: 'ID inválido' };
    }

    const scan = historyService.getById(scanId);
    if (!scan) {
      return { ok: false, error: 'Registro não encontrado' };
    }
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (canceled || !filePaths.length) {
      return { ok: false, error: 'Operação cancelada' };
    }

    const outputPath = path.join(
      filePaths[0],
      `IBSCAN-Historico-${scan.id}.pdf`
    );
    await exportPdf(scan, outputPath);

    return { ok: true, file: outputPath };

  } catch (err) {
    console.error('[HISTORY EXPORT PDF ERROR]', err);
    return { ok: false, error: 'Falha ao exportar PDF' };
  }
});
ipcMain.handle('history-clear', () => {
  try {
    historyService.clear();
    return { ok: true };
  } catch (err) {
    console.error('[HISTORY CLEAR ERROR]', err);
    return { ok: false, error: 'Falha ao limpar histórico' };
  }
});
