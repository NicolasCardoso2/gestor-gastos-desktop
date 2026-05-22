/**
 * Script Electron autônomo para capturar screenshots do app para o README.
 * Uso: npx electron scripts/screenshot.js
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const DOCS     = path.join(__dirname, '..', 'docs');
const RENDERER = path.join(__dirname, '..', 'renderer', 'index.html');
const PRELOAD  = path.join(__dirname, 'preload-mock.js');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function capture(win, filename) {
  await wait(700);
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(DOCS, filename), img.toPNG());
  console.log(`Salvo: ${filename}`);
}

async function js(win, code) {
  return win.webContents.executeJavaScript(code);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280, height: 800, show: true,
    webPreferences: { preload: PRELOAD, contextIsolation: true, nodeIntegration: false }
  });

  await win.loadFile(RENDERER);
  await wait(2000);

  // 1. Tela principal - Calendário
  await capture(win, '01-tela-principal.png');

  // 2. Modal de boletos (abre clicando no dia de hoje)
  await js(win, `document.querySelector('.day.today')?.click()`);
  await capture(win, '02-modal-boletos.png');

  // 3. Formulário de adicionar boleto
  await js(win, `document.getElementById('add-boleto-btn')?.click()`);
  await capture(win, '03-formulario-boleto.png');

  // Fecha modal
  await js(win, `document.getElementById('close-modal')?.click()`);
  await wait(400);

  // 4. Relatório Mensal
  await js(win, `document.getElementById('nav-report')?.click()`);
  await capture(win, '04-relatorio-mensal.png');

  // 5. Modal de Configurações
  await js(win, `document.getElementById('settings-btn')?.click()`);
  await capture(win, '05-configuracoes.png');

  console.log('\nTodos os screenshots salvos em:', DOCS);
  app.quit();
});

app.on('window-all-closed', () => app.quit());



