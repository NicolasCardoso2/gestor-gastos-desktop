const { app, BrowserWindow, ipcMain, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

/* =================(CONFIGURAÇÕES GLOBAIS)================= */
// Banco agora fica na pasta userData para funcionar no app empacotado (gravável)
// Ex.: C:\Users\\<usuario>\\AppData\\Roaming\\Gestor de Gastos
const DB_PATH = path.join(app.getPath('userData'), 'database.db');
let db = null;

/* =================(INICIALIZAÇÃO DO BANCO)================= */
async function checkExistingDatabase() {
    const userDataPath = app.getPath('userData');
    const dbExists = fs.existsSync(DB_PATH);
    
    if (!dbExists) {
        console.log('Primeira execução - criando novo banco de dados.');
        return 'create_new';
    }
    
    // Verifica se o banco tem dados
    try {
        const tempDb = new Database(DB_PATH, { readonly: true });
        const boletoCount = tempDb.prepare('SELECT COUNT(*) as count FROM boletos').get();
        const gastoCount = tempDb.prepare('SELECT COUNT(*) as count FROM gastos').get();
        tempDb.close();
        
        const hasData = (boletoCount.count > 0 || gastoCount.count > 0);
        
        if (!hasData) {
            console.log('Banco existe mas está vazio - usando banco existente.');
            return 'use_existing';
        }
        
        // Mostra dialog para o usuário escolher
        const result = await dialog.showMessageBox(null, {
            type: 'question',
            buttons: [
                'Manter Dados Existentes',
                'Criar Backup e Começar Novo',
                'Substituir por Dados Antigos',
                'Cancelar'
            ],
            defaultId: 0,
            title: 'Gestor de Gastos - Dados Encontrados',
            message: 'Dados existentes foram encontrados!',
            detail: `Encontrados:\n• ${boletoCount.count} boletos\n• ${gastoCount.count} gastos\n\nO que deseja fazer?`,
            noLink: true,
            cancelId: 3
        });
        
        switch (result.response) {
            case 0: return 'use_existing';
            case 1: return 'backup_and_new';
            case 2: return 'import_old';
            case 3: 
            default: return 'cancel';
        }
        
    } catch (error) {
        console.log('Erro ao verificar banco existente, criando novo:', error);
        return 'create_new';
    }
}

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(app.getPath('userData'), `database_backup_${timestamp}.db`);
    
    try {
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`Backup criado em: ${backupPath}`);
        
        await dialog.showMessageBox(null, {
            type: 'info',
            title: 'Backup Criado',
            message: 'Backup dos dados criado com sucesso!',
            detail: `Seus dados foram salvos em:\n${backupPath}\n\nVocê pode usar este arquivo para restaurar seus dados mais tarde.`,
            buttons: ['OK']
        });
        
        return backupPath;
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        return null;
    }
}

