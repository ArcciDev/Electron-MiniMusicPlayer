const ytdlp = require('yt-dlp-exec');

/**
 * Obtiene la URL de streaming directa para un video de YouTube
 * @param {string} url - URL del video
 * @returns {Promise<string>} URL directa para streaming
 */
async function getAudioStreamUrl(url) {
  try {
    // Verificar que la URL sea válida
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error('La URL proporcionada no es válida');
    }
    
    console.log('Obteniendo stream para URL:', url);
    
    // Obtenemos la información del video en formato JSON
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      noCheckCertificates: true,
      extractAudio: true,
      format: 'bestaudio'
    });
    
    if (!info) {
      throw new Error('No se pudo obtener información del video');
    }
    
    console.log('Información de video obtenida, procesando formatos...');
    
    // Buscamos el formato que sea solo audio con la mejor calidad
    const audioFormats = info.formats.filter(format => 
      format.acodec !== 'none' && (format.vcodec === 'none' || format.resolution === 'audio only')
    );
    
    if (!audioFormats || audioFormats.length === 0) {
      console.log('No se encontraron formatos de solo audio, intentando con cualquier formato con audio');
      // Si no hay formato de solo audio, intentamos con cualquier formato que tenga audio
      const anyAudioFormats = info.formats.filter(format => format.acodec !== 'none');
      
      if (!anyAudioFormats || anyAudioFormats.length === 0) {
        throw new Error('No se encontró ningún formato de audio disponible');
      }
      
      // Ordenamos por calidad (bitrate)
      const bestAudio = anyAudioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
      
      return {
        url: bestAudio.url,
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration
      };
    }
    
    // Ordenamos por calidad (bitrate)
    const bestAudio = audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
    
    if (!bestAudio) {
      throw new Error('No se encontró un formato de audio adecuado');
    }
    
    console.log('Mejor formato de audio encontrado, bitrate:', bestAudio.abr || 'desconocido');
    
    return {
      url: bestAudio.url,
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration
    };
  } catch (error) {
    console.error('Error al obtener URL de streaming:', error);
    throw error;
  }
}

/**
 * Busca videos en YouTube por término de búsqueda
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>} Lista de resultados de la búsqueda
 */
async function searchYouTube(searchTerm) {
  try {
    // Verificar que el término de búsqueda sea válido
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
      throw new Error('El término de búsqueda no es válido');
    }
    
    console.log('Buscando:', searchTerm);
    
    // Utilizamos ytsearch para buscar en YouTube
    const results = await ytdlp(
      `ytsearch10:${searchTerm}`, // Limitamos a 10 resultados
      {
        dumpSingleJson: true,
        noPlaylist: true,
        noWarnings: true,
        noCallHome: true,
        flatPlaylist: true,
        noCheckCertificates: true
      }
    );
    
    if (!results || !results.entries || !Array.isArray(results.entries)) {
      console.error('Formato de resultados inesperado:', results);
      throw new Error('No se obtuvieron resultados válidos de la búsqueda');
    }
    
    console.log(`Búsqueda completada. Se encontraron ${results.entries.length} resultados.`);
    
    // Formateamos los resultados
    return results.entries.map(entry => ({
      id: entry.id,
      url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
      title: entry.title || 'Sin título',
      thumbnail: entry.thumbnail || './img/placeholder.svg',
      duration: entry.duration || 0,
      channel: entry.channel || 'Canal desconocido',
      views: entry.view_count || 0
    }));
  } catch (error) {
    console.error('Error al buscar en YouTube:', error);
    throw error;
  }
}

module.exports = { getAudioStreamUrl, searchYouTube }; 