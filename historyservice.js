const fs = require('fs');
const path = require('path');
const STORE_PATH = path.join(__dirname, 'historyStore.json');
const MAX_HISTORY = 12;
function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, '[]', 'utf8');
  }
}
function read() {
  ensureStore();
  try {
    const data = fs.readFileSync(STORE_PATH, 'utf8');
    return Array.isArray(JSON.parse(data)) ? JSON.parse(data) : [];
  } catch (err) {
    console.error('[HISTORY READ ERROR]', err);
    return [];
  }
}
function write(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}
function add(entry) {
  const history = read();
  history.unshift({
    ...entry,
    id: String(entry.id)
  });

  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }

  write(history);
}
function getById(id) {
  return read().find(h => String(h.id) === String(id)) || null;
}
function clear() {
  write([]);
}
module.exports = {
  read,        
  add,
  getById,
  clear
};
