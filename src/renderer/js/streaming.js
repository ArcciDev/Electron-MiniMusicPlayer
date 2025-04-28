const audioPlayer = document.getElementById('audio-player');
const playPauseButton = document.getElementById('play-pause');
const playerContainer = document.getElementById('player-container');
const songTitle = document.getElementById('song-title');
const thumbnail = document.getElementById('thumbnail');
const estado = document.getElementById('estado');
const playIcon = document.querySelector('#play-pause svg');

// Función para validar URL
function isValidUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  
  try {
    // Verificar que sea una URL de YouTube válida
    // Acepta URLs de tipo youtube.com/watch?v=ID, youtu.be/ID y youtube.com/v/ID
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(url);
  } catch (e) {
    console.error('Error al validar URL:', e);
    return false;
  }
}

// Función para extraer el ID de YouTube de una URL
function extractYoutubeId(url) {
  if (!url) return null;
  
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match && match[1] ? match[1] : null;
}

// Función para actualizar el icono de reproducción/pausa
function updatePlayIcon(isPlaying) {
  if (isPlaying) {
    // Cambiar a icono de reproducción (triángulo)
    playIcon.innerHTML = `
      <polygon points="7 3 19.5 12 6 20 6 3"></polygon>
    `;
  } else {
    // Cambiar a icono de pausa (dos barras)
    playIcon.innerHTML = `
      <rect x="5" y="4" width="4" height="16"></rect>
      <rect x="13" y="4" width="4" height="16"></rect>
    `;
  }
}

// Manejador para el botón de búsqueda
document.getElementById('buscar').addEventListener('click', async () => {
  const url = document.getElementById('url').value.trim();
  
  if (!url) {
    estado.textContent = 'Por favor, introduce una URL válida';
    return;
  }
  
  if (!isValidUrl(url)) {
    estado.textContent = 'Por favor, introduce una URL de YouTube válida';
    return;
  }
  
  try {
    estado.textContent = 'Obteniendo información de audio...';
    playerContainer.classList.add('hidden');
    
    console.log('Enviando solicitud para URL:', url);
    
    // Obtener la URL de streaming
    const streamInfo = await window.ApiStreaming.obtenerStreamUrl(url);
    
    if (!streamInfo || !streamInfo.url) {
      throw new Error('No se pudo obtener la URL de streaming');
    }
    
    // Configurar el reproductor con la URL obtenida
    audioPlayer.src = streamInfo.url;
    songTitle.textContent = streamInfo.title || 'Sin título';
    thumbnail.src = streamInfo.thumbnail || './img/placeholder.svg';
    
    // Mostrar el reproductor
    playerContainer.classList.remove('hidden');
    estado.textContent = '';
    
    // Precargar el audio
    audioPlayer.load();
  } catch (error) {
    console.error('Error completo:', error);
    estado.textContent = `Error: ${error.message || 'No se pudo obtener el stream'}`;
  }
});

// Manejar el botón de reproducir/pausar
playPauseButton.addEventListener('click', async () => {
  try {
    if (audioPlayer.paused) {
      await audioPlayer.play();
      updatePlayIcon(false); // Cambiar a icono de pausa
    } else {
      audioPlayer.pause();
      updatePlayIcon(true); // Cambiar a icono de reproducción
    }
  } catch (error) {
    console.error('Error al controlar reproducción:', error);
    estado.textContent = 'Error al reproducir. Intenta nuevamente.';
  }
});

// Actualizar el botón cuando el reproductor se reproduce o pausa
audioPlayer.addEventListener('play', () => {
  updatePlayIcon(false); // Cambiar a icono de pausa
});

audioPlayer.addEventListener('pause', () => {
  updatePlayIcon(true); // Cambiar a icono de reproducción
});

// Manejar errores en la reproducción
audioPlayer.addEventListener('error', (e) => {
  console.error('Error en la reproducción:', e, audioPlayer.error);
  estado.textContent = `Error al reproducir el audio: ${audioPlayer.error ? audioPlayer.error.message : 'Error desconocido'}`;
}); 