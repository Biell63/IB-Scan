const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AuthState = require('./app/auth/authState');
const Scanner = require('./scanner');
const HistoryRaw = require('./app/history/historyService');
const ProtectionService = require('./app/protection/protectionService');
const History = {
  add: HistoryRaw.add,
  clear: HistoryRaw.clear,
  read: HistoryRaw.read,
  getById: HistoryRaw.getById
};
let scanRunning = false;
let lastScanResult = null;
let lastScanFolder = null;
let mainWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    resizable: false,
    title: 'IB Scan',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui/index.html'));
}

function buildHtml(scan) {
  const logoPath = path.join(__dirname, 'assets', 'logo.png');

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(scan))
    .digest('hex');

  const shortHash = hash.slice(0,12) + '...' + hash.slice(-12);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
@page { margin:40px; }
body { font-family:Arial; border:6px solid #0b4f6c; padding:40px; }
h1 { color:#0b4f6c; margin:0; }
h2 { color:#1fa3d1; margin-top:25px; }
table { width:100%; border-collapse:collapse; font-size:11px; }
th,td { border:1px solid #ccc; padding:6px; }
th { background:#eaf6fb; }
.risk-ALTO{color:red;font-weight:bold;}
.risk-MEDIO{color:orange;font-weight:bold;}
.risk-BAIXO{color:green;font-weight:bold;}
.footer{margin-top:30px;font-size:10px;color:#666;text-align:center;}
</style>
</head>
<body>

${fs.existsSync(logoPath) ? `<img src="file://${logoPath.replace(/\\/g,'/')}" width="90">` : ''}

<h1>Relatório Executivo de Auditoria</h1>

<p><b>Data:</b> ${new Date(scan.date).toLocaleString()}</p>
<p><b>Pasta:</b> ${scan.folder}</p>

<h2>Resumo Executivo</h2>
<ul>
<li>Analisados: ${scan.summary.analyzed}</li>
<li>Com risco: ${scan.summary.compromised}</li>
<li class="risk-ALTO">Alto: ${scan.summary.byRisk.ALTO}</li>
<li class="risk-MEDIO">Médio: ${scan.summary.byRisk.MEDIO}</li>
<li class="risk-BAIXO">Baixo: ${scan.summary.byRisk.BAIXO}</li>
</ul>

<h2>Arquivos Identificados</h2>
<table>
<tr><th>Arquivo</th><th>Risco</th><th>Motivo</th></tr>
${(scan.findings||[]).map(f=>`
<tr>
<td>${f.file || '-'}</td>
<td class="risk-${f.risk || 'BAIXO'}">${f.risk || 'BAIXO'}</td>
<td>${(f.findings||[]).map(x=>x.description).join(', ') || '-'}</td>
</tr>`).join('')}
</table>

<h2>Assinatura Técnica</h2>
<p style="font-size:11px;">
Código de Integridade: <b>${shortHash}</b><br>
Algoritmo: SHA-256<br>
Data de geração: ${new Date().toLocaleString()}
</p>

<div style="margin-top:35px;padding:15px;background:#f7f7f7;border-top:2px solid #0b4f6c;font-size:10px;color:#444;line-height:1.5">

<b>Declaração Jurídica de Responsabilidade</b><br><br>

Este relatório foi gerado automaticamente pela ferramenta IB Scan com base
na análise técnica executada no ambiente indicado, no momento da auditoria.
Os resultados refletem exclusivamente o estado dos arquivos analisados
na data e hora registradas.

A IB Scan não garante a detecção de todas as informações sensíveis,
ameaças ou vulnerabilidades existentes, nem se responsabiliza por
decisões administrativas, técnicas ou jurídicas tomadas com base
neste documento.

Este relatório não substitui auditorias formais, perícias técnicas,
consultorias especializadas ou pareceres jurídicos profissionais.
O uso deste documento implica ciência e concordância com estas condições.

</div>

<div class="footer">
IB Scan © ${new Date().getFullYear()}
</div>

</body>
</html>`;
}
async function generatePdf(scan) {
  try {
    await app.whenReady();
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (canceled || !filePaths.length) return { ok:false };
    const outputPath = path.join(filePaths[0], `IBSCAN-${scan.id}.pdf`);
    const htmlPath = path.join(app.getPath('temp'), `ibscan-${scan.id}.html`);
    fs.writeFileSync(htmlPath, buildHtml(scan), 'utf8');
    const win = new BrowserWindow({ show:false });
    await win.loadFile(htmlPath);
    const pdf = await win.webContents.printToPDF({ printBackground:true });
    fs.writeFileSync(outputPath, pdf);
    win.close();
    return { ok:true, file: outputPath };
  } catch (err) {
    console.error('[PDF ERROR]', err);
    return { ok:false, error:'Falha ao gerar PDF' };
  }
}
ipcMain.handle('auth-status', () => AuthState.status());
ipcMain.handle('auth-login', (_, u,p) => AuthState.login(u,p));
ipcMain.handle('auth-logout', () => (AuthState.logout(),{ok:true}));
ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return canceled || !filePaths.length ? null : filePaths[0];
});
ipcMain.handle('open-file', async (_, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { ok:false, error:'Arquivo não encontrado' };
    }
    await shell.openPath(filePath);
    return { ok:true };
  } catch (e) {
    return { ok:false, error:'Falha ao abrir arquivo' };
  }
});
ipcMain.handle('run-scan', async (_, folder) => {
  if (scanRunning) return { ok:false };
  scanRunning = true;

  try {
    const data = await Scanner.run(folder, p=>{
      mainWindow.webContents.send('scan-progress', p);
    });
    lastScanResult = data;
    lastScanFolder = folder;
    History.add({
      id: Date.now(),
      folder,
      date: new Date().toISOString(),
      summary: data.summary,
      findings: data.findings
    });
    return { ok:true, data };
  } finally {
    scanRunning = false;
  }
});
ipcMain.handle('export-report', async () => {
  if (!lastScanResult) return { ok:false, error:'Nenhuma auditoria' };
  const scan = {
    id: Date.now(),
    folder: lastScanFolder,
    date: new Date().toISOString(),
    summary: lastScanResult.summary,
    findings: lastScanResult.findings
  };
  return await generatePdf(scan);
});
ipcMain.handle('history-export-pdf', async (_, id) => {
  const scan = History.getById(id);
  if (!scan) return { ok:false, error:'Registro não encontrado' };
  return await generatePdf(scan);
});
ipcMain.handle('history-list', ()=>History.read());
ipcMain.handle('history-clear', ()=> (History.clear(),{ok:true}));
 ipcMain.handle('protection-preview', async (_, payload) => {
  try {
    if (!payload || !Array.isArray(payload.files)) {
      return { ok: false, error: 'Payload inválido' };
    }

    return {
      ok: true,
      totalFiles: payload.files.length
    };

  } catch {
    return { ok: false, error: 'Falha no preview' };
  }
});
ipcMain.handle('protection-apply', async (_, payload) => {
  try {
    const { files, targetFolder, actor } = payload || {};

    if (!files || !Array.isArray(files) || !targetFolder) {
      return { ok: false, error: 'Dados insuficientes' };
    }

    return await ProtectionService.protectFiles({
      files,
      targetFolder,
      actor
    });

  } catch (e) {
    console.error('[PROTECTION ERROR]', e);
    return { ok: false, error: e.message };
  }
});
app.whenReady().then(()=>{
  AuthState.init();
  createWindow();
});

app.on('window-all-closed', ()=>app.quit());
