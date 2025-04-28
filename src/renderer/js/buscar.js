const audioPlayer = document.getElementById('audio-player');
const playPauseButton = document.getElementById('play-pause');
const playerContainer = document.getElementById('player-container');
const songTitle = document.getElementById('song-title');
const songChannel = document.getElementById('song-channel');
const thumbnail = document.getElementById('thumbnail');
const estado = document.getElementById('estado');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchResults = document.getElementById('search-results');
const resultsContainer = document.getElementById('results-container');
const playIcon = document.querySelector('#play-pause svg');

let currentPlayingCard = null;
let searchResultsData = [];

// Función para formatear la duración del video
function formatDuration(seconds) {
  if (!seconds) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Función para validar URL de YouTube
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
searchButton.addEventListener('click', performSearch);

// También permitir búsqueda al presionar Enter en el input
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// Función para realizar la búsqueda
async function performSearch() {
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    estado.textContent = 'Por favor, ingrese un término de búsqueda';
    return;
  }
  
  try {
    estado.textContent = 'Buscando...';
    resultsContainer.classList.add('hidden');
    playerContainer.classList.add('hidden');
    
    console.log('Enviando solicitud de búsqueda para:', searchTerm);
    
    // Verificar si lo que ingresó el usuario es una URL de YouTube
    if (isValidUrl(searchTerm)) {
      console.log('La entrada es una URL de YouTube, redirigiendo a reproducción directa');
      await playYoutubeUrl(searchTerm);
      return;
    }
    
    // Realizar la búsqueda
    searchResultsData = await window.ApiStreaming.buscarYouTube(searchTerm);
    
    // Limpiar resultados anteriores
    searchResults.innerHTML = '';
    
    if (!searchResultsData || searchResultsData.length === 0) {
      estado.textContent = 'No se encontraron resultados';
      return;
    }
    
    // Mostrar los resultados
    searchResultsData.forEach((result, index) => {
      const resultCard = document.createElement('div');
      resultCard.className = 'result-card';
      resultCard.dataset.index = index;
      
      const thumbnailUrl = result.thumbnail || './img/placeholder.svg';
      
      resultCard.innerHTML = `
        <img src="${thumbnailUrl}" alt="${result.title}" onerror="this.src='./img/placeholder.svg'">
        <div class="result-info">
          <h3 class="result-title">${result.title || 'Sin título'}</h3>
          <p class="result-channel">${result.channel || 'Canal desconocido'}</p>
          <p class="result-duration">${formatDuration(result.duration)}</p>
        </div>
      `;
      
      // Añadir evento de clic para reproducir
      resultCard.addEventListener('click', () => playResult(index));
      
      searchResults.appendChild(resultCard);
    });
    
    // Mostrar la sección de resultados
    resultsContainer.classList.remove('hidden');
    estado.textContent = '';
  } catch (error) {
    console.error('Error completo en búsqueda:', error);
    estado.textContent = `Error: ${error.message || 'No se pudieron obtener resultados'}`;
  }
}

// Función para reproducir una URL de YouTube directamente
async function playYoutubeUrl(url) {
  try {
    if (!isValidUrl(url)) {
      throw new Error('La URL de YouTube no es válida');
    }
    
    estado.textContent = 'Obteniendo información del video...';
    
    console.log('Reproduciendo URL directamente:', url);
    
    // Obtener la URL de streaming
    const streamInfo = await window.ApiStreaming.obtenerStreamUrl(url);
    
    // Resetear cualquier reproducción anterior
    if (currentPlayingCard !== null) {
      const prevCard = document.querySelector(`.result-card[data-index="${currentPlayingCard}"]`);
      if (prevCard) {
        prevCard.classList.remove('playing');
      }
      currentPlayingCard = null;
    }
    
    // Configurar el reproductor
    audioPlayer.src = streamInfo.url;
    songTitle.textContent = streamInfo.title || 'Sin título';
    songChannel.textContent = 'Reproducción directa';
    thumbnail.src = streamInfo.thumbnail || './img/placeholder.svg';
    
    // Mostrar el reproductor
    playerContainer.classList.remove('hidden');
    estado.textContent = '';
    
    // Reproducir automáticamente
    audioPlayer.load();
    await audioPlayer.play();
    updatePlayIcon(false);
  } catch (error) {
    console.error('Error al reproducir URL directamente:', error);
    estado.textContent = `Error: ${error.message || 'No se pudo reproducir el video'}`;
  }
}

