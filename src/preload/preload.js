const { contextBridge, ipcRenderer } = require('electron');

// API para descargar MP3
contextBridge.exposeInMainWorld('ApiDescargarMP3', {
  descargarAudio: (url) => ipcRenderer.invoke('descargar-audio', url)
});

// API para streaming y búsqueda
contextBridge.exposeInMainWorld('ApiStreaming', {
  obtenerStreamUrl: (url) => ipcRenderer.invoke('obtener-stream', url),
  buscarYouTube: (searchTerm) => ipcRenderer.invoke('buscar-youtube', searchTerm)
});

// Nueva API para integración con Electron
contextBridge.exposeInMainWorld('ApiElectron', {
  // Controles de ventana
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Configuración de la aplicación
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDownloadPath: () => ipcRenderer.invoke('get-download-path')
});