async function importOldDatabase() {
    const result = await dialog.showOpenDialog(null, {
        title: 'Selecionar Banco de Dados Antigo',
        filters: [
            { name: 'Banco de Dados', extensions: ['db', 'sqlite', 'sqlite3'] },
            { name: 'Todos os Arquivos', extensions: ['*'] }
        ],
        properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
        return false;
    }
    
    const oldDbPath = result.filePaths[0];
    
    try {
        // Cria backup do banco atual se existir
        if (fs.existsSync(DB_PATH)) {
            await createBackup();
        }
        
        // Copia o banco antigo
        fs.copyFileSync(oldDbPath, DB_PATH);
        
        await dialog.showMessageBox(null, {
            type: 'info',
            title: 'Importação Concluída',
            message: 'Dados importados com sucesso!',
            detail: 'Seus dados antigos foram restaurados.',
            buttons: ['OK']
        });
        
        return true;
    } catch (error) {
        console.error('Erro ao importar banco antigo:', error);
        await dialog.showErrorBox('Erro na Importação', 'Não foi possível importar o banco de dados selecionado.');
        return false;
    }
}

function initializeDatabase() {
    try {
        db = new Database(DB_PATH);
        console.log('Conexão com banco de dados estabelecida.');
        
        // Criação das tabelas
        const tables = [
            `CREATE TABLE IF NOT EXISTS boletos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL,
                nome TEXT NOT NULL,
                valor REAL NOT NULL,
                data TEXT NOT NULL,
                obs TEXT,
                repeticao TEXT DEFAULT 'unica',
                alerta INTEGER,
                status TEXT DEFAULT 'Pendente'
            )`,
            `CREATE TABLE IF NOT EXISTS gastos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                descricao TEXT,
                valor REAL NOT NULL,
                categoria TEXT,
                pessoa TEXT
            )`
        ];
        
        tables.forEach(sql => db.exec(sql));
        console.log('Tabelas verificadas/criadas com sucesso.');
        return true;
    } catch (error) {
        console.error('Erro crítico ao inicializar banco:', error);
        return false;
    }
}

/* =================(GERENCIAMENTO DE JANELA)================= */
function createWindow() {
    // Remove o menu padrão do Electron (File/Edit/View/Window/Help)
    Menu.setApplicationMenu(null);

    // Define ícone da janela: em dev usa build/icon.ico; em produção o executável já contém o ícone.
    const devIco = path.join(__dirname, 'build', 'icon.ico');
    const devIcon = nativeImage.createFromPath(devIco);
    const winIcon = devIcon.isEmpty() ? undefined : devIcon;

    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: winIcon,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Garante que o menu não re-apareça com ALT
    mainWindow.setMenuBarVisibility(false);

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

/* =================(UTILITÁRIOS DE BANCO)================= */
const dbHandler = (operation, sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        return operation === 'get' ? stmt.all(...params) : stmt.run(...params);
    } catch (error) {
        console.error(`Erro na operação ${operation}:`, error);
        return operation === 'get' ? [] : { success: false, error: error.message };
    }
};

/* =================(HANDLERS IPC - GASTOS)================= */
const gastosHandlers = {
    'get-gastos': () => dbHandler('get', 'SELECT * FROM gastos ORDER BY data DESC'),
    
    'add-gasto': (event, gasto) => {
        const result = dbHandler('run', 
            'INSERT INTO gastos (data, descricao, valor, categoria, pessoa) VALUES (?, ?, ?, ?, ?)',
            [gasto.data, gasto.descricao, gasto.valor, gasto.categoria, gasto.pessoa]
        );
        return result.success === false ? result : { success: true, id: result.lastInsertRowid };
    },
    
    'update-gasto': (event, gasto) => {
        const result = dbHandler('run',
            'UPDATE gastos SET data=?, descricao=?, valor=?, categoria=?, pessoa=? WHERE id=?',
            [gasto.data, gasto.descricao, gasto.valor, gasto.categoria, gasto.pessoa, gasto.id]
        );
        return result.success === false ? result : { success: true, changes: result.changes };
    }
};

/* =================(HANDLERS IPC - BOLETOS)================= */
const boletosHandlers = {
    'get-boletos': () => dbHandler('get', 'SELECT * FROM boletos ORDER BY data DESC'),
    
    'add-boleto': (event, boleto) => {
        const { tipo, nome, valor, data, obs = '', repeticao = 'unica', alerta = null, status = 'Pendente' } = boleto;
        const result = dbHandler('run',
            'INSERT INTO boletos (tipo, nome, valor, data, obs, repeticao, alerta, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [tipo, nome, valor, data, obs, repeticao, alerta, status]
        );
        return result.success === false ? result : { success: true, id: result.lastInsertRowid };
    },
    
    'update-boleto': (event, boleto) => {
        const { tipo, nome, valor, data, obs = '', repeticao = 'unica', alerta = null, status = 'Pendente', id } = boleto;
        const result = dbHandler('run',
            'UPDATE boletos SET tipo=?, nome=?, valor=?, data=?, obs=?, repeticao=?, alerta=?, status=? WHERE id=?',
            [tipo, nome, valor, data, obs, repeticao, alerta, status, id]
        );
        return result.success === false ? result : { success: true, changes: result.changes };
    },
    
    'delete-boleto': (event, id) => {
        const result = dbHandler('run', 'DELETE FROM boletos WHERE id = ?', [id]);
        return result.success === false ? result : { success: true, changes: result.changes };
    }
};

/* =================(HANDLERS IPC - BACKUP/RESTORE)================= */
const backupHandlers = {
    'create-backup': async () => {
        const backupPath = await createBackup();
        return { success: !!backupPath, path: backupPath };
    },
    
    'import-database': async () => {
        const imported = await importOldDatabase();
        if (imported) {
            // Reinicializa o banco após importação
            db?.close();
            if (!initializeDatabase()) {
                return { success: false, error: 'Falha ao reinicializar banco após importação' };
            }
        }
        return { success: imported };
    },
    
    'export-database': async () => {
        const result = await dialog.showSaveDialog(null, {
            title: 'Exportar Banco de Dados',
            defaultPath: `gestor-gastos-${new Date().toISOString().slice(0, 10)}.db`,
            filters: [
                { name: 'Banco de Dados', extensions: ['db'] },
                { name: 'Todos os Arquivos', extensions: ['*'] }
            ]
        });
        
        if (result.canceled) {
            return { success: false, cancelled: true };
        }
        
        try {
            fs.copyFileSync(DB_PATH, result.filePath);
            return { success: true, path: result.filePath };
        } catch (error) {
            console.error('Erro ao exportar banco:', error);
            return { success: false, error: error.message };
        }
    }
};

/* =================(REGISTRO DE HANDLERS IPC)================= */
function registerIpcHandlers() {
    // Registra todos os handlers de gastos
    Object.entries(gastosHandlers).forEach(([channel, handler]) => {
        ipcMain.handle(channel, handler);
    });
    
    // Registra todos os handlers de boletos
    Object.entries(boletosHandlers).forEach(([channel, handler]) => {
        ipcMain.handle(channel, handler);
    });
    
    // Registra handlers de backup/restore
    Object.entries(backupHandlers).forEach(([channel, handler]) => {
        ipcMain.handle(channel, handler);
    });

    // Handler temporário para screenshots do README
    ipcMain.handle('take-screenshot', async (event, filename) => {
        const win = BrowserWindow.getAllWindows()[0];
        if (!win) return { success: false };
        const image = await win.webContents.capturePage();
        const savePath = path.join(__dirname, 'docs', filename);
        fs.writeFileSync(savePath, image.toPNG());
        return { success: true, path: savePath };
    });
}

/* =================(INICIALIZAÇÃO DO APP)================= */
app.whenReady().then(async () => {
    // Define App User Model ID no Windows para fixar ícone na barra de tarefas
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.edson.gestorgastos');
    }

    // Verifica banco existente e pergunta ao usuário o que fazer
    const dbAction = await checkExistingDatabase();
    
    switch (dbAction) {
        case 'cancel':
            app.quit();
            return;
            
        case 'backup_and_new':
            await createBackup();
            // Remove o banco atual para criar um novo
            if (fs.existsSync(DB_PATH)) {
                fs.unlinkSync(DB_PATH);
            }
            break;
            
        case 'import_old':
            const imported = await importOldDatabase();
            if (!imported) {
                app.quit();
                return;
            }
            break;
            
        case 'use_existing':
        case 'create_new':
        default:
            // Continua normalmente
            break;
    }

    if (!initializeDatabase()) {
        console.error('Não foi possível inicializar o banco de dados.');
        process.exit(1);
    }
    
    registerIpcHandlers();
    createWindow();
});

/* =================(EVENTOS DO APP)================= */
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        db?.close();
        app.quit();
    }
});

app.on('before-quit', () => {
    db?.close();
});