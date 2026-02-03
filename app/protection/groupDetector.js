// groupDetector.js
// Lista grupos do ambiente corporativo (stub inicial)

async function listGroups() {
    // IMPLEMENTAÇÃO FUTURA:
    // - PowerShell (Windows)
    // - LDAP (Linux)
    return [];
  }
  
  function suggestGroups(groups, keywords = []) {
    if (!keywords.length) return [];
  
    return groups.filter(g =>
      keywords.some(k =>
        g.toLowerCase().includes(k.toLowerCase())
      )
    );
  }
  
  module.exports = {
    listGroups,
    suggestGroups
  };
  