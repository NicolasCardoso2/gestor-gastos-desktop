<div align="center">

# Gestão Financeira Desktop

**Controle financeiro pessoal com calendário interativo, relatórios e backup automático.**

[![Electron](https://img.shields.io/badge/Electron_31-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat-square&logo=windows&logoColor=white)](https://www.microsoft.com/windows)

> Aplicativo desktop para controle de boletos e gastos do mês. Calendário visual, relatórios com gráfico e backup local, tudo sem depender de internet.

</div>

---

## O que o app faz

### Calendário Interativo
- Visualização mensal com destaque nos dias que têm boletos cadastrados
- Navegação por mês com setas
- Clique em qualquer dia para adicionar ou visualizar lançamentos

### Relatório Mensal
- Tabela com gastos diários do período selecionado
- Resumo com total do mês, média diária e maior gasto
- Gráfico de pizza com a distribuição por categoria
- Filtro por mês e ano para consultar o histórico

### Gestão de Boletos
- Categorias: Água, Luz, Internet, Telefone, Aluguel, Cartão, Imposto, Contadora, Outros
- Repetição mensal automática para boletos fixos
- Campo de observações e alertas por lançamento

### Backup e Segurança
- Backup manual com um clique
- Importação de backups anteriores
- Banco de dados criado automaticamente em `%APPDATA%/Gestão Financeira Desktop/database.db`

---

## Como rodar

Você precisa ter o **Node.js 18 ou superior** instalado.

```bash
git clone https://github.com/NicolasCardoso2/gestao-financeira-desktop.git
cd gestao-financeira-desktop
npm install
npm start
```

| Script | O que faz |
|---|---|
| `npm start` | Abre o app em modo desenvolvimento |
| `npm run dist` | Gera o instalador `.exe` na pasta `dist/` |
| `npm run clean` | Remove arquivos temporários |

---

## Estrutura do projeto

```
gestao-financeira-desktop/
├── assets/          # Ícones e recursos
├── renderer/        # Interface (HTML, CSS e JS)
│   ├── index.html
│   ├── renderer.js
│   └── styles.css
├── main.js          # Processo principal do Electron
├── preload.js       # Ponte segura entre main e renderer
└── package.json
```

---

## Capturas de Tela

### Figura 1 - Tela Principal
![Calendário interativo com destaque nos dias com boletos](./docs/01-tela-principal.png)

### Figura 2 - Modal de Boletos
![Modal que abre ao clicar em um dia do calendário](./docs/02-modal-boletos.png)

### Figura 3 - Formulário de Boleto
![Formulário de cadastro de boleto com campo de valor em reais](./docs/03-formulario-boleto.png)

### Figura 4 - Relatório Mensal
![Relatório mensal com tabela de gastos e gráfico de pizza](./docs/04-relatorio-mensal.png)

### Figura 5 - Configurações
![Modal de configurações com opções de backup](./docs/05-configuracoes.png)

---

## Tecnologias usadas

| Tecnologia | Função |
|---|---|
| **Electron 31** | Framework para apps desktop com JS |
| **SQLite** | Banco de dados local, sem precisar de servidor |
| **Chart.js** | Gráficos do relatório mensal |
| **Node.js 18** | Runtime JavaScript |
| **HTML, CSS e JS** | Interface do usuário (ES6+) |

---

<div align="center">

Feito por [Nicolas Cardoso](https://github.com/NicolasCardoso2) - [LinkedIn](https://www.linkedin.com/in/nicolas-cardoso-vilha-do-lago-2483b1322/)

</div>

