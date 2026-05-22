const { contextBridge, ipcRenderer } = require('electron');

/* =================(API CONFIGURATION)================= */
// Expõe uma API segura para o processo de renderização
contextBridge.exposeInMainWorld('api', {
  /* =================(GASTOS OPERATIONS)================= */
  // Operações relacionadas a gastos
  gastos: {
    get: () => ipcRenderer.invoke('get-gastos'),
    add: (gasto) => ipcRenderer.invoke('add-gasto', gasto),
    update: (gasto) => ipcRenderer.invoke('update-gasto', gasto)
  },
  
  /* =================(BOLETOS OPERATIONS)================= */
  // Operações relacionadas a boletos
  boletos: {
    get: () => ipcRenderer.invoke('get-boletos'),
    add: (boleto) => ipcRenderer.invoke('add-boleto', boleto),
    update: (boleto) => ipcRenderer.invoke('update-boleto', boleto),
    delete: (id) => ipcRenderer.invoke('delete-boleto', id)
  },
  
  /* =================(BACKUP/RESTORE OPERATIONS)================= */
  // Operações de backup e restauração
  backup: {
    create: () => ipcRenderer.invoke('create-backup'),
    import: () => ipcRenderer.invoke('import-database'),
    export: () => ipcRenderer.invoke('export-database')
  },

  /* =================(SCREENSHOT - README)================= */
  screenshot: {
    capture: (filename) => ipcRenderer.invoke('take-screenshot', filename)
  }
});