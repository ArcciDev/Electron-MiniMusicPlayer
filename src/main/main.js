//IPC Inter-Process Communication, comunica el frontend con el backend

//renderer llama, preload usa, ipcmain.handle recibe y responde

const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { setupDownloader } = require('./services/downloader');
const { getAudioStreamUrl, searchYouTube } = require('./services/streamer');

// Configuración de la aplicación
let downloadPath = path.join(app.getPath('music')); // Ruta predeterminada para las descargas

//función para crear una ventana
const createWindow = () => {
    const window = new BrowserWindow({
        //relacion de aspecto al ejecutar la pantalla
        width: 1024,
        height: 700,

        //minimo a lo que puede quedar la relacion de aspecto
        minWidth: 800,
        minHeight: 600,
        
        // Opciones visuales y de seguridad para la ventana
        frame: false, // Sin borde nativo para personalización completa
        transparent: false,
        backgroundColor: '#1a1d23',
        autoHideMenuBar: true,

        //puente entre procesos, permitiendo conectar interfaz con
        //funciones de Node.js, ademas de proteger la app
        //de accesos no deseados
        webPreferences: {
          preload: path.join(__dirname, '..', 'preload', 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
        }
    })

    //archivo a cargar para esta ventana
    window.loadFile(path.join(__dirname, '..', 'renderer', 'index-modern.html'))
    
    // Abrir devtools en desarrollo
    if (process.env.NODE_ENV === 'development') {
      window.webContents.openDevTools();
    }
}

//cuando la aplicación este lista, crea la ventana
app.whenReady().then(() => {
    createWindow()
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Cerrar la aplicación cuando todas las ventanas estén cerradas (en macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// Handlers de IPC para la funcionalidad principal
ipcMain.handle('descargar-audio', async (event, url) => {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error('La URL proporcionada no es válida');
    }
    return await setupDownloader(url, downloadPath);
  } catch (error) {
    console.error('Error en descargar-audio:', error);
    throw error;
  }
})

// Handler para obtener la URL de streaming
ipcMain.handle('obtener-stream', async (event, url) => {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error('La URL proporcionada no es válida');
    }
    console.log('Solicitud de streaming para URL:', url);
    return await getAudioStreamUrl(url);
  } catch (error) {
    console.error('Error en obtener-stream:', error);
    throw error;
  }
})

// Handler para la búsqueda de YouTube
ipcMain.handle('buscar-youtube', async (event, searchTerm) => {
  try {
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
      throw new Error('El término de búsqueda no es válido');
    }
    console.log('Solicitud de búsqueda para:', searchTerm);
    return await searchYouTube(searchTerm);
  } catch (error) {
    console.error('Error en buscar-youtube:', error);
    throw error;
  }
})

// Handlers de IPC para controles de ventana
ipcMain.handle('minimize-window', (event) => {
  BrowserWindow.fromWebContents(event.sender).minimize();
  return true;
})

ipcMain.handle('maximize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
  return window.isMaximized();
})

ipcMain.handle('close-window', (event) => {
  BrowserWindow.fromWebContents(event.sender).close();
  return true;
})

// Handlers de IPC para configuración de la aplicación
ipcMain.handle('select-directory', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Seleccionar carpeta de destino para las descargas',
    defaultPath: downloadPath
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    downloadPath = result.filePaths[0];
    return downloadPath;
  }
  
  return null;
})

ipcMain.handle('get-download-path', () => {
  return downloadPath;
})
