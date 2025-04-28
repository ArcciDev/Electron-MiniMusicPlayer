// Elementos del DOM
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const audioPlayer = document.getElementById('audio-player');
const playPauseButton = document.getElementById('play-pause');
const playIcon = document.querySelector('#play-pause svg');
const playerContainer = document.getElementById('player-container');
const songTitle = document.getElementById('song-title');
const songChannel = document.getElementById('song-channel');
const thumbnail = document.getElementById('thumbnail');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const duration = document.getElementById('duration');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const volumeButton = document.getElementById('volumeButton');
const estadoFijo = document.getElementById('estado-fijo');
const notificationBar = document.getElementById('notification-bar');
const searchResults = document.getElementById('search-results');
const resultsContainer = document.getElementById('results-container');
const downloadPath = document.getElementById('download-path');
const changeLocationButton = document.getElementById('change-location');
const appHeader = document.querySelector('.app-header');
const appContainer = document.querySelector('.app-container');

// Botones de la barra lateral
const sidebarButtons = document.querySelectorAll('.sidebar-button');
const pages = document.querySelectorAll('.page');

// Botones de control de ventana
const minimizeBtn = document.getElementById('minimize-btn');
const maximizeBtn = document.getElementById('maximize-btn');
const closeBtn = document.getElementById('close-btn');

// Variables globales
let currentPlayingCard = null;
let searchResultsData = [];

