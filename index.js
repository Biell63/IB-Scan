const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const exif = require('exif-parser');
const PDFDocument = require('pdfkit');
const MAX_DEPTH = 6;
const IGNORE_DIRS = new Set([
  'Windows','Program Files','Program Files (x86)','ProgramData','AppData'
]);
const RISK = { ALTO:'ALTO', MEDIO:'MEDIO', BAIXO:'BAIXO' };
const PATTERNS = {
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  rg: /(rg|registro geral)[^\d]{0,10}\d{7,9}/gi,
  phone: /\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/g,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  address: /\b(rua|avenida|av\.|travessa|praça|alameda)\s+[a-zà-ú\s]+,?\s?\d{1,5}/gi,
  medical: /(paciente|prontu[aá]rio|laudo|exame|diagn[oó]stico|cid|crm)/gi
};
let results, stats, visited, totalFiles, processedFiles;
function countFiles(dir, depth = 0) {
  if (depth > MAX_DEPTH) return 0;
  let count = 0;
  let items;
  try { items = fs.readdirSync(dir); } catch { return 0; }
  for (const name of items) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    stat.isDirectory()
      ? count += countFiles(full, depth + 1)
      : count++;
  }
  return count;
}
async function scanDir(dir, depth = 0, onProgress) {
  if (depth > MAX_DEPTH) return;
  let real;
  try { real = fs.realpathSync(dir); } catch { return; }
  if (visited.has(real)) return;
  visited.add(real);
  let items;
  try { items = fs.readdirSync(dir); } catch { return; }
  for (const name of items) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      await scanDir(full, depth + 1, onProgress);
    } else {
      await analyzeFile(full);
      processedFiles++;
      onProgress && onProgress({ processed: processedFiles, total: totalFiles });
    }
  }
}
async function analyzeFile(file) {
  stats.analyzed++;
  const ext = path.extname(file).toLowerCase();
  if (['.png','.jpg','.jpeg'].includes(ext)) return analyzeImage(file);
  if (!['.txt','.csv','.pdf','.doc','.docx','.xls','.xlsx'].includes(ext)) {
    stats.byRisk.BAIXO++;
    return;
  }
  const text = await extractText(file, ext);
  if (!text || text.length < 20) {
    stats.byRisk.BAIXO++;
    return;
  }
  detectText(text, file);
}
async function extractText(file, ext) {
  try {
    if (ext === '.txt' || ext === '.csv') return fs.readFileSync(file, 'utf8');
    if (ext === '.pdf') return (await pdfParse(fs.readFileSync(file))).text || '';
    if (ext === '.doc' || ext === '.docx')
      return (await mammoth.extractRawText({ path: file })).value || '';
    if (ext === '.xls' || ext === '.xlsx') {
      const wb = xlsx.readFile(file);
      return wb.SheetNames.map(s => xlsx.utils.sheet_to_csv(wb.Sheets[s])).join('\n');
    }
  } catch {}
  return '';
}
function detectText(text, file) {
  let risk = RISK.BAIXO;
  const findings = [];
  const match = p => text.match(p) || [];
  if (match(PATTERNS.cpf).length) risk = RISK.ALTO, findings.push({ label:'CPF', description:'CPF encontrado' });
  if (match(PATTERNS.rg).length) risk = RISK.ALTO, findings.push({ label:'RG', description:'RG encontrado' });
  if (match(PATTERNS.medical).length) risk = RISK.ALTO, findings.push({ label:'Dados médicos', description:'Informação médica' });
  if (risk !== RISK.ALTO && match(PATTERNS.phone).length) risk = RISK.MEDIO;
  if (risk !== RISK.ALTO && match(PATTERNS.email).length) risk = RISK.MEDIO;
  if (risk !== RISK.ALTO && match(PATTERNS.address).length) risk = RISK.MEDIO;
  if (!findings.length) {
    stats.byRisk.BAIXO++;
    return;
  }
  results.push({ file, folder: path.dirname(file), risk, findings });
  stats.compromised++;
  stats.byRisk[risk]++;
}

function analyzeImage(file) {
  try {
    const data = exif.create(fs.readFileSync(file)).parse();
    if (!data.tags || !Object.keys(data.tags).length) {
      stats.byRisk.BAIXO++;
      return;
    }
    results.push({
      file,
      folder: path.dirname(file),
      risk: RISK.MEDIO,
      findings: [{ label:'Metadados', description:'Imagem contém EXIF' }]
    });
    stats.compromised++;
    stats.byRisk.MEDIO++;
  } catch {
    stats.byRisk.BAIXO++;
  }
}

function generateReports(result, baseFolder) {
  const reportsDir = path.join(baseFolder, 'IBSCAN_REPORTS');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);
  const pdfPath = path.join(
    reportsDir,
    `IBSCAN_RELATORIO_${Date.now()}.pdf`
  );

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(pdfPath));
  doc.fontSize(20).text('IB SCAN — RELATÓRIO DE AUDITORIA', { align:'center' });
  doc.moveDown();
  doc.fontSize(12)
    .text(`Data: ${new Date().toLocaleString()}`)
    .text(`Arquivos analisados: ${result.summary.analyzed}`)
    .text(`Arquivos com risco: ${result.summary.compromised}`);
  doc.moveDown().text('Resumo de Riscos:');
  Object.entries(result.summary.byRisk).forEach(
    ([k,v]) => doc.text(`• ${k}: ${v}`)
  );
  doc.addPage().fontSize(14).text('Detalhamento:', { underline:true });
  result.findings.forEach(f => {
    doc.moveDown()
      .fontSize(12).text(`Arquivo: ${f.file}`)
      .text(`Risco: ${f.risk}`);
    f.findings.forEach(x => doc.text(` - ${x.label}: ${x.description}`));
  });
  doc.end();
  return { ok:true, pdfPath, folder:reportsDir };
}
module.exports = {
  async run(folder, onProgress = null) {
    results = [];
    visited = new Set();
    processedFiles = 0;
    stats = { analyzed:0, compromised:0, byRisk:{ ALTO:0, MEDIO:0, BAIXO:0 } };
    totalFiles = countFiles(folder);
    await scanDir(folder, 0, onProgress);
    return { summary:stats, findings:results };
  },
  generateReports
};
