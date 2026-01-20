🛡️ IB Scan — Intelligent Binary Scan

IB Scan é uma aplicação desktop desenvolvida em Electron + Node.js, voltada para auditoria técnica de arquivos e diretórios, com foco em identificação de riscos, classificação de achados e geração de relatórios executivos em PDF com integridade criptográfica.

O projeto foi estruturado seguindo princípios de segurança, isolamento de contexto, rastreabilidade e responsabilidade operacional, simulando um ambiente de ferramenta corporativa de análise.

📌 Visão Geral

O IB Scan permite que o usuário:

Selecione uma pasta do sistema

Execute uma varredura técnica somente em modo leitura

Classifique riscos em ALTO / MÉDIO / BAIXO

Visualize progresso em tempo real

Armazene histórico de auditorias localmente

Exporte relatórios profissionais em PDF

Aplique medidas opcionais de proteção, somente após confirmação explícita

Nenhuma ação destrutiva ou corretiva é aplicada automaticamente.

🧠 Funcionamento Geral

O usuário seleciona um diretório

O scanner analisa arquivos conforme regras internas

Os achados são classificados por nível de risco

Um resumo executivo é gerado

O resultado pode ser:

Consultado no histórico

Exportado em PDF

Usado como base para ações manuais de proteção

🗂️ Estrutura do Projeto
├── app
│   ├── auth
│   │   ├── authCrypto.js      # Criptografia de credenciais
│   │   ├── authState.js       # Estado de autenticação
│   │   └── authStore.js       # Persistência local
│   │
│   ├── history
│   │   ├── historyipc.js      # Comunicação IPC
│   │   ├── historyservice.js # Leitura / gravação de auditorias
│   │   └── historystore.json # Base local de histórico
│   │
│   ├── protection
│   │   ├── aclApplier.js     # Aplicação de permissões
│   │   ├── groupDetector.js  # Detecção de grupos
│   │   ├── permissionResolver.js
│   │   ├── protectionService.js
│   │   └── protectionLog.js  # Log de ações
│   │
│   └── state.js              # Estado global da aplicação
│
├── scanner
│   └── index.js              # Motor principal de varredura
│
├── ui
│   ├── index.html            # Interface
│   ├── styles.css            # Estilos
│   └── main.js               # Lógica do front-end
│
├── assets
│   └── logo.png
│
├── preload.js                # Ponte segura IPC
├── main.js                   # Processo principal (Electron)
├── package.json
└── package-lock.json

⚙️ Destaques Técnicos
🔐 Segurança

contextIsolation: true

sandbox: true

nodeIntegration: false

Comunicação via IPC controlado

Sem acesso direto ao Node no frontend

📄 Relatórios Profissionais

Geração de PDF via printToPDF

HTML dinâmico com:

Gráfico de risco (SVG)

Sumário executivo automático

Lista detalhada de arquivos

Assinatura criptográfica SHA-256

Código de integridade único por relatório

🕵️ Auditoria Responsável

Modo padrão: somente leitura

Proteção ativa:

Exige confirmação explícita

Totalmente opcional

Registrada em log

🔁 Fluxo de Execução (Simplificado)
Usuário
  ↓
Seleciona pasta
  ↓
Scanner analisa arquivos
  ↓
Classificação de riscos
  ↓
Histórico salvo localmente
  ↓
[Opcional]
Exportar PDF
Aplicar proteção

📜 Aviso Legal

O IB Scan realiza análises técnicas automatizadas, baseadas exclusivamente nos arquivos acessíveis no momento da execução.

A ferramenta não garante a detecção de todos os riscos existentes e não substitui auditorias formais, perícias técnicas ou pareceres jurídicos.

O uso da aplicação implica ciência e concordância com essas condições.
Usado como base para ações manuais de proteção

🗂️ Estrutura do Projeto
