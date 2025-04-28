document.getElementById('descargar').addEventListener('click', async () => {
  const url = document.getElementById('url').value
  const estado = document.getElementById('estado')
  
  try {
    estado.textContent = 'Descargando...'
    const resultado = await window.ApiDescargarMP3.descargarAudio(url)
    estado.textContent = resultado
  } catch (error) {
    estado.textContent = 'Error al descargar.'
  }
})