// Función para reproducir un resultado
async function playResult(index) {
  const result = searchResultsData[index];
  if (!result || !result.url) {
    estado.textContent = 'Error: No se pudo obtener información del video';
    return;
  }
  
  try {
    estado.textContent = 'Preparando audio...';
    
    // Verificar que la URL sea válida
    if (!isValidUrl(result.url)) {
      console.log('URL del resultado no válida, intentando reconstruir:', result);
      
      // Intentar reconstruir la URL si tenemos el ID
      if (result.id) {
        result.url = `https://www.youtube.com/watch?v=${result.id}`;
        console.log('URL reconstruida:', result.url);
      } else {
        throw new Error('La URL del video no es válida y no se pudo reconstruir');
      }
    }
    
    console.log('Preparando reproducción para URL:', result.url);
    
    // Obtener la URL de streaming
    const streamInfo = await window.ApiStreaming.obtenerStreamUrl(result.url);
    
    if (!streamInfo || !streamInfo.url) {
      throw new Error('No se pudo obtener la URL de streaming');
    }
    
    // Marcar la tarjeta actual como reproduciendo y quitar marca de la anterior
    if (currentPlayingCard !== null) {
      const prevCard = document.querySelector(`.result-card[data-index="${currentPlayingCard}"]`);
      if (prevCard) {
        prevCard.classList.remove('playing');
      }
    }
    
    const newPlayingCard = document.querySelector(`.result-card[data-index="${index}"]`);
    if (newPlayingCard) {
      newPlayingCard.classList.add('playing');
      currentPlayingCard = index;
    }
    
    // Configurar el reproductor
    audioPlayer.src = streamInfo.url;
    songTitle.textContent = result.title || 'Sin título';
    songChannel.textContent = result.channel || 'Canal desconocido';
    thumbnail.src = result.thumbnail || './img/placeholder.svg';
    
    // Mostrar el reproductor
    playerContainer.classList.remove('hidden');
    estado.textContent = '';
    
    // Reproducir automáticamente
    audioPlayer.load();
    try {
      await audioPlayer.play();
      updatePlayIcon(false);
    } catch (playError) {
      console.error('Error al iniciar reproducción:', playError);
      estado.textContent = 'Error al iniciar la reproducción. Intenta manualmente.';
    }
  } catch (error) {
    console.error('Error completo al reproducir:', error);
    estado.textContent = `Error: ${error.message || 'No se pudo reproducir el audio'}`;
  }
}

// Manejar el botón de reproducir/pausar
playPauseButton.addEventListener('click', async () => {
  try {
    if (audioPlayer.paused) {
      await audioPlayer.play();
      updatePlayIcon(false);
    } else {
      audioPlayer.pause();
      updatePlayIcon(true);
    }
  } catch (error) {
    console.error('Error al controlar reproducción:', error);
    estado.textContent = 'Error al reproducir. Intenta nuevamente.';
  }
});

// Actualizar el botón cuando el reproductor se reproduce o pausa
audioPlayer.addEventListener('play', () => {
  updatePlayIcon(false);
});

audioPlayer.addEventListener('pause', () => {
  updatePlayIcon(true);
});

// Manejar errores en la reproducción
audioPlayer.addEventListener('error', (e) => {
  console.error('Error en la reproducción:', e, audioPlayer.error);
  estado.textContent = `Error al reproducir el audio: ${audioPlayer.error ? audioPlayer.error.message : 'Error desconocido'}`;
}); 