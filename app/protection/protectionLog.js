const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'protection.log');

function record(entry) {
  const line = JSON.stringify({
    ...entry,
    date: new Date().toISOString()
  });

  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

module.exports = { record };
