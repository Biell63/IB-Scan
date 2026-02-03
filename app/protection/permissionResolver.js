const os = require('os');

async function resolve() {
  const hostname = os.hostname();
  const isDomain = hostname.includes('.') || hostname.length > 15;
  if (!isDomain) {
    return {
      mode: 'LOCAL',
      target: os.userInfo().username
    };
  }
  return {
    mode: 'CORPORATIVO',
    target: null 
  };
}
module.exports = { resolve };
