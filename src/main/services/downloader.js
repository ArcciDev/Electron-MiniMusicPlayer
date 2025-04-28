//importa modulos
const path = require('path'); //sirve para trbajar con rutas de ficheros
const ytdlp = require('yt-dlp-exec'); //libreria de node.js para youtube
const fs = require('fs'); // Para operaciones con el sistema de archivos

// Cambiamos la función para que maneje la descarga con un path personalizable
async function setupDownloader(url, downloadPath) {
    try {
        // Verificar que la URL sea válida
        if (!url || typeof url !== 'string' || url.trim() === '') {
          throw new Error('La URL proporcionada no es válida');
        }
        
        // Si no se proporciona una ruta, usar la ruta predeterminada
        const targetPath = downloadPath || path.join(__dirname, '..', '..', 'assets', 'downloads');
        
        // Asegurarse de que el directorio existe
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }
        
        console.log('Descargando desde URL:', url);
        console.log('Ruta de destino:', targetPath);
        
        const result = await ytdlp(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0, // 0 es la mejor calidad
            output: path.join(targetPath, '%(title)s.%(ext)s'),
            noCheckCertificates: true,
            preferFreeFormats: true,
            noCallHome: true,
            noWarnings: true
        });
        
        return 'Descarga completada';
    } catch (error) {
        console.error('Error en la descarga:', error);
        return `Error: ${error.message}`;
    }
}

module.exports = { setupDownloader }