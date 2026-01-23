🛡️ IB Scan 

IB Scan é uma aplicação desktop desenvolvida em Electron + Node.js para análise técnica de arquivos e diretórios, com foco em auditoria, identificação de riscos e geração de relatórios executivos em PDF com integridade criptográfica. 
O projeto simula o funcionamento de uma ferramenta corporativa de auditoria, priorizando segurança, rastreabilidade, isolamento de contexto e operação responsável.

📌 Visão Geral

Com o IB Scan, o usuário pode:

📁 Selecionar diretórios do sistema

🔍 Executar varreduras somente em modo leitura

⚠️ Classificar riscos em ALTO / MÉDIO / BAIXO

📊 Acompanhar o progresso em tempo real

🗃️ Armazenar histórico local de auditorias

📄 Gerar relatórios profissionais em PDF

🔐 Aplicar medidas de proteção apenas com confirmação explícita

Nenhuma ação destrutiva ou corretiva é executada automaticamente.

🧠 Funcionamento Geral

O usuário seleciona um diretório
O scanner analisa os arquivos com base em regras internas
Os achados são classificados por nível de risco
Um resumo executivo é gerado
Os resultados podem ser:
Consultados no histórico
Exportados em PDF
Usados como base para ações manuais de proteção

🗂️ Estrutura do Projeto

├── app
│   ├── auth
│   │   ├── authCrypto.js        # Criptografia de credenciais
│   │   ├── authState.js         # Estado de autenticação
│   │   └── authStore.js         # Persistência local
│   │
│   ├── history
│   │   ├── historyIpc.js        # Comunicação IPC
│   │   ├── historyService.js   # Leitura / gravação de auditorias
│   │   └── historyStore.json   # Base local de histórico
│   │
│   ├── protection
│   │   ├── aclApplier.js        # Aplicação de permissões
│   │   ├── groupDetector.js     # Detecção de grupos
│   │   ├── permissionResolver.js
│   │   ├── protectionService.js
│   │   └── protectionLog.js    # Log de ações
│   │
│   ├── scanner
│   │   └── index.js             # Motor principal de varredura
│   │
│   ├── ui
│   │   ├── index.html           # Interface
│   │   ├── styles.css           # Estilos
│   │   └── main.js              # Lógica do front-end
│   │
│   └── state.js                 # Estado global da aplicação
│
├── assets
│   └── logo.png
│
├── preload.js                   # Ponte IPC segura
├── main.js                      # Processo principal (Electron)
├── package.json
└── package-lock.json

🗂️ Estrutura do Projeto