// Funciones de utilidad
// Función para formatear la duración del video
function formatDuration(seconds) {
  if (!seconds) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Genera URL de miniatura directamente a partir del ID de YouTube
 * @param {string} videoId - ID del video de YouTube
 * @param {string} quality - Calidad de la miniatura (default, mqdefault, hqdefault, sddefault, maxresdefault)
 * @returns {string} URL de la miniatura
 */
function getThumbnailUrl(videoId, quality = 'hqdefault') {
  if (!videoId) return './img/placeholder.svg';
  
  // URLs de miniaturas estándar de YouTube
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Procesa una URL de miniatura para asegurar que sea válida
 * @param {string} url - URL de la miniatura
 * @param {string} videoId - ID del video (opcional)
 * @return {string} - URL procesada
 */
function procesarUrlMiniatura(url, videoId) {
  // Si tenemos un ID de video, usar directamente la API de YouTube
  if (videoId) {
    return getThumbnailUrl(videoId);
  }
  
  // Si la URL no es válida, usar el placeholder
  if (!url || typeof url !== 'string') {
    return './img/placeholder.svg';
  }
  
  // Si ya es una ruta relativa a nuestra imagen de placeholder, devolverla directamente
  if (url === './img/placeholder.svg' || url === './img/placeholder.jpg') {
    return url;
  }
  
  // Si tenemos una URL de YouTube con formato conocido, extraer el ID y usar nuestra función
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return getThumbnailUrl(ytMatch[1]);
  }
  
  // Si la URL es de i.ytimg.com, mantenerla como está pero asegurarse de que sea HTTPS
  if (url.includes('i.ytimg.com')) {
    return url.replace('http://', 'https://');
  }
  
  // Para otras URLs, asegurar que usen HTTPS
  if (url.startsWith('http:')) {
    return url.replace('http:', 'https:');
  }
  
  // Para URLs que no son HTTP ni HTTPS, mantener la ruta relativa
  if (!url.startsWith('http')) {
    return url;
  }
  
  return url;
}

/**
 * Maneja errores de carga de imágenes
 * @param {HTMLImageElement} imgElement - Elemento de imagen que falló
 */
function handleImageError(imgElement) {
  console.log('Error al cargar imagen:', imgElement.src);
  
  // Intentar con la URL original si estamos usando una procesada
  const originalSrc = imgElement.getAttribute('data-original-src');
  if (originalSrc && originalSrc !== imgElement.src) {
    console.log('Intentando con URL original:', originalSrc);
    imgElement.src = originalSrc;
    imgElement.onerror = function() {
      // Si falla de nuevo, usar el placeholder
      imgElement.src = './img/placeholder.svg';
      imgElement.onerror = null; // Evitar bucle infinito
    };
    return;
  }
  
  // Si no hay URL original o ya la estamos usando, usar el placeholder
  imgElement.src = './img/placeholder.svg';
  imgElement.onerror = null; // Prevenir bucle infinito
}

/**
 * Verifica si una URL es válida
 * @param {string} url - URL a verificar
 * @return {boolean} - true si es válida
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Función para extraer el ID de YouTube de una URL
function extractYoutubeId(url) {
  if (!url) return null;
  
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match && match[1] ? match[1] : null;
}

// Navegación entre páginas
function initNavigation() {
  // Referencia a la barra de búsqueda
  const searchBarContainer = document.querySelector('.search-bar-container');
  
  sidebarButtons.forEach(button => {
    button.addEventListener('click', () => {
      const pageId = button.getAttribute('data-page');
      
      // Desactivar todos los botones y ocultar todas las páginas
      sidebarButtons.forEach(btn => btn.classList.remove('active'));
      pages.forEach(page => page.classList.add('hidden'));
      
      // Activar el botón y mostrar la página correspondiente
      button.classList.add('active');
      document.getElementById(`${pageId}-page`).classList.remove('hidden');
      
      // Mostrar u ocultar la barra de búsqueda según el botón
      if (pageId === 'home') {
        // Mostrar la barra de búsqueda solo para la página principal
        searchBarContainer.classList.remove('hidden');
      } else {
        // Ocultar la barra de búsqueda para las demás páginas
        searchBarContainer.classList.add('hidden');
      }
    });
  });
}

// Controles de ventana (solo funcionales si se integran con Electron)
function initWindowControls() {
  minimizeBtn.addEventListener('click', () => {
    if (window.ApiElectron && window.ApiElectron.minimizeWindow) {
      window.ApiElectron.minimizeWindow();
    }
  });
  
  maximizeBtn.addEventListener('click', () => {
    if (window.ApiElectron && window.ApiElectron.maximizeWindow) {
      window.ApiElectron.maximizeWindow();
    }
  });
  
  closeBtn.addEventListener('click', () => {
    if (window.ApiElectron && window.ApiElectron.closeWindow) {
      window.ApiElectron.closeWindow();
    }
  });
}

// Función para habilitar el arrastre de la ventana
function initDragWindow() {
  // Simplemente añadir la clase draggable-window al contenedor principal
  // El CSS se encargará del resto
  if (appContainer) {
    appContainer.classList.add('draggable-window');
    console.log('Arrastre de ventana habilitado');
  }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 0) {
  // Referencias a los iconos
  const iconInfo = document.getElementById('icon-info');
  const iconSuccess = document.getElementById('icon-success');
  const iconError = document.getElementById('icon-error');
  const iconWarning = document.getElementById('icon-warning');
  
  // Ocultar todos los iconos primero
  iconInfo.classList.add('hidden');
  iconSuccess.classList.add('hidden');
  iconError.classList.add('hidden');
  iconWarning.classList.add('hidden');
  
  // Mostrar el icono correspondiente al tipo
  switch(tipo) {
    case 'success':
      iconSuccess.classList.remove('hidden');
      break;
    case 'error':
      iconError.classList.remove('hidden');
      break;
    case 'warning':
      iconWarning.classList.remove('hidden');
      break;
    case 'info':
    default:
      iconInfo.classList.remove('hidden');
      break;
  }
  
  // Actualizar el texto de la notificación
  estadoFijo.textContent = mensaje;
  
  // Quitar todas las clases de tipo
  notificationBar.classList.remove('success', 'error', 'warning', 'info');
  
  // Añadir la clase correspondiente al tipo
  if (tipo) {
    notificationBar.classList.add(tipo);
  }
  
  // Mostrar la notificación
  notificationBar.classList.remove('hidden');
  notificationBar.classList.add('visible');
  
  // Si hay una duración especificada, ocultar después de ese tiempo
  if (duracion > 0) {
    setTimeout(() => {
      // Ocultar solo si el mensaje sigue siendo el mismo
      if (estadoFijo.textContent === mensaje) {
        notificationBar.classList.remove('visible');
        notificationBar.classList.add('hidden');
        
        // Limpiar el texto después de la transición
        setTimeout(() => {
          if (estadoFijo.textContent === mensaje) {
            estadoFijo.textContent = '';
          }
        }, 300);
      }
    }, duracion);
  }
}

// Función para ocultar la notificación
function ocultarNotificacion() {
  notificationBar.classList.remove('visible');
  notificationBar.classList.add('hidden');
  
  // Limpiar el texto después de la transición
  setTimeout(() => {
    estadoFijo.textContent = '';
  }, 300);
}

// Función para realizar la búsqueda
async function performSearch() {
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    mostrarNotificacion('Por favor, ingrese un término de búsqueda', 'warning', 3000);
    return;
  }
  
  try {
    mostrarNotificacion('Buscando...', 'info');
    resultsContainer.classList.add('hidden');
    
    // Ocultar el reproductor al iniciar una nueva búsqueda
    playerContainer.classList.add('hidden');
    
    // Restablecer el icono de reproducción si hay alguno activo
    if (audioPlayer && !audioPlayer.paused) {
      audioPlayer.pause();
      updatePlayIcon(true);
    }
    
    // Quitar la clase playing de la tarjeta actual si existe
    if (currentPlayingCard !== null) {
      const card = document.querySelector(`.result-card[data-index="${currentPlayingCard}"]`);
      if (card) {
        card.classList.remove('playing');
      }
      currentPlayingCard = null;
    }
    
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
      mostrarNotificacion('No se encontraron resultados', 'error', 3000);
      return;
    }
    
    // Mostrar los resultados
    searchResultsData.forEach((result, index) => {
      const resultCard = document.createElement('div');
      resultCard.className = 'result-card';
      resultCard.dataset.index = index;
      
      // Procesar la URL de la miniatura
      const thumbnailUrl = procesarUrlMiniatura(result.thumbnail, result.id);
      console.log(`Miniatura para ${result.title}: ${thumbnailUrl}`);
      
      // Crear la estructura de la tarjeta
      const imgElement = document.createElement('img');
      imgElement.alt = result.title || 'Sin título';
      imgElement.setAttribute('data-original-src', result.thumbnail || '');
      imgElement.onerror = function() {
        handleImageError(this);
      };
      imgElement.src = thumbnailUrl;
      
      const infoDiv = document.createElement('div');
      infoDiv.className = 'result-info';
      
      const title = document.createElement('h3');
      title.className = 'result-title';
      title.textContent = result.title || 'Sin título';
      
      const channel = document.createElement('p');
      channel.className = 'result-channel';
      channel.textContent = result.channel || 'Canal desconocido';
      
      const duration = document.createElement('p');
      duration.className = 'result-duration';
      duration.textContent = formatDuration(result.duration);
      
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-button';
      downloadBtn.dataset.index = index;
      downloadBtn.textContent = 'Descargar MP3';
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadAudio(index);
      });
      
      // Añadir elementos a la estructura
      infoDiv.appendChild(title);
      infoDiv.appendChild(channel);
      infoDiv.appendChild(duration);
      infoDiv.appendChild(downloadBtn);
      
      resultCard.appendChild(imgElement);
      resultCard.appendChild(infoDiv);
      
      // Añadir evento de clic para reproducir
      resultCard.addEventListener('click', () => {
        playResult(index);
      });
      
      searchResults.appendChild(resultCard);
    });
    
    // Mostrar la sección de resultados
    resultsContainer.classList.remove('hidden');
    ocultarNotificacion();
  } catch (error) {
    console.error('Error completo en búsqueda:', error);
    mostrarNotificacion(`Error: ${error.message || 'No se pudieron obtener resultados'}`, 'error', 5000);
  }
}

// Función para reproducir una URL de YouTube directamente
async function playYoutubeUrl(url) {
  try {
    if (!isValidUrl(url)) {
      throw new Error('La URL de YouTube no es válida');
    }
    
    mostrarNotificacion('Obteniendo información del video...', 'info');
    
    // Extraer el ID de YouTube
    const videoId = extractYoutubeId(url);
    console.log('ID de YouTube extraído:', videoId);
    
    // Obtener información del video
    const videoInfo = await window.ApiStreaming.obtenerInfoVideo(url);
    console.log('Info del video:', videoInfo);
    
    if (!videoInfo || !videoInfo.title) {
      throw new Error('No se pudo obtener la información del video');
    }
    
    // Obtener la URL de streaming
    const streamInfo = await window.ApiStreaming.obtenerStreamUrl(url);
    
    if (!streamInfo || !streamInfo.url) {
      throw new Error('No se pudo obtener la URL de streaming');
    }
    
    // Actualizar la interfaz
    songTitle.textContent = videoInfo.title || 'Sin título';
    songChannel.textContent = videoInfo.channel || 'Canal desconocido';
    
    // Manejo de la miniatura del reproductor usando el ID extraído
    console.log('Miniatura original:', videoInfo.thumbnail);
    
    // Usar el ID si está disponible, si no intentar extraerlo de nuevo
    const videoIdToUse = videoId || extractYoutubeId(url);
    console.log('Usando ID para miniatura:', videoIdToUse);
    
    const processedThumbnail = procesarUrlMiniatura(videoInfo.thumbnail, videoIdToUse);
    console.log('Miniatura procesada:', processedThumbnail);
    
    // Limpiar cualquier evento anterior para evitar duplicación
    thumbnail.onload = null;
    thumbnail.onerror = function() {
      console.log('Error al cargar miniatura en el reproductor, usando placeholder');
      this.src = './img/placeholder.svg';
      this.onerror = null;
    };
    
    // Asignar la miniatura procesada
    thumbnail.src = processedThumbnail;
    thumbnail.setAttribute('data-original-src', videoInfo.thumbnail || '');
    
    // Configurar el reproductor de audio
    audioPlayer.src = streamInfo.url;
    audioPlayer.load();
    
    // Mostrar el reproductor
    playerContainer.classList.remove('hidden');
    
    // Reproducir automáticamente
    await audioPlayer.play();
    updatePlayIcon(false);
    
    ocultarNotificacion();
    
    // Si estamos reproduciendo desde un enlace directo, creamos un resultado virtual
    // para poder seguir usando las mismas funciones
    searchResultsData = [{
      title: videoInfo.title,
      url: url,
      channel: videoInfo.channel,
      thumbnail: videoInfo.thumbnail,
      id: videoIdToUse,
      duration: videoInfo.duration || 0
    }];
    currentPlayingCard = null; // No hay tarjeta visual
    
    // Ajustar espacio para la barra de scroll
    ajustarEspacioScroll();
    
  } catch (error) {
    console.error('Error al reproducir desde URL:', error);
    mostrarNotificacion(`Error: ${error.message || 'No se pudo reproducir el audio'}`, 'error', 5000);
  }
}

// Función para reproducir un resultado
async function playResult(index) {
  const result = searchResultsData[index];
  if (!result || !result.url) {
    mostrarNotificacion('Error: No se pudo obtener información del video', 'error', 3000);
    return;
  }
  
  try {
    mostrarNotificacion('Preparando audio...', 'info');
    
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
    
    // Extraer o utilizar el ID existente
    const videoId = result.id || extractYoutubeId(result.url);
    console.log('ID de YouTube para reproducción:', videoId);
    
    // Obtener la URL de streaming
    const streamInfo = await window.ApiStreaming.obtenerStreamUrl(result.url);
    
    if (!streamInfo || !streamInfo.url) {
      throw new Error('No se pudo obtener la URL de streaming');
    }
    
    // Si había un resultado reproduciéndose, quitarle la clase playing
    if (currentPlayingCard !== null) {
      const prevCard = document.querySelector(`.result-card[data-index="${currentPlayingCard}"]`);
      if (prevCard) {
        prevCard.classList.remove('playing');
      }
    }
    
    // Marcar la tarjeta actual como reproduciéndose
    const currentCard = document.querySelector(`.result-card[data-index="${index}"]`);
    if (currentCard) {
      currentCard.classList.add('playing');
    }
    currentPlayingCard = index;
    
    // Actualizar información en el reproductor
    songTitle.textContent = result.title || 'Sin título';
    songChannel.textContent = result.channel || 'Canal desconocido';
    
    // Manejo de la miniatura del reproductor usando ID
    console.log('Miniatura original en reproducción:', result.thumbnail);
    
    // Si tenemos ID, usar directamente la API de YouTube para la miniatura
    const processedThumbnail = procesarUrlMiniatura(result.thumbnail, videoId);
    console.log('Miniatura procesada en reproducción:', processedThumbnail);
    
    // Limpiar cualquier evento anterior para evitar duplicación
    thumbnail.onload = null;
    thumbnail.onerror = function() {
      console.log('Error al cargar miniatura en el reproductor, usando placeholder');
      this.src = './img/placeholder.svg';
      this.onerror = null;
    };
    
    // Asignar la miniatura procesada
    thumbnail.src = processedThumbnail;
    thumbnail.setAttribute('data-original-src', result.thumbnail || '');
    
    // Configurar el reproductor de audio
    audioPlayer.src = streamInfo.url;
    audioPlayer.load();
    
    // Mostrar el reproductor con una transición suave
    playerContainer.classList.remove('hidden');
    
    // Reproducir automáticamente
    await audioPlayer.play();
    updatePlayIcon(false); // Actualizar icono a pausa
    
    ocultarNotificacion();
    
    // Ajustar espacio para la barra de scroll
    ajustarEspacioScroll();
    
  } catch (error) {
    console.error('Error al reproducir audio:', error);
    mostrarNotificacion(`Error: ${error.message || 'No se pudo reproducir el audio'}`, 'error', 5000);
  }
}

// Función para descargar audio
async function downloadAudio(index) {
  const result = searchResultsData[index];
  if (!result || !result.url) {
    mostrarNotificacion('Error: No se pudo obtener información del video', 'error', 3000);
    return;
  }
  
  try {
    mostrarNotificacion(`Descargando "${result.title}"...`, 'info');
    
    // Verificar que la URL sea válida
    if (!isValidUrl(result.url)) {
      // Intentar reconstruir la URL si tenemos el ID
      if (result.id) {
        result.url = `https://www.youtube.com/watch?v=${result.id}`;
      } else {
        throw new Error('La URL del video no es válida');
      }
    }
    
    // Iniciar la descarga
    const descargaResult = await window.ApiDescargarMP3.descargarAudio(result.url);
    
    if (descargaResult === 'Descarga completada') {
      mostrarNotificacion(descargaResult, 'success', 3000);
    } else {
      mostrarNotificacion(descargaResult, 'info', 5000);
    }
  } catch (error) {
    console.error('Error al descargar:', error);
    mostrarNotificacion(`Error: ${error.message || 'No se pudo descargar el audio'}`, 'error', 5000);
  }
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

// Manejar el botón de reproducir/pausar
playPauseButton.addEventListener('click', async () => {
  try {
    if (audioPlayer.paused) {
      await audioPlayer.play();
      updatePlayIcon(false); // Pausa
    } else {
      audioPlayer.pause();
      updatePlayIcon(true); // Reproducir
    }
  } catch (error) {
    console.error('Error al controlar reproducción:', error);
    mostrarNotificacion('Error al reproducir. Intenta nuevamente.', 'error', 5000);
  }
});

// Actualizar el botón cuando el reproductor se reproduce o pausa
audioPlayer.addEventListener('play', () => {
  updatePlayIcon(false); // Pausa
});

audioPlayer.addEventListener('pause', () => {
  updatePlayIcon(true); // Reproducir
});

// Actualizar la barra de progreso
audioPlayer.addEventListener('timeupdate', () => {
  const currentTime = audioPlayer.currentTime;
  const durationTime = audioPlayer.duration || 1;
  const progressPercent = (currentTime / durationTime) * 100;
  progress.style.width = `${progressPercent}%`;
  
  // Actualizar el tiempo mostrado con formato más compacto
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const totalMinutes = Math.floor(durationTime / 60);
  const totalSeconds = Math.floor(durationTime % 60);
  
  // Formato aún más compacto
  duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Permitir clic en la barra de progreso para cambiar la posición
progressBar.addEventListener('click', (e) => {
  const progressBarWidth = progressBar.clientWidth;
  const clickPosition = e.offsetX;
  const seekTime = (clickPosition / progressBarWidth) * audioPlayer.duration;
  audioPlayer.currentTime = seekTime;
});

// Botón anterior - por ahora solo reinicia la canción
prevButton.addEventListener('click', () => {
  audioPlayer.currentTime = 0;
});

// Botón siguiente - por ahora solo avanza 10 segundos
nextButton.addEventListener('click', () => {
  audioPlayer.currentTime = Math.min(audioPlayer.currentTime + 10, audioPlayer.duration);
});

// Botón de volumen - por ahora solo silencia/activa el sonido
volumeButton.addEventListener('click', () => {
  audioPlayer.muted = !audioPlayer.muted;
  volumeButton.style.color = audioPlayer.muted ? '#ff5252' : '#6c7280';
});

// Manejar errores en la reproducción
audioPlayer.addEventListener('error', (e) => {
  console.error('Error en la reproducción:', e, audioPlayer.error);
  mostrarNotificacion(`Error al reproducir el audio: ${audioPlayer.error ? audioPlayer.error.message : 'Error desconocido'}`, 'error', 5000);
});

// Cambiar ubicación de descarga


// Manejador para el botón de búsqueda
searchButton.addEventListener('click', performSearch);

// También permitir búsqueda al presionar Enter en el input
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// Cuando la canción termina, ocultar el reproductor
audioPlayer.addEventListener('ended', () => {
  // Ocultar el reproductor al finalizar la reproducción
  playerContainer.classList.add('hidden');
  
  // Restablecer el icono de reproducción
  updatePlayIcon(true);
  
  // Quitar la clase playing de la tarjeta actual
  if (currentPlayingCard !== null) {
    const card = document.querySelector(`.result-card[data-index="${currentPlayingCard}"]`);
    if (card) {
      card.classList.remove('playing');
    }
    currentPlayingCard = null;
  }
  
  // Ajustar espacio para la barra de scroll
  ajustarEspacioScroll();
});

// Función para ajustar el espacio de la barra de scroll
function ajustarEspacioScroll() {
  // Crear o actualizar una regla de estilo personalizada
  let style = document.getElementById('scroll-adjuster');
  if (!style) {
    style = document.createElement('style');
    style.id = 'scroll-adjuster';
    document.head.appendChild(style);
  }
  
  if (playerContainer && !playerContainer.classList.contains('hidden')) {
    // Si el reproductor está visible, ajustar margen inferior
    style.textContent = '::-webkit-scrollbar-track { margin-bottom: 98px !important; }';
  } else {
    // Si está oculto, volver al valor original
    style.textContent = '::-webkit-scrollbar-track { margin-bottom: 8px !important; }';
  }
}

// Observar cambios en la visibilidad del reproductor
const observarReproductor = new MutationObserver(ajustarEspacioScroll);

// Detectar la visibilidad del reproductor y ajustar el padding del contenedor principal
function ajustarScrollBarElectron() {
  const reproductor = document.getElementById('player-container');
  const appContent = document.querySelector('.app-content'); // Contenedor principal de la scrollbar

  if (reproductor && !reproductor.classList.contains('hidden')) {
    const alturaReproductor = reproductor.offsetHeight;
    appContent.style.paddingBottom = `${alturaReproductor}px`;
  } else {
    appContent.style.paddingBottom = '0';
  }
}

// Observar cambios en la clase del reproductor
const observerElectron = new MutationObserver(ajustarScrollBarElectron);
const reproductorElectron = document.getElementById('player-container');
if (reproductorElectron) {
  observerElectron.observe(reproductorElectron, { attributes: true, attributeFilter: ['class'] });
}

// Ajustar al cargar la página
window.addEventListener('load', ajustarScrollBarElectron);

// Función para inicializar la aplicación
function init() {
  console.log('Inicializando aplicación...');
  
  // Asegurarse de que el reproductor esté oculto al inicio
  playerContainer.classList.add('hidden');
  
  // Inicializar barra de notificaciones
  notificationBar.classList.add('hidden');
  notificationBar.classList.remove('visible');
  
  // Inicializar observer para el reproductor
  observarReproductor.observe(playerContainer, { attributes: true, attributeFilter: ['class'] });
  
  // Ajustar inicialmente el espacio de scroll
  ajustarEspacioScroll();
  
  // Inicializar thumbnail del reproductor
  if (thumbnail) {
    thumbnail.onerror = function() {
      console.log('Error al cargar miniatura inicial, usando placeholder');
      this.src = './img/placeholder.svg';
      this.onerror = null;
    };
    
    // Asegurarse de que la miniatura tenga una imagen por defecto válida
    if (!thumbnail.src || thumbnail.src === 'about:blank') {
      thumbnail.src = './img/placeholder.svg';
    }
  }
  
  // Verificar si la barra de búsqueda debe estar visible al inicio
  const activeButton = document.querySelector('.sidebar-button.active');
  const searchBarContainer = document.querySelector('.search-bar-container');
  
  if (activeButton && activeButton.getAttribute('data-page') !== 'home') {
    searchBarContainer.classList.add('hidden');
  } else {
    searchBarContainer.classList.remove('hidden');
  }
  
  // Agregar los event listeners y configuración inicial
  initNavigation();
  initWindowControls();
  initDragWindow(); // Inicializar función para arrastrar ventana
  
  // Ocultar páginas que corresponden a botones eliminados
  const downloadPage = document.getElementById('download-page');
  const searchPage = document.getElementById('search-page');
  
  if (downloadPage) downloadPage.classList.add('hidden');
  if (searchPage) searchPage.classList.add('hidden');
  
  // Event listeners
  searchButton.addEventListener('click', performSearch);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  changeLocationButton.addEventListener('click', async () => {
    try {
      if (window.ApiElectron && window.ApiElectron.selectDirectory) {
        const newPath = await window.ApiElectron.selectDirectory();
        if (newPath) {
          downloadPath.textContent = `Carpeta de destino: ${newPath}`;
          mostrarNotificacion('Ubicación de descarga actualizada', 'success', 3000);
        }
      } else {
        mostrarNotificacion('Esta función solo está disponible en la aplicación de escritorio', 'warning', 3000);
      }
    } catch (error) {
      console.error('Error al cambiar ubicación:', error);
      mostrarNotificacion(`Error al cambiar ubicación: ${error.message}`, 'error', 5000);
    }
  });
  
  // Si hay una ruta de descarga guardada, mostrarla
  if (window.ApiElectron && window.ApiElectron.getDownloadPath) {
    window.ApiElectron.getDownloadPath().then(path => {
      if (path) {
        downloadPath.textContent = `Carpeta de destino: ${path}`;
      }
    }).catch(console.error);
  }
  
}

// Función para precargar imágenes
function precargarImagenes() {
  // Precargar la imagen de placeholder
  const preloadImg = new Image();
  preloadImg.src = './img/placeholder.svg';
  console.log('Precargando imagen placeholder:', preloadImg.src);
}

// Iniciar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  // Precargar imágenes primero
  precargarImagenes();
  
  // Luego inicializar la aplicación
  init();
  
  console.log('DOM cargado completamente');
});