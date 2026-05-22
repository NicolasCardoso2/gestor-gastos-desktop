// Preload mock para o script de screenshots - expõe window.api sem backend real
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  boletos: {
    get:    () => Promise.resolve([]),
    add:    () => Promise.resolve({ id: 1 }),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  gastos: {
    get:    () => Promise.resolve([]),
    add:    () => Promise.resolve({ id: 1 }),
    update: () => Promise.resolve({})
  },
  backup: {
    create: () => Promise.resolve({ success: true }),
    import: () => Promise.resolve({ cancelled: true }),
    export: () => Promise.resolve({ cancelled: true })
  },
  screenshot: {
    capture: () => Promise.resolve({})
  }
});
